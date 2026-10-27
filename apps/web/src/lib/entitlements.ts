"use client";

import { FREE, type Entitlements } from "@ninetothree/db/entitlements";
import { SessionContext } from "next-auth/react";
import { useContext, useEffect, useSyncExternalStore } from "react";

export interface UseEntitlements {
  /** What this household can do. `FREE` until we know otherwise. */
  entitlements: Entitlements;
  /**
   * Whether we actually know. Nothing is gated while this is false, because
   * the one mistake worth avoiding is taking a week away from somebody who
   * paid for it.
   */
  known: boolean;
}

/**
 * One read of `/api/billing` per page load, shared by every caller.
 *
 * The plan is the same for the whole page, so a module-level cache means the
 * week card, the pin button and the print sheet do not each ask. It is not
 * invalidated: upgrading or cancelling both leave the site for Stripe and come
 * back with a full page load, which reloads this module.
 */
let cached: Entitlements | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): Entitlements | null {
  return cached;
}

function publish(value: Entitlements): void {
  cached = value;
  for (const listener of listeners) listener();
}

function load(): Promise<void> {
  if (inflight) return inflight;
  inflight = fetch("/api/billing")
    .then(async (response) => {
      // A refusal or a bad response leaves us not knowing, which gates
      // nothing. Guessing "free" here would punish a paid household for a
      // dropped connection.
      if (!response.ok) return;
      const body = (await response.json()) as { entitlements: Entitlements };
      publish(body.entitlements);
    })
    .catch(() => undefined)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * The household's plan, read after the session is known.
 *
 * The session is checked first on purpose. A signed-out visitor is free, and
 * asking the server to tell us so would log a 401 in the console on a page
 * that has nothing wrong with it.
 */
export function useEntitlements(): UseEntitlements {
  // `useSession` throws outside a `<SessionProvider />` in development, and the
  // pin button is rendered in tests and stories without one. Reading the
  // context directly gives the same answer, and "no provider" means signed
  // out, which is the safe default: a signed-out visitor is on the free plan.
  const session = useContext(SessionContext);
  const status = session?.status ?? "unauthenticated";
  const value = useSyncExternalStore(subscribe, snapshot, () => null);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      publish(FREE);
      return;
    }
    if (cached) return;
    void load();
  }, [status, value]);

  return { entitlements: value ?? FREE, known: value !== null };
}

/**
 * Clears the module cache. Tests only — the cache is meant to live for one page
 * load, and a test file is many page loads in a row.
 */
export function __resetEntitlementsForTests(): void {
  cached = null;
  inflight = null;
  listeners.clear();
}
