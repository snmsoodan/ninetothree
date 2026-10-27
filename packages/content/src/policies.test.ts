import { describe, expect, it } from "vitest";

import { CORRECTIONS, CORRECTION_WINDOWS, POLICIES, POLICIES_EFFECTIVE } from "./policies";

describe("the policy list", () => {
  it("points every entry at a route-shaped href", () => {
    for (const policy of POLICIES) {
      expect(policy.href).toMatch(/^\/[a-z][a-z-]*$/);
    }
  });

  it("has no duplicate href and no duplicate label", () => {
    expect(new Set(POLICIES.map((policy) => policy.href)).size).toBe(POLICIES.length);
    expect(new Set(POLICIES.map((policy) => policy.label)).size).toBe(POLICIES.length);
  });

  it("gives every policy a label short enough for a footer", () => {
    /* The footer is one line of links at 320px. A label that wraps to three
       lines there is a layout bug nobody notices on a laptop. */
    for (const policy of POLICIES) {
      expect(policy.label.length).toBeGreaterThan(0);
      expect(policy.label.length).toBeLessThanOrEqual(20);
    }
  });

  it("keeps the four pages the product actually promises", () => {
    /* Not a snapshot: this is the acceptance criterion of #52 — privacy,
       terms, editorial policy, corrections — stated once so a page cannot be
       quietly dropped from the footer. */
    expect(POLICIES.map((policy) => policy.href)).toEqual([
      "/privacy",
      "/terms",
      "/editorial",
      "/corrections",
    ]);
  });

  it("dates itself", () => {
    expect(POLICIES_EFFECTIVE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(`${POLICIES_EFFECTIVE}T00:00:00Z`))).toBe(false);
  });
});

describe("the correction windows", () => {
  it("has a window for every kind of mistake, and no duplicates", () => {
    expect(CORRECTION_WINDOWS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(CORRECTION_WINDOWS.map((entry) => entry.kind)).size).toBe(
      CORRECTION_WINDOWS.length,
    );
  });

  it("says how fast, in words a parent can hold us to", () => {
    for (const entry of CORRECTION_WINDOWS) {
      expect(entry.window.length).toBeGreaterThan(0);
      expect(entry.detail.length).toBeGreaterThan(40);
    }
  });

  it("puts the one that can hurt someone first", () => {
    /* The order is the promise: the first row is the one that comes down
       before anybody discusses it. */
    expect(CORRECTION_WINDOWS[0]?.kind).toMatch(/hurt/i);
    expect(CORRECTION_WINDOWS[0]?.window).toBe("the same day");
  });
});

describe("the corrections log", () => {
  it("starts empty rather than with plausible-looking entries", () => {
    /* If this ever fails because somebody seeded it with fake entries to make
       the page look lived-in, the test is doing its job. */
    expect(CORRECTIONS).toEqual([]);
  });

  it("keeps every entry, once there is one, in a shape a reader can check", () => {
    /* Vacuous today. It runs the moment the first correction lands, and it is
       the shape the person filing one has to be able to answer: what it said,
       in the original words, and what it says now. */
    for (const correction of CORRECTIONS) {
      expect(correction.id).not.toBe("");
      expect(correction.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(correction.where).not.toBe("");
      expect(correction.was).not.toBe("");
      expect(correction.now).not.toBe("");
      expect(correction.foundBy).not.toBe("");
    }
  });
});
