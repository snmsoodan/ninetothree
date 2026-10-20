import { describe, expect, it } from "vitest";
import type { Action, StagePack } from "@ninetothree/content";
import { completion, leadAction, personalizePack, RULES } from "./personalize";

function action(overrides: Partial<Action> & { id: string }): Action {
  return {
    title: "A step",
    why: "Because it matters.",
    domain: "health-parent",
    priority: "recommended",
    options: [],
    ...overrides,
  } as Action;
}

function pack(actions: Action[]): StagePack {
  return {
    id: "test-pack",
    kind: "pregnancy",
    stageIndex: 28,
    title: "Week 28",
    coreActions: actions,
    alsoKnow: [],
    appointments: [],
    redFlags: [{ id: "rf", text: "Something is wrong.", escalation: "call-911" }],
    sources: [
      {
        id: "s",
        title: "Source",
        url: "https://example.com",
        publisher: "P",
        kind: "clinical",
        accessed: "2026-01-01",
      },
    ],
    reviewedBy: "Test",
    reviewedAt: "2026-01-01",
    stageUnit: "week",
    locale: "en-US",
    country: "US",
    updatedAt: "2026-01-01",
  } as StagePack;
}

describe("RULES", () => {
  const noCar = RULES.find((r) => r.id === "no-car")!;
  const formula = RULES.find((r) => r.id === "formula-feeding")!;
  const notFirst = RULES.find((r) => r.id === "not-first-baby")!;
  const stayingHome = RULES.find((r) => r.id === "staying-home")!;

  it("every rule has a written reason", () => {
    for (const rule of RULES) {
      expect(rule.reason.length).toBeGreaterThan(20);
    }
  });

  describe("no-car", () => {
    const carSeat = action({
      id: "a",
      title: "Install the car seat",
      domain: "safety",
    });

    it("hides a car seat step when there is no car", () => {
      expect(noCar.hides(carSeat, { hasCar: false })).toBe(true);
    });

    it("keeps it when there is a car", () => {
      expect(noCar.hides(carSeat, { hasCar: true })).toBe(false);
    });

    it("keeps it when we have not asked", () => {
      expect(noCar.hides(carSeat, {})).toBe(false);
    });

    it("does not hide unrelated safety steps", () => {
      expect(
        noCar.hides(action({ id: "b", title: "Check the water heater", domain: "safety" }), {
          hasCar: false,
        }),
      ).toBe(false);
    });

    it("does not hide a car seat step outside safety and gear", () => {
      expect(
        noCar.hides(action({ id: "c", title: "Car seat", domain: "health-parent" }), {
          hasCar: false,
        }),
      ).toBe(false);
    });

    it("matches the hyphenated spelling too", () => {
      expect(
        noCar.hides(action({ id: "d", title: "car-seat check", domain: "gear" }), {
          hasCar: false,
        }),
      ).toBe(true);
    });

    it("matches a booster", () => {
      expect(
        noCar.hides(action({ id: "e", title: "Move to a booster", domain: "gear" }), {
          hasCar: false,
        }),
      ).toBe(true);
    });
  });

  describe("formula-feeding", () => {
    const latch = action({ id: "a", title: "Work on the latch", domain: "feeding" });

    it("hides a breastfeeding step for a formula feeder", () => {
      expect(formula.hides(latch, { feeding: "formula" })).toBe(true);
    });

    it("keeps it for a breastfeeding parent", () => {
      expect(formula.hides(latch, { feeding: "breast" })).toBe(false);
    });

    it("keeps it when undecided", () => {
      expect(formula.hides(latch, { feeding: "undecided" })).toBe(false);
    });

    it("does not hide a feeding step that is not breastfeeding-specific", () => {
      expect(
        formula.hides(action({ id: "b", title: "Sterilise bottles", domain: "feeding" }), {
          feeding: "formula",
        }),
      ).toBe(false);
    });

    it("does not hide a breastfeeding step outside the feeding domain", () => {
      expect(
        formula.hides(action({ id: "c", title: "Latch", domain: "health-parent" }), {
          feeding: "formula",
        }),
      ).toBe(false);
    });

    it("matches pump and milk supply", () => {
      expect(
        formula.hides(action({ id: "d", title: "Build milk supply", domain: "feeding" }), {
          feeding: "formula",
        }),
      ).toBe(true);
      expect(
        formula.hides(action({ id: "e", title: "Get a pump", domain: "feeding" }), {
          feeding: "formula",
        }),
      ).toBe(true);
    });
  });

  describe("not-first-baby", () => {
    it("hides the first prenatal visit for a second-time parent", () => {
      expect(
        notFirst.hides(action({ id: "a", title: "Book your first prenatal visit" }), {
          firstBaby: false,
        }),
      ).toBe(true);
    });

    it("hides a childbirth class", () => {
      expect(
        notFirst.hides(action({ id: "b", title: "Sign up for a childbirth class" }), {
          firstBaby: false,
        }),
      ).toBe(true);
    });

    it("keeps them for a first baby", () => {
      expect(
        notFirst.hides(action({ id: "a", title: "Book your first prenatal visit" }), {
          firstBaby: true,
        }),
      ).toBe(false);
    });

    it("keeps them when we have not asked", () => {
      expect(notFirst.hides(action({ id: "a", title: "Book your first prenatal visit" }), {})).toBe(
        false,
      );
    });

    it("does not hide anything else", () => {
      expect(
        notFirst.hides(action({ id: "c", title: "Take your vitamins" }), { firstBaby: false }),
      ).toBe(false);
    });
  });

  describe("staying-home", () => {
    it("hides childcare search when not returning to work", () => {
      expect(
        stayingHome.hides(action({ id: "a", title: "Tour a daycare", domain: "childcare" }), {
          work: "staying-home",
        }),
      ).toBe(true);
    });

    it("keeps it when returning", () => {
      expect(
        stayingHome.hides(action({ id: "a", title: "Tour a daycare", domain: "childcare" }), {
          work: "returning",
        }),
      ).toBe(false);
    });

    it("does not hide other domains", () => {
      expect(
        stayingHome.hides(action({ id: "b", title: "Tour a daycare", domain: "health-parent" }), {
          work: "staying-home",
        }),
      ).toBe(false);
    });
  });
});

