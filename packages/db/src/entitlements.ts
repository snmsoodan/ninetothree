/**
 * What a household is allowed to do, worked out from what it has bought.
 *
 * This is a pure function of one row, deliberately. The paywall (issue #40) and
 * the billing routes both read it, and neither should be able to disagree with
 * the other about what "plus" means.
 *
 * "Plus" is five dollars paid once, so the row is a purchase rather than a
 * subscription: `active` means paid, and there is no period to end. The
 * subscription statuses below are still understood because rows written before
 * the price changed still exist, and an old cancel or a failed card must still
 * read as something.
 */

export type Plan = "free" | "plus" | "family" | "b2b";

export const PLANS: readonly Plan[] = ["free", "plus", "family", "b2b"];

export interface Entitlements {
  plan: Plan;
  /** Every week from pregnancy to three, not just the current one. */
  fullTimeline: boolean;
  /** How many things can be pinned at once. `null` is no limit. */
  pinLimit: number | null;
  /** A second adult in the household. */
  partner: boolean;
  /** The week card and triage with no network. */
  offline: boolean;
  /** The print routes. */
  print: boolean;
  /**
   * Red flags, triage and safety content. Always true, on every plan, and not
   * a field anybody can turn off. It is here so that a caller reading
   * `Entitlements` can see the guarantee rather than having to know it.
   */
  safety: true;
}

export const FREE: Entitlements = {
  plan: "free",
  fullTimeline: false,
  pinLimit: 5,
  partner: false,
  offline: false,
  print: false,
  safety: true,
};

export const PAID: Omit<Entitlements, "plan"> = {
  fullTimeline: true,
  pinLimit: null,
  partner: true,
  offline: true,
  print: true,
  safety: true,
};

/**
 * Statuses that still count as paid.
 *
 * `past_due` is here for the rows written while Plus was a subscription: Stripe
 * retried a failed card for about two weeks, and taking somebody's week away
 * because a card expired is exactly the kind of thing this product should not
 * do. A purchase writes `active`. `refunded`, `canceled` and `unpaid` are the
 * ends of their roads, and none of them are here.
 */
const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

export interface SubscriptionLike {
  plan: string;
  status: string;
}

export function entitlementsFor(subscription: SubscriptionLike | undefined): Entitlements {
  if (!subscription) return FREE;
  if (!ENTITLED_STATUSES.has(subscription.status)) return FREE;
  if (subscription.plan === "free") return FREE;
  if (!PLANS.includes(subscription.plan as Plan)) return FREE;
  return { ...PAID, plan: subscription.plan as Plan };
}

/** Whether a household on this plan can pin one more thing. */
export function canPin(entitlements: Entitlements, pinnedCount: number): boolean {
  if (entitlements.pinLimit === null) return true;
  return pinnedCount < entitlements.pinLimit;
}
