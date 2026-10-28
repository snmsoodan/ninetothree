/**
 * The Stripe seam.
 *
 * There are no Stripe credentials in this environment, so nothing here talks to
 * Stripe. What it does do is the part that can be got wrong silently: verifying
 * that a webhook really came from Stripe, and turning an event into a row.
 * Both are pure enough to test, and both are the parts a real integration would
 * otherwise have to trust.
 *
 * The product is one payment of five dollars, not a subscription, so the events
 * that matter are the ones a single payment produces: a completed checkout, the
 * late completion a delayed payment method produces, and a refund. The
 * subscription events are still handled, because rows written while the product
 * was a subscription still exist and a cancel must still mean something.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import type { SqlClient } from "./migrate";
import type { Plan } from "./entitlements";

/** How far out of date a webhook may be before it is refused. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export class BadSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadSignatureError";
  }
}

/**
 * Verify a `Stripe-Signature` header against the raw request body.
 *
 * Stripe signs `${timestamp}.${body}` with the webhook secret. The comparison is
 * timing-safe and the timestamp is checked, because a signature that is valid
 * but a day old is a replay.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  options: { now?: number; toleranceSeconds?: number } = {},
): void {
  if (!header) throw new BadSignatureError("no signature header");
  if (!secret) throw new BadSignatureError("no webhook secret");

  const parts = header.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) {
    throw new BadSignatureError("signature header is not in the expected shape");
  }

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) throw new BadSignatureError("timestamp is not a number");

  const now = options.now ?? Math.floor(Date.now() / 1000);
  const tolerance = options.toleranceSeconds ?? SIGNATURE_TOLERANCE_SECONDS;
  if (Math.abs(now - seconds) > tolerance) {
    throw new BadSignatureError("signature is too old");
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  const matched = signatures.some((signature) => {
    const given = Buffer.from(signature, "hex");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });

  if (!matched) throw new BadSignatureError("signature does not match");
}

export interface StripeObject {
  id?: string;
  object?: string;
  customer?: string | null;
  subscription?: string | null;
  status?: string;
  /** On a checkout session: whether the money has actually arrived. */
  payment_status?: string;
  /** On a charge: what was charged, and what has been given back. */
  amount?: number;
  amount_refunded?: number;
  client_reference_id?: string | null;
  current_period_end?: number | null;
  metadata?: Record<string, string> | null;
  items?: { data?: { current_period_end?: number | null }[] } | null;
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: StripeObject };
}

export interface AppliedEvent {
  /** What the event did, for the log line. */
  action: "purchased" | "updated" | "cancelled" | "payment-failed" | "refunded" | "ignored";
  householdId?: string;
}

const PLAN_NAMES: readonly Plan[] = ["free", "plus", "family", "b2b"];

/**
 * A checkout session's `payment_status` when the money is in.
 *
 * `no_payment_required` is in the list because a hundred-percent discount
 * produces it, and a session we created for five dollars should still count as
 * bought if Stripe decides nothing is owed.
 */
const PAID_PAYMENT_STATUSES = new Set(["paid", "no_payment_required"]);

function planOf(object: StripeObject): Plan | undefined {
  const named = object.metadata?.plan;
  return PLAN_NAMES.find((plan) => plan === named);
}

function periodEndOf(object: StripeObject): Date | undefined {
  const seconds = object.current_period_end ?? object.items?.data?.[0]?.current_period_end;
  return typeof seconds === "number" ? new Date(seconds * 1000) : undefined;
}

/**
 * Apply one event.
 *
 * Deliberately unscoped: a webhook arrives with no session, so there is no
 * `Scope` to give it. It runs as the owner, like `purgeDeleted` and
 * `accept_household_invite`, and it is the only other place in this package
 * that writes a row without a household in hand.
 *
 * An event for a customer we have never seen is ignored rather than invented,
 * because a subscription row with no household is a row nobody can act on.
 */
export async function applyStripeEvent(db: SqlClient, event: StripeEvent): Promise<AppliedEvent> {
  const object = event.data.object;

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const householdId = object.client_reference_id;
    if (!householdId) return { action: "ignored" };

    /*
     * A session can complete before the money arrives — that is what a delayed
     * payment method does — and granting on that would open the guide for a
     * payment that may still fail. `async_payment_succeeded` is where such a
     * session becomes a purchase; the second delivery lands here and grants.
     */
    if (object.payment_status && !PAID_PAYMENT_STATUSES.has(object.payment_status)) {
      return { action: "ignored", householdId };
    }

    const plan = planOf(object) ?? "plus";
    await db.query(
      `insert into subscriptions (household_id, plan, status, stripe_customer_id, stripe_subscription_id)
       values ($1,$2,'active',$3,$4)
       on conflict (household_id) do update set
         plan = excluded.plan,
         status = 'active',
         stripe_customer_id = coalesce(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
         stripe_subscription_id = coalesce(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id)`,
      [householdId, plan, object.customer ?? null, object.subscription ?? null],
    );
    return { action: "purchased", householdId };
  }

  const customerId = object.customer;
  if (!customerId) return { action: "ignored" };

  const found = await db.query<{ household_id: string }>(
    "select household_id from subscriptions where stripe_customer_id = $1 limit 1",
    [customerId],
  );
  const householdId = found.rows[0]?.household_id;
  if (!householdId) return { action: "ignored" };

  if (event.type === "customer.subscription.updated") {
    const plan = planOf(object);
    await db.query(
      `update subscriptions set
         status = coalesce($2, status),
         plan = coalesce($3, plan),
         stripe_subscription_id = coalesce($4, stripe_subscription_id),
         current_period_end = coalesce($5, current_period_end)
       where household_id = $1`,
      [
        householdId,
        object.status ?? null,
        plan ?? null,
        object.id ?? null,
        periodEndOf(object) ?? null,
      ],
    );
    return { action: "updated", householdId };
  }

  if (event.type === "customer.subscription.deleted") {
    await db.query("update subscriptions set status = 'canceled' where household_id = $1", [
      householdId,
    ]);
    return { action: "cancelled", householdId };
  }

  /*
   * A refund is a return, not a renewal problem: the guide goes back to free.
   * Stripe sends the same event for a partial refund, and taking everything
   * away over five dollars minus a goodwill credit would be the wrong reading,
   * so only a full refund revokes.
   */
  if (event.type === "charge.refunded") {
    const amount = object.amount ?? 0;
    const refunded = object.amount_refunded ?? 0;
    if (amount > 0 && refunded < amount) return { action: "ignored", householdId };

    await db.query("update subscriptions set status = 'refunded' where household_id = $1", [
      householdId,
    ]);
    return { action: "refunded", householdId };
  }

  if (event.type === "invoice.payment_failed") {
    await db.query("update subscriptions set status = 'past_due' where household_id = $1", [
      householdId,
    ]);
    return { action: "payment-failed", householdId };
  }

  return { action: "ignored", householdId };
}
