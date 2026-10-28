"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Card, CardBody } from "@ninetothree/ui";

import { PRICE_LABEL } from "@/lib/pricing";

interface Billing {
  plan: "free" | "plus" | "family" | "b2b";
  status: string;
  entitlements: {
    fullTimeline: boolean;
    pinLimit: number | null;
    partner: boolean;
    offline: boolean;
    print: boolean;
  };
  configured: boolean;
}

type State =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "ready"; billing: Billing }
  | { kind: "failed" };

const PLAN_NAME: Record<Billing["plan"], string> = {
  free: "Free",
  plus: "Plus",
  family: "Family",
  b2b: "For a practice",
};

/**
 * What this household has bought, and what that gets it.
 *
 * The list is written from the entitlements the server sent, not from a copy of
 * the rules kept here — the paywall and this card must not be able to disagree
 * about what "plus" means.
 *
 * Plus is one payment, so there is nothing to manage afterwards: no renewal
 * date, no cancel button, no "your card expires in March". Saying that plainly
 * is the whole of this card's paid state.
 *
 * When billing is not configured the card says so and offers no button. A
 * button that opens a checkout that cannot exist is worse than no button.
 */
export function PlanCard() {
  const { status } = useSession();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);

  // Stripe sends them back to `/settings?billing=done`. Read on the client, in
  // an effect, so this component needs no Suspense boundary to be prerendered.
  useEffect(() => {
    setJustPaid(new URLSearchParams(window.location.search).get("billing") === "done");
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setState({ kind: "signed-out" });
      return;
    }
    let live = true;
    void (async () => {
      try {
        const response = await fetch("/api/billing");
        if (!live) return;
        if (response.status === 401) {
          setState({ kind: "signed-out" });
          return;
        }
        if (!response.ok) {
          setState({ kind: "failed" });
          return;
        }
        setState({ kind: "ready", billing: (await response.json()) as Billing });
      } catch {
        if (live) setState({ kind: "failed" });
      }
    })();
    return () => {
      live = false;
    };
  }, [status]);

  async function go(): Promise<void> {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      if (!response.ok) {
        setNote("We could not open that just now. Try again in a moment.");
        return;
      }
      const { url } = (await response.json()) as { url?: string };
      if (url) window.location.assign(url);
    } catch {
      setNote("We could not open that just now. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  if (state.kind === "loading") {
    return (
      <Card>
        <CardBody>
          <p className="text-base text-ink-muted">One moment.</p>
        </CardBody>
      </Card>
    );
  }

  if (state.kind === "signed-out") {
    return (
      <Card>
        <CardBody>
          <p className="text-base text-ink-muted">
            You are not signed in. Everything you can read now, you can read without an account.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (state.kind === "failed") {
    return (
      <Card>
        <CardBody>
          <p className="text-base text-ink-muted">
            We could not read your plan just now. Reloading the page usually settles it.
          </p>
        </CardBody>
      </Card>
    );
  }

  const { billing } = state;
  const paid = billing.plan !== "free";
  const includes = [
    billing.entitlements.fullTimeline
      ? "Every week, from now to three"
      : "This week and the next few",
    billing.entitlements.pinLimit === null
      ? "As many pins as you like"
      : `Up to ${billing.entitlements.pinLimit} pins`,
    billing.entitlements.partner ? "A partner, with their own way in" : "One person",
    billing.entitlements.offline ? "Works without a signal" : "Needs a connection",
    billing.entitlements.print ? "Print the week and the checklists" : "Read on screen",
  ];

  return (
    <Card>
      <CardBody>
        <p className="text-base text-ink">
          You are on <strong className="font-semibold">{PLAN_NAME[billing.plan]}</strong>.
        </p>
        <ul className="mt-3 space-y-1 text-base text-ink-muted">
          {includes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-base text-ink-muted">
          The red flags, the safety pages and the recall feed are never behind any of this.
        </p>

        {paid ? (
          <p className="mt-4 text-base text-ink-muted">
            Paid once. Nothing renews, and there is nothing to cancel.
          </p>
        ) : billing.configured ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={() => void go()} disabled={busy}>
              {busy ? "Opening" : `Pay ${PRICE_LABEL}, once`}
            </Button>
            <p className="text-base text-ink-muted">One payment. It does not renew.</p>
          </div>
        ) : (
          <p className="mt-4 text-base text-ink-muted">
            Payments are not open yet. Everything here is free until they are, and nothing you have
            now will be taken away.
          </p>
        )}

        {justPaid && paid ? (
          <p role="status" className="mt-3 text-base text-ink">
            Thank you. The payment went through, and the whole guide is open.
          </p>
        ) : null}

        {note ? (
          <p role="status" className="mt-3 text-base text-ink-muted">
            {note}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
