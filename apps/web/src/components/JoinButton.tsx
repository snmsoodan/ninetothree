"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@ninetothree/ui";

/**
 * The one action on the join page.
 *
 * On success it goes to the dashboard rather than reloading, because the
 * household has changed underneath the page and a reload would show the old
 * one for a moment.
 */
export function JoinButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function join() {
    setBusy(true);
    setProblem(null);
    const response = await fetch("/api/household/invites/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (response.ok) {
      router.push("/");
      router.refresh();
      return;
    }
    setBusy(false);
    setProblem(
      response.status === 404
        ? "That link has been used or has run out. Ask for a new one — nothing is lost."
        : "We could not do that just now. Try again in a moment.",
    );
  }

  return (
    <>
      <Button variant="primary" size="lg" block className="mt-6" disabled={busy} onClick={join}>
        {busy ? "Joining" : "Join this household"}
      </Button>
      {problem ? (
        <p role="alert" className="mt-3 text-sm text-clay-strong">
          {problem}
        </p>
      ) : null}
    </>
  );
}
