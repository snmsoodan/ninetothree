import { createHmac } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { applyStripeEvent, BadSignatureError, verifyStripeSignature } from "./stripe";
import { migrateUp } from "./migrate";
import { createTestDb } from "./testing";
import { scopeFor } from "./scope";
import { createHousehold, getSubscription, upsertSubscription } from "./repo";

const SECRET = "whsec_test_secret";

function sign(body: string, timestamp: number, secret = SECRET): string {
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

describe("verifyStripeSignature", () => {
  const body = '{"id":"evt_1"}';
  const now = 1_700_000_000;

  it("accepts a signature it just made", () => {
    expect(() => verifyStripeSignature(body, sign(body, now), SECRET, { now })).not.toThrow();
  });

  it("refuses a body that was changed after signing", () => {
    const header = sign(body, now);
    expect(() => verifyStripeSignature('{"id":"evt_2"}', header, SECRET, { now })).toThrow(
      BadSignatureError,
    );
  });

  it("refuses the wrong secret", () => {
    const header = sign(body, now, "whsec_something_else");
    expect(() => verifyStripeSignature(body, header, SECRET, { now })).toThrow(/does not match/);
  });

  it("refuses a signature older than the tolerance", () => {
    const header = sign(body, now - 301);
    expect(() => verifyStripeSignature(body, header, SECRET, { now })).toThrow(/too old/);
  });

  it("accepts a signature inside the tolerance", () => {
    const header = sign(body, now - 299);
    expect(() => verifyStripeSignature(body, header, SECRET, { now })).not.toThrow();
  });

  it("refuses a missing header", () => {
    expect(() => verifyStripeSignature(body, null, SECRET, { now })).toThrow(/no signature/);
  });

  it("refuses when no secret is configured", () => {
    expect(() => verifyStripeSignature(body, sign(body, now), "", { now })).toThrow(
      /no webhook secret/,
    );
  });

  it("refuses a header that is not in the expected shape", () => {
    expect(() => verifyStripeSignature(body, "nonsense", SECRET, { now })).toThrow(
      /expected shape/,
    );
  });

  it("refuses a timestamp that is not a number", () => {
    expect(() => verifyStripeSignature(body, "t=abc,v1=00", SECRET, { now })).toThrow(
      /not a number/,
    );
  });

  it("refuses a signature of the wrong length without throwing from timingSafeEqual", () => {
    expect(() => verifyStripeSignature(body, `t=${now},v1=abcd`, SECRET, { now })).toThrow(
      /does not match/,
    );
  });

  it("accepts when any one of several v1 signatures matches", () => {
    const good = sign(body, now).split("v1=")[1]!;
    const header = `t=${now},v1=${"0".repeat(64)},v1=${good}`;
    expect(() => verifyStripeSignature(body, header, SECRET, { now })).not.toThrow();
  });

  it("uses the wall clock when no time is given", () => {
    const real = Math.floor(Date.now() / 1000);
    expect(() => verifyStripeSignature(body, sign(body, real), SECRET)).not.toThrow();
  });
});

describe("applyStripeEvent", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;

  beforeAll(async () => {
    db = await createTestDb();
  }, 120_000);

  afterAll(async () => {
    await db?.close();
  });

  beforeEach(async () => {
    await db.exec("drop schema public cascade; create schema public;");
    await migrateUp(db);
  }, 120_000);

  async function household(email = "maya@example.com") {
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ($1) returning id",
      [email],
    );
    const userId = rows[0]!.id;
    const created = await createHousehold(db, userId);
    const scope = await scopeFor(db, userId);
    return { userId, householdId: created.id, scope };
  }

  it("turns a completed one-time checkout into an active purchase", async () => {
    const { householdId, scope } = await household();
    const applied = await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: householdId,
          customer: "cus_1",
          subscription: "sub_1",
          metadata: { plan: "plus" },
        },
      },
    });
    expect(applied).toEqual({ action: "purchased", householdId });
    const row = await getSubscription(db, scope);
    expect(row?.plan).toBe("plus");
    expect(row?.status).toBe("active");
    expect(row?.stripe_customer_id).toBe("cus_1");
    expect(row?.stripe_subscription_id).toBe("sub_1");
  });

  it("defaults a checkout with no named plan to plus", async () => {
    const { householdId, scope } = await household();
    await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { client_reference_id: householdId, customer: "cus_1" } },
    });
    expect((await getSubscription(db, scope))?.plan).toBe("plus");
  });

  it("records a checkout that carries no customer yet", async () => {
    const { householdId, scope } = await household();
    await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { client_reference_id: householdId } },
    });
    const row = await getSubscription(db, scope);
    expect(row?.status).toBe("active");
    expect(row?.stripe_customer_id).toBeNull();
    expect(row?.stripe_subscription_id).toBeNull();
  });

  it("records a one-time purchase with no subscription on it", async () => {
    const { householdId, scope } = await household();
    const applied = await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: householdId,
          customer: "cus_once",
          subscription: null,
          payment_status: "paid",
          metadata: { plan: "plus" },
        },
      },
    });
    expect(applied).toEqual({ action: "purchased", householdId });
    const row = await getSubscription(db, scope);
    expect(row?.plan).toBe("plus");
    expect(row?.status).toBe("active");
    expect(row?.stripe_customer_id).toBe("cus_once");
    // A one-time payment has no subscription id, and inventing one would make
    // a later `customer.subscription.deleted` look like it applied to this row.
    expect(row?.stripe_subscription_id).toBeNull();
  });

  it("does not grant on a checkout whose money has not arrived", async () => {
    const { householdId, scope } = await household();
    const applied = await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: householdId,
          customer: "cus_late",
          payment_status: "unpaid",
          metadata: { plan: "plus" },
        },
      },
    });
    expect(applied).toEqual({ action: "ignored", householdId });
    expect(await getSubscription(db, scope)).toBeUndefined();
  });

  it("grants when the delayed payment finally succeeds", async () => {
    const { householdId, scope } = await household();
    const applied = await applyStripeEvent(db, {
      id: "evt_2",
      type: "checkout.session.async_payment_succeeded",
      data: {
        object: {
          client_reference_id: householdId,
          customer: "cus_late",
          payment_status: "paid",
          metadata: { plan: "plus" },
        },
      },
    });
    expect(applied).toEqual({ action: "purchased", householdId });
    expect((await getSubscription(db, scope))?.status).toBe("active");
  });

  it("grants on a checkout Stripe decided was free", async () => {
    const { householdId, scope } = await household();
    await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: householdId,
          customer: "cus_free",
          payment_status: "no_payment_required",
        },
      },
    });
    expect((await getSubscription(db, scope))?.status).toBe("active");
  });

  it("takes the guide back when the payment is refunded in full", async () => {
    const { householdId, scope } = await household();
    await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: householdId,
          customer: "cus_refund",
          payment_status: "paid",
          metadata: { plan: "plus" },
        },
      },
    });

    const applied = await applyStripeEvent(db, {
      id: "evt_2",
      type: "charge.refunded",
      data: {
        object: { customer: "cus_refund", amount: 500, amount_refunded: 500 },
      },
    });
    expect(applied).toEqual({ action: "refunded", householdId });
    expect((await getSubscription(db, scope))?.status).toBe("refunded");
  });

  it("leaves a partial refund alone", async () => {
    const { householdId, scope } = await household();
    await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: householdId,
          customer: "cus_partial",
          payment_status: "paid",
          metadata: { plan: "plus" },
        },
      },
    });

    const applied = await applyStripeEvent(db, {
      id: "evt_2",
      type: "charge.refunded",
      data: {
        object: { customer: "cus_partial", amount: 500, amount_refunded: 100 },
      },
    });
    expect(applied).toEqual({ action: "ignored", householdId });
    expect((await getSubscription(db, scope))?.status).toBe("active");
  });

  it("revokes when a refund arrives with no amounts on it", async () => {
    const { householdId, scope } = await household();
    await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: householdId,
          customer: "cus_noamount",
          payment_status: "paid",
          metadata: { plan: "plus" },
        },
      },
    });

    // Stripe always sends both amounts, so a charge without them is either a
    // shape we do not understand or a fixture. The money came back; the guide
    // goes back with it.
    const applied = await applyStripeEvent(db, {
      id: "evt_2",
      type: "charge.refunded",
      data: { object: { customer: "cus_noamount" } },
    });
    expect(applied).toEqual({ action: "refunded", householdId });
    expect((await getSubscription(db, scope))?.status).toBe("refunded");
  });

  it("ignores a checkout with no household on it", async () => {
    const applied = await applyStripeEvent(db, {
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { customer: "cus_1" } },
    });
    expect(applied.action).toBe("ignored");
  });

  it("updates a subscription's status and period end", async () => {
    const { householdId, scope } = await household();
    await upsertSubscription(db, scope, {
      plan: "plus",
      status: "active",
      stripeCustomerId: "cus_1",
    });
    const applied = await applyStripeEvent(db, {
      id: "evt_2",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "active",
          current_period_end: 1_800_000_000,
          metadata: { plan: "family" },
        },
      },
    });
    expect(applied).toEqual({ action: "updated", householdId });
    const row = await getSubscription(db, scope);
    expect(row?.plan).toBe("family");
    expect(row?.stripe_subscription_id).toBe("sub_1");
    expect(row?.current_period_end?.toISOString()).toBe("2027-01-15T08:00:00.000Z");
  });

  it("reads the period end off the first item when it is not on the subscription", async () => {
    const { scope } = await household();
    await upsertSubscription(db, scope, {
      plan: "plus",
      status: "active",
      stripeCustomerId: "cus_1",
    });
    await applyStripeEvent(db, {
      id: "evt_2",
      type: "customer.subscription.updated",
      data: {
        object: {
          customer: "cus_1",
          status: "active",
          items: { data: [{ current_period_end: 1_800_000_000 }] },
        },
      },
    });
    expect((await getSubscription(db, scope))?.current_period_end?.toISOString()).toBe(
      "2027-01-15T08:00:00.000Z",
    );
  });

  it("leaves the plan alone when the event does not name one", async () => {
    const { scope } = await household();
    await upsertSubscription(db, scope, {
      plan: "family",
      status: "active",
      stripeCustomerId: "cus_1",
    });
    await applyStripeEvent(db, {
      id: "evt_2",
      type: "customer.subscription.updated",
      data: { object: { customer: "cus_1", status: "trialing" } },
    });
    const row = await getSubscription(db, scope);
    expect(row?.plan).toBe("family");
    expect(row?.status).toBe("trialing");
  });

  it("leaves the status alone when the event does not name one", async () => {
    const { scope } = await household();
    await upsertSubscription(db, scope, {
      plan: "plus",
      status: "active",
      stripeCustomerId: "cus_1",
    });
    await applyStripeEvent(db, {
      id: "evt_2",
      type: "customer.subscription.updated",
      data: { object: { customer: "cus_1" } },
    });
    expect((await getSubscription(db, scope))?.status).toBe("active");
  });

  it("cancels a subscription", async () => {
    const { scope } = await household();
    await upsertSubscription(db, scope, {
      plan: "plus",
      status: "active",
      stripeCustomerId: "cus_1",
    });
    const applied = await applyStripeEvent(db, {
      id: "evt_3",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_1" } },
    });
    expect(applied.action).toBe("cancelled");
    expect((await getSubscription(db, scope))?.status).toBe("canceled");
  });

  it("marks a failed payment past due rather than cancelling", async () => {
    const { scope } = await household();
    await upsertSubscription(db, scope, {
      plan: "plus",
      status: "active",
      stripeCustomerId: "cus_1",
    });
    const applied = await applyStripeEvent(db, {
      id: "evt_4",
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_1" } },
    });
    expect(applied.action).toBe("payment-failed");
    expect((await getSubscription(db, scope))?.status).toBe("past_due");
  });

  it("ignores an event for a customer it has never seen", async () => {
    const applied = await applyStripeEvent(db, {
      id: "evt_5",
      type: "customer.subscription.updated",
      data: { object: { customer: "cus_nobody", status: "active" } },
    });
    expect(applied.action).toBe("ignored");
  });

  it("ignores an event with no customer at all", async () => {
    const applied = await applyStripeEvent(db, {
      id: "evt_6",
      type: "customer.subscription.updated",
      data: { object: { status: "active" } },
    });
    expect(applied.action).toBe("ignored");
  });

  it("ignores an event type it does not handle", async () => {
    const { householdId, scope } = await household();
    await upsertSubscription(db, scope, {
      plan: "plus",
      status: "active",
      stripeCustomerId: "cus_1",
    });
    const applied = await applyStripeEvent(db, {
      id: "evt_7",
      type: "customer.created",
      data: { object: { customer: "cus_1" } },
    });
    expect(applied).toEqual({ action: "ignored", householdId });
  });
});
