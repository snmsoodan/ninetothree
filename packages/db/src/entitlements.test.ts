import { describe, expect, it } from "vitest";

import { canPin, entitlementsFor, PLANS } from "./entitlements";

describe("entitlementsFor", () => {
  it("gives a household with no subscription the free plan", () => {
    const e = entitlementsFor(undefined);
    expect(e.plan).toBe("free");
    expect(e.fullTimeline).toBe(false);
    expect(e.pinLimit).toBe(5);
    expect(e.partner).toBe(false);
    expect(e.offline).toBe(false);
    expect(e.print).toBe(false);
  });

  it("keeps safety on every plan, including free", () => {
    expect(entitlementsFor(undefined).safety).toBe(true);
    for (const plan of PLANS) {
      expect(entitlementsFor({ plan, status: "active" }).safety).toBe(true);
    }
  });

  it("gives an active plus subscription everything", () => {
    const e = entitlementsFor({ plan: "plus", status: "active" });
    expect(e).toEqual({
      plan: "plus",
      fullTimeline: true,
      pinLimit: null,
      partner: true,
      offline: true,
      print: true,
      safety: true,
    });
  });

  it("treats a trial as paid", () => {
    expect(entitlementsFor({ plan: "plus", status: "trialing" }).fullTimeline).toBe(true);
  });

  it("keeps a past-due household on its plan", () => {
    // Stripe retries a failed card for about two weeks. Taking the week away
    // because a card expired is not something this product does.
    const e = entitlementsFor({ plan: "plus", status: "past_due" });
    expect(e.plan).toBe("plus");
    expect(e.fullTimeline).toBe(true);
  });

  it("drops a cancelled household to free", () => {
    expect(entitlementsFor({ plan: "plus", status: "canceled" }).plan).toBe("free");
  });

  it("drops an unpaid household to free", () => {
    expect(entitlementsFor({ plan: "plus", status: "unpaid" }).plan).toBe("free");
  });

  it("drops an incomplete-expired household to free", () => {
    expect(entitlementsFor({ plan: "plus", status: "incomplete_expired" }).plan).toBe("free");
  });

  it("treats a free plan row as free even when it is active", () => {
    expect(entitlementsFor({ plan: "free", status: "active" }).pinLimit).toBe(5);
  });

  it("treats a plan it does not recognise as free", () => {
    expect(entitlementsFor({ plan: "platinum", status: "active" }).plan).toBe("free");
  });

  it("gives family and b2b the same things as plus", () => {
    for (const plan of ["family", "b2b"] as const) {
      const e = entitlementsFor({ plan, status: "active" });
      expect(e.plan).toBe(plan);
      expect(e.fullTimeline).toBe(true);
      expect(e.pinLimit).toBeNull();
    }
  });
});

describe("canPin", () => {
  it("counts up to the limit on free", () => {
    const free = entitlementsFor(undefined);
    expect(canPin(free, 0)).toBe(true);
    expect(canPin(free, 4)).toBe(true);
    expect(canPin(free, 5)).toBe(false);
    expect(canPin(free, 6)).toBe(false);
  });

  it("never stops a paid household", () => {
    const plus = entitlementsFor({ plan: "plus", status: "active" });
    expect(canPin(plus, 0)).toBe(true);
    expect(canPin(plus, 5_000)).toBe(true);
  });
});
