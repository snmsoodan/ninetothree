import { describe, expect, it } from "vitest";
import { StagePack } from "./schema";

/** A minimal pack that passes every rule. Tests mutate one field at a time. */
export function validPack(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "pregnancy-w28",
    kind: "pregnancy",
    stageIndex: 28,
    stageUnit: "week",
    locale: "en-US",
    country: "US",
    title: "Week 28",
    coreActions: [
      {
        id: "a1",
        type: "do",
        priority: "essential",
        domain: "health-parent",
        title: "Book your glucose screening",
        why: "It checks for gestational diabetes, which has no symptoms.",
        options: [],
      },
    ],
    alsoKnow: [],
    redFlags: [{ id: "rf1", text: "Bleeding.", escalation: "call-911" }],
    appointments: [],
    sources: [
      {
        id: "s1",
        title: "ACOG",
        publisher: "ACOG",
        url: "https://www.acog.org/",
        kind: "clinical",
        accessed: "2026-01-01",
      },
    ],
    reviewedBy: "Clinical review pending",
    reviewedAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  };
}

function issuesFor(overrides: Record<string, unknown>): string[] {
  const result = StagePack.safeParse(validPack(overrides));
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe("StagePack — the baseline", () => {
  it("accepts a minimal valid pack", () => {
    expect(StagePack.safeParse(validPack()).success).toBe(true);
  });

  it("defaults options and alsoKnow rather than requiring them", () => {
    const parsed = StagePack.parse(validPack());
    expect(parsed.alsoKnow).toEqual([]);
    expect(parsed.coreActions[0]?.options).toEqual([]);
  });
});

describe("StagePack — the product rules", () => {
  it("refuses more than three core actions", () => {
    const action = (id: string) => ({
      id,
      type: "do",
      priority: "recommended",
      domain: "health-parent",
      title: `Step ${id}`,
      why: "Because.",
      options: [],
    });
    expect(
      issuesFor({ coreActions: [action("a"), action("b"), action("c"), action("d")] }),
    ).toContainEqual(expect.stringMatching(/at most 3|Too big|Array must contain at most 3/i));
  });

  it("refuses a pack with no core actions", () => {
    expect(issuesFor({ coreActions: [] }).length).toBeGreaterThan(0);
  });

  it("refuses two essential actions", () => {
    const action = (id: string) => ({
      id,
      type: "do",
      priority: "essential",
      domain: "health-parent",
      title: `Step ${id}`,
      why: "Because.",
      options: [],
    });
    expect(issuesFor({ coreActions: [action("a"), action("b")] })).toContain(
      "pack pregnancy-w28 has 2 essential actions; at most one is allowed",
    );
  });

  it("allows exactly one essential action", () => {
    expect(StagePack.safeParse(validPack()).success).toBe(true);
  });

  it("refuses a pack with no red flags", () => {
    expect(issuesFor({ redFlags: [] }).length).toBeGreaterThan(0);
  });

  it("refuses a pack with no sources", () => {
    expect(issuesFor({ sources: [] }).length).toBeGreaterThan(0);
  });

  it("refuses more than eight alsoKnow entries", () => {
    const alsoKnow = Array.from({ length: 9 }, (_, i) => ({
      id: `k${i}`,
      title: `Thing ${i}`,
      body: "Body.",
    }));
    expect(issuesFor({ alsoKnow }).length).toBeGreaterThan(0);
  });

  it("refuses more than four options on an action", () => {
    const options = Array.from({ length: 5 }, (_, i) => ({ id: `o${i}`, label: `Option ${i}` }));
    expect(
      issuesFor({
        coreActions: [
          {
            id: "a1",
            type: "buy",
            priority: "recommended",
            domain: "gear",
            title: "Buy a car seat",
            why: "You cannot leave the hospital without one.",
            options,
          },
        ],
      }).length,
    ).toBeGreaterThan(0);
  });

  it("refuses a buy action with no options", () => {
    expect(
      issuesFor({
        coreActions: [
          {
            id: "a1",
            type: "buy",
            priority: "recommended",
            domain: "gear",
            title: "Buy a car seat",
            why: "You cannot leave the hospital without one.",
            options: [],
          },
        ],
      }),
    ).toContain('buy action "a1" has no options');
  });

  it("refuses duplicate ids across every array in a pack", () => {
    expect(
      issuesFor({
        alsoKnow: [{ id: "a1", title: "Clash", body: "Body." }],
      }),
    ).toContain('duplicate id "a1" within pack pregnancy-w28');
  });

  it("refuses an appointment window that runs backwards", () => {
    expect(
      issuesFor({
        appointments: [{ id: "ap1", label: "Visit", from: 10, to: 5 }],
      }),
    ).toContain('appointment "ap1" has to < from');
  });

  it("allows a single-day appointment window", () => {
    expect(
      StagePack.safeParse(
        validPack({ appointments: [{ id: "ap1", label: "Visit", from: 5, to: 5 }] }),
      ).success,
    ).toBe(true);
  });

  it("refuses a phone escalation with no phone number", () => {
    for (const escalation of ["call-poison-control", "call-988", "call-psi", "call-dv-hotline"]) {
      expect(issuesFor({ redFlags: [{ id: "rf1", text: "Something.", escalation }] })).toContain(
        `red flag "rf1" escalates to ${escalation} but has no phone`,
      );
    }
  });

  it("accepts a phone escalation that carries the number", () => {
    expect(
      StagePack.safeParse(
        validPack({
          redFlags: [
            {
              id: "rf1",
              text: "Swallowed something.",
              escalation: "call-poison-control",
              phone: "1-800-222-1222",
            },
          ],
        }),
      ).success,
    ).toBe(true);
  });

  it("does not require a phone for 911 or a triage line", () => {
    expect(
      StagePack.safeParse(
        validPack({ redFlags: [{ id: "rf1", text: "Bleeding.", escalation: "call-ob-triage" }] }),
      ).success,
    ).toBe(true);
  });
});

describe("StagePack — field rules", () => {
  it("requires a kebab-case id", () => {
    expect(issuesFor({ id: "Pregnancy W28" })).toContain("id must be kebab-case");
  });

  it("requires an en-US style locale", () => {
    expect(issuesFor({ locale: "en_US" })).toContain("locale must be like en-US");
  });

  it("requires a two-letter country", () => {
    expect(issuesFor({ country: "USA" }).length).toBeGreaterThan(0);
  });

  it("requires ISO dates for review and update", () => {
    expect(issuesFor({ reviewedAt: "1 Jan 2026" })).toContain("reviewedAt must be YYYY-MM-DD");
    expect(issuesFor({ updatedAt: "1 Jan 2026" })).toContain("updatedAt must be YYYY-MM-DD");
  });

  it("requires an ISO date on every source", () => {
    expect(
      issuesFor({
        sources: [
          {
            id: "s1",
            title: "ACOG",
            publisher: "ACOG",
            url: "https://www.acog.org/",
            kind: "clinical",
            accessed: "yesterday",
          },
        ],
      }).length,
    ).toBeGreaterThan(0);
  });

  it("requires a real URL on every source", () => {
    expect(
      issuesFor({
        sources: [
          {
            id: "s1",
            title: "ACOG",
            publisher: "ACOG",
            url: "acog.org",
            kind: "clinical",
            accessed: "2026-01-01",
          },
        ],
      }).length,
    ).toBeGreaterThan(0);
  });

  it("keeps action titles under sixty characters", () => {
    expect(
      issuesFor({
        coreActions: [
          {
            id: "a1",
            type: "do",
            priority: "recommended",
            domain: "health-parent",
            title: "x".repeat(61),
            why: "Because.",
            options: [],
          },
        ],
      }).length,
    ).toBeGreaterThan(0);
  });

  it("refuses a zero-minute action", () => {
    expect(
      issuesFor({
        coreActions: [
          {
            id: "a1",
            type: "do",
            priority: "recommended",
            domain: "health-parent",
            title: "Rest",
            why: "Because.",
            minutes: 0,
            options: [],
          },
        ],
      }).length,
    ).toBeGreaterThan(0);
  });

  it("refuses an unknown domain", () => {
    expect(
      issuesFor({
        coreActions: [
          {
            id: "a1",
            type: "do",
            priority: "recommended",
            domain: "astrology",
            title: "Read the stars",
            why: "Because.",
            options: [],
          },
        ],
      }).length,
    ).toBeGreaterThan(0);
  });
});
