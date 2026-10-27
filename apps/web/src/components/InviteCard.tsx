"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, TextLink } from "@ninetothree/ui";

import { useEntitlements } from "@/lib/entitlements";
import { formatDate } from "@/lib/i18n";
import { Paywall } from "./Paywall";
import { ROLE_LABEL, type HouseholdRole } from "./HouseholdList";

interface Invite {
  id: string;
  role: HouseholdRole;
  expiresAt: string;
}

const INVITABLE: HouseholdRole[] = ["partner", "grandparent", "carer", "parent"];

const SELECT =
  "mt-2 w-full rounded-md border border-line-strong bg-paper-raised px-4 py-3 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay";

function when(iso: string): string {
  return formatDate(iso, { month: "long", day: "numeric" });
}

/**
 * Inviting someone into the household.
 *
 * The link is shown once, because the token is not stored — only its hash is.
 * That is the same bargain a password reset makes, and it is why the copy is
 * "copy it now" rather than "we will email it to you".
 */
export function InviteCard() {
  const { status } = useSession();
  const { entitlements, known } = useEntitlements();
  // Nothing is gated while the plan is still loading, and a household that
  // already has a second adult keeps its links: taking a shared calendar away
  // from a family that relies on it is not a thing this product does.
  const canInvite = !known || entitlements.partner;
  const [role, setRole] = useState<HouseholdRole>("partner");
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/household/invites");
    if (!response.ok) return;
    const body = (await response.json()) as { invites: Invite[] };
    setInvites(body.invites);
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  if (status !== "authenticated") {
    return (
      <p className="text-base text-ink-muted">
        <TextLink href="/signin">Sign in</TextLink> to invite someone into your household.
      </p>
    );
  }

  async function create() {
    setBusy(true);
    setProblem(null);
    setCopied(false);
    const response = await fetch("/api/household/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusy(false);
    if (!response.ok) {
      setProblem(
        response.status === 403
          ? "Only a parent can invite someone."
          : "We could not make a link just now. Try again in a moment.",
      );
      return;
    }
    const body = (await response.json()) as { url: string };
    setLink(`${window.location.origin}${body.url}`);
    await load();
  }

  async function revoke(id: string) {
    const response = await fetch(`/api/household/invites/${id}`, { method: "DELETE" });
    if (response.ok) await load();
  }

  return (
    <>
      {canInvite ? (
        <>
          <p className="text-base text-ink-muted">
            A link lets one person join this household, once. It runs out after a week, and you can
            revoke it before then.
          </p>

          <div className="mt-4">
            <label htmlFor="invite-role" className="text-sm font-medium text-ink-muted">
              They join as
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value as HouseholdRole)}
              className={SELECT}
            >
              {INVITABLE.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABEL[value]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <Button variant="primary" size="sm" disabled={busy} onClick={create}>
              {busy ? "Making a link" : "Make a link"}
            </Button>
          </div>
        </>
      ) : (
        <Paywall
          title="Inviting someone is part of Plus."
          body="A second adult can see the week's jobs and the things you choose to share."
          free="Your own notes, your own progress and everything about safety stay yours either way."
        />
      )}

      {problem ? (
        <p role="alert" className="mt-3 text-sm text-clay-strong">
          {problem}
        </p>
      ) : null}

      {link ? (
        <div className="mt-4 rounded-md border border-line-strong bg-paper-raised p-4">
          <p className="text-sm font-medium text-ink">Copy this now — it is the only copy.</p>
          <p className="mt-2 break-all font-mono text-sm text-ink-muted">{link}</p>
          <div className="mt-3">
            <Button
              variant="quiet"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopied(true);
              }}
            >
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>
      ) : null}

      {invites && invites.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-ink">Links that still work</h3>
          <ul className="mt-2 space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted"
              >
                <span>
                  {ROLE_LABEL[invite.role]} · until {when(invite.expiresAt)}
                </span>
                <Button variant="quiet" size="sm" onClick={() => revoke(invite.id)}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
