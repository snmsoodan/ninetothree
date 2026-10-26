"use client";

import { useCallback, useEffect, useState } from "react";

export interface HouseholdMember {
  userId: string;
  role: "parent" | "partner" | "grandparent" | "carer";
  email: string;
  name: string | null;
  isYou: boolean;
}

export interface HouseholdJob {
  id: string;
  title: string;
  packTitle: string | null;
}

export interface Household {
  id: string;
  role: HouseholdMember["role"];
  members: HouseholdMember[];
  sharedItemIds: string[];
  /** Open jobs somebody handed to you. */
  jobsForYou: HouseholdJob[];
}

export interface ShareablePin {
  id: string;
  title: string;
  packId: string;
  packTitle: string;
}

export interface UseHousehold {
  household: Household | null;
  /** Shares or unshares a pin, then re-reads so the list matches the server. */
  share: (pin: ShareablePin, shared: boolean) => Promise<void>;
}

/**
 * The household, read once per mount.
 *
 * Signed out is not an error here: the dashboard works without an account, and
 * a person who has not signed in simply has no household to share with. So a
 * 401 resolves to `null` rather than to a failure state.
 */
export function useHousehold(): UseHousehold {
  const [household, setHousehold] = useState<Household | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;
    fetch("/api/household")
      .then(async (response) => {
        if (!live || !response.ok) return;
        setHousehold((await response.json()) as Household);
      })
      .catch(() => {
        // A household that cannot be read is the same as no household for the
        // purposes of this page: nothing to share with, nothing to link to.
      });
    return () => {
      live = false;
    };
  }, [nonce]);

  const share = useCallback(async (pin: ShareablePin, shared: boolean) => {
    await fetch("/api/household/pins", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemId: pin.id,
        title: pin.title,
        packId: pin.packId,
        packTitle: pin.packTitle,
        shared,
      }),
    }).catch(() => undefined);
    setNonce((n) => n + 1);
  }, []);

  return { household, share };
}