describe("personalizePack", () => {
  it("returns the pack unchanged for an empty profile", () => {
    const p = pack([action({ id: "a" }), action({ id: "b" })]);
    const result = personalizePack(p, {});
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["a", "b"]);
    expect(result.hidden).toEqual([]);
  });

  it("removes a hidden action and reports the rule and reason", () => {
    const p = pack([
      action({ id: "a", title: "Install the car seat", domain: "safety" }),
      action({ id: "b", title: "Take your vitamins" }),
    ]);
    const result = personalizePack(p, { hasCar: false });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["b"]);
    expect(result.hidden).toEqual([
      {
        actionId: "a",
        ruleId: "no-car",
        reason: "You told us you do not have a car, so car seat steps are hidden.",
      },
    ]);
  });

  it("never empties a pack, and reports nothing hidden when it would", () => {
    const p = pack([action({ id: "a", title: "Install the car seat", domain: "safety" })]);
    const result = personalizePack(p, { hasCar: false });
    expect(result.pack.coreActions).toHaveLength(1);
    expect(result.hidden).toEqual([]);
  });

  it("never touches red flags, sources, or appointments", () => {
    const p = pack([action({ id: "a", title: "Install the car seat", domain: "safety" })]);
    const result = personalizePack(p, { hasCar: false });
    expect(result.pack.redFlags).toEqual(p.redFlags);
    expect(result.pack.sources).toEqual(p.sources);
    expect(result.pack.appointments).toEqual(p.appointments);
  });

  it("does not mutate the pack it was given", () => {
    const p = pack([
      action({ id: "a", title: "Install the car seat", domain: "safety" }),
      action({ id: "b" }),
    ]);
    personalizePack(p, { hasCar: false });
    expect(p.coreActions).toHaveLength(2);
  });

  it("brings a mental-health action to the front when it matters", () => {
    const p = pack([
      action({ id: "a", priority: "essential" }),
      action({ id: "b", domain: "mind" }),
    ]);
    const result = personalizePack(p, { mentalHealthHistory: true });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["b", "a"]);
  });

  it("leaves order alone when two actions are both mental health", () => {
    const p = pack([action({ id: "a", domain: "mind" }), action({ id: "b", domain: "mind" })]);
    const result = personalizePack(p, { mentalHealthHistory: true });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("leaves order alone when neither is mental health", () => {
    const p = pack([action({ id: "a" }), action({ id: "b" })]);
    const result = personalizePack(p, { mentalHealthHistory: true });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["a", "b"]);
  });

  it("applies several rules at once", () => {
    const p = pack([
      action({ id: "a", title: "Install the car seat", domain: "safety" }),
      action({ id: "b", title: "Work on the latch", domain: "feeding" }),
      action({ id: "c", title: "Take your vitamins" }),
    ]);
    const result = personalizePack(p, { hasCar: false, feeding: "formula" });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["c"]);
    expect(result.hidden.map((h) => h.ruleId)).toEqual(["no-car", "formula-feeding"]);
  });
});

describe("leadAction", () => {
  it("picks the essential action first", () => {
    const p = pack([
      action({ id: "a", priority: "optional" }),
      action({ id: "b", priority: "essential" }),
      action({ id: "c", priority: "recommended" }),
    ]);
    expect(leadAction(p)?.id).toBe("b");
  });

  it("falls back through the priorities in order", () => {
    expect(
      leadAction(
        pack([action({ id: "a", priority: "skip-if" }), action({ id: "b", priority: "optional" })]),
      )?.id,
    ).toBe("b");
    expect(
      leadAction(
        pack([
          action({ id: "a", priority: "skip-if" }),
          action({ id: "b", priority: "recommended" }),
        ]),
      )?.id,
    ).toBe("b");
  });

  it("returns undefined for an empty pack", () => {
    expect(leadAction(pack([]))).toBeUndefined();
  });

  it("does not mutate the pack", () => {
    const p = pack([
      action({ id: "a", priority: "optional" }),
      action({ id: "b", priority: "essential" }),
    ]);
    leadAction(p);
    expect(p.coreActions.map((a) => a.id)).toEqual(["a", "b"]);
  });
});

describe("completion", () => {
  it("is zero for an empty pack", () => {
    expect(completion(pack([]), [])).toBe(0);
  });

  it("is zero when nothing is done", () => {
    expect(completion(pack([action({ id: "a" }), action({ id: "b" })]), [])).toBe(0);
  });

  it("is a fraction of the pack", () => {
    expect(completion(pack([action({ id: "a" }), action({ id: "b" })]), ["a"])).toBe(0.5);
  });

  it("is one when everything is done", () => {
    expect(completion(pack([action({ id: "a" }), action({ id: "b" })]), ["a", "b"])).toBe(1);
  });

  it("ignores ids that are not in the pack", () => {
    expect(completion(pack([action({ id: "a" })]), ["a", "zzz"])).toBe(1);
  });
});
