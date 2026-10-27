"use client";

import { SessionContext } from "next-auth/react";
import { useCallback, useContext, useEffect, useState } from "react";

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
 *
 * The session is checked *before* asking, though, because a 401 on a page that
 * has nothing wrong with it is a red line in every console a parent or a
 * developer will ever open. `/api/household` answers 401 for a signed-out
 * visitor on purpose — "nobody" and "we do not know who you are" are different
 * answers — so the honest client is the one that does not ask. Reading the
 * context rather than `useSession()` keeps this usable in tests and stories
 * with no `<SessionProvider />`, where "no provider" means signed out.
 */
export function useHousehold(): UseHousehold {
  const session = useContext(SessionContext);
  const status = session?.status ?? "unauthenticated";
  const [household, setHousehold] = useState<Household | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
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
  }, [nonce, status]);

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
