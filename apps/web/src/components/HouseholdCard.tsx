"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Dialog, TextLink } from "@ninetothree/ui";

import { HouseholdList, type HouseholdMember, type HouseholdRole } from "./HouseholdList";

export interface Household {
  id: string;
  role: HouseholdRole;
  members: HouseholdMember[];
}

/**
 * Who is in the household, and the way out of it.
 *
 * Leaving is behind a confirmation because it is the one action on this page
 * that cannot be undone from the page. Leaving the last household is not an
 * error: the server gives you a fresh one of your own, and the card shows it.
 */
export function HouseholdCard() {
  const { status } = useSession();
  const [household, setHousehold] = useState<Household | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/household");
    if (!response.ok) {
      setFailed(true);
      return;
    }
    setHousehold((await response.json()) as Household);
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  if (status === "loading") {
    return <p className="text-base text-ink-muted">One moment.</p>;
  }

  if (status !== "authenticated") {
    return (
      <p className="text-base text-ink-muted">
        A household is what lets two people see the same dates.{" "}
        <TextLink href="/signin">Sign in to set one up</TextLink>
      </p>
    );
  }

  if (failed) {
    return (
      <p className="text-base text-ink-muted">
        We could not read your household just now. Reloading the page usually settles it.
      </p>
    );
  }

  if (!household) {
    return <p className="text-base text-ink-muted">One moment.</p>;
  }

  return (
    <>
      <HouseholdList members={household.members} />

      <div className="mt-4">
        <Button variant="quiet" size="sm" onClick={() => setConfirmOpen(true)}>
          Leave household
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Leave this household?"
        description="You will stop seeing the shared dates and appointments."
        footer={
          <>
            <Button variant="quiet" onClick={() => setConfirmOpen(false)}>
              Stay
            </Button>
            <Button
              disabled={leaving}
              onClick={async () => {
                setLeaving(true);
                const response = await fetch("/api/household/membership", { method: "DELETE" });
                setLeaving(false);
                setConfirmOpen(false);
                if (response.ok) {
                  setHousehold(null);
                  setFailed(false);
                  await load();
                } else {
                  setFailed(true);
                }
              }}
            >
              Leave
            </Button>
          </>
        }
      >
        <p className="text-base text-ink-muted">
          Your own pins and progress stay on this device. If you are the last person here, the
          household goes with you.
        </p>
      </Dialog>
    </>
  );
}
