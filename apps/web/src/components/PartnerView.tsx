"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Card, CardBody } from "@ninetothree/ui";

import type { HelpItem } from "./HelpThisWeek";
import type { JobStatus } from "./JobList";
import { TogetherBody, type TogetherPayload } from "./TogetherBody";

export type { TogetherAppointment, TogetherMember, TogetherPayload } from "./TogetherBody";

export interface PartnerViewProps {
  /** The stage the person carrying the pregnancy is on, from their own device. */
  stageId?: string;
}

/**
 * The page for the person who is not carrying it.
 *
 * It is the same page for everybody in the household — a parent can open it to
 * see what their partner sees, which is the only way to know whether it is
 * useful. What it never shows is a note, a mood score or a private answer,
 * because none of those are in the payload.
 *
 * The session is read before the request is made, not after it comes back 401.
 * A signed-out visitor is the common case for a link somebody shared, and a
 * request that is certain to be refused is a console error on a page that has
 * nothing wrong with it.
 */
export function PartnerView({ stageId }: PartnerViewProps) {
  const { status } = useSession();
  const [data, setData] = useState<TogetherPayload | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "signed-out" | "failed">("loading");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setState("signed-out");
      return;
    }
    let live = true;
    const query = stageId ? `?stage=${encodeURIComponent(stageId)}` : "";
    fetch(`/api/household/together${query}`)
      .then(async (response) => {
        if (!live) return;
        if (response.status === 401) {
          setState("signed-out");
          return;
        }
        if (!response.ok) {
          setState("failed");
          return;
        }
        setData((await response.json()) as TogetherPayload);
        setState("ready");
      })
      .catch(() => {
        if (live) setState("failed");
      });
    return () => {
      live = false;
    };
  }, [stageId, status, nonce]);

  /**
   * Every action re-reads rather than patching the local copy. A job is a fact
   * two people share, and the other person may have moved it a second ago.
   */
  const assign = useCallback(
    async (item: HelpItem, to: string, packId: string | null, packTitle: string | null) => {
      await fetch("/api/household/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          title: item.title,
          packId,
          packTitle,
          assignedTo: to,
        }),
      }).catch(() => undefined);
      setNonce((n) => n + 1);
    },
    [],
  );

  const setJobStatus = useCallback(async (id: string, next: JobStatus) => {
    await fetch(`/api/household/jobs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => undefined);
    setNonce((n) => n + 1);
  }, []);

  const removeJob = useCallback(async (id: string) => {
    await fetch(`/api/household/jobs/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(
      () => undefined,
    );
    setNonce((n) => n + 1);
  }, []);

  if (state === "loading") {
    return <p className="text-base text-ink-muted">One moment.</p>;
  }

  if (state === "signed-out") {
    return (
      <Card tone="sunken">
        <CardBody className="pt-5">
          <p className="text-base text-ink">Sign in to see this.</p>
          <p className="mt-1 text-base text-ink-muted">
            This page is about the people you share the dates with, so it needs to know who you are.
          </p>
          <Link
            href="/signin?callbackUrl=/together"
            className="mt-3 inline-block text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Sign in
          </Link>
        </CardBody>
      </Card>
    );
  }

  if (state === "failed" || !data) {
    return (
      <Card tone="sunken">
        <CardBody className="pt-5">
          <p className="text-base text-ink">We could not read this just now.</p>
          <p className="mt-1 text-base text-ink-muted">Reloading the page usually settles it.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <TogetherBody
      data={data}
      onAssign={assign}
      onJobStatus={setJobStatus}
      onJobRemove={removeJob}
    />
  );
}
