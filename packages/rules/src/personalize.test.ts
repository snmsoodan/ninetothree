import { describe, expect, it } from "vitest";
import { PACKS } from "@ninetothree/content/registry";
import type { Action, StagePack } from "@ninetothree/content";
import {
  completion,
  leadAction,
  OPTION_RULES,
  personalizePack,
  PROFILE_FIELDS,
  PROFILE_GROUPS,
  readField,
  HIDE_RULES,
  ADD_RULES,
  ADJUST_RULES,
  RULE_IDS,
  suppressesEmail,
  writeField,
  type Profile,
} from "./personalize";

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

describe("HIDE_RULES", () => {
  const noCar = HIDE_RULES.find((r) => r.id === "no-car")!;
  const formula = HIDE_RULES.find((r) => r.id === "formula-feeding")!;
  const notFirst = HIDE_RULES.find((r) => r.id === "not-first-baby")!;
  const stayingHome = HIDE_RULES.find((r) => r.id === "staying-home")!;

  it("every rule has a written reason", () => {
    for (const rule of [...HIDE_RULES, ...ADD_RULES, ...ADJUST_RULES, ...OPTION_RULES]) {
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

describe("OPTION_RULES", () => {
  const tight = OPTION_RULES.find((r) => r.id === "tight-budget")!;

  it("every option rule has a written reason", () => {
    for (const rule of OPTION_RULES) {
      expect(rule.reason.length).toBeGreaterThan(20);
    }
  });

  it("trims the most expensive option when money is tight", () => {
    const chair = action({
      id: "chair",
      title: "Get a high chair",
      options: [
        { id: "cheap", label: "A cheap one", cost: "$" },
        { id: "dear", label: "A dear one", cost: "$$$" },
      ],
    });
    const result = personalizePack(pack([chair]), { budget: "tight" });
    expect(result.pack.coreActions[0]?.options.map((o) => o.id)).toEqual(["cheap"]);
    expect(result.trimmed).toEqual([
      {
        actionId: "chair",
        optionId: "dear",
        ruleId: "tight-budget",
        reason: tight.reason,
      },
    ]);
  });

  it("trims breastfeeding support when the parent is formula feeding", () => {
    const feed = action({
      id: "feed",
      domain: "feeding",
      title: "Feed the baby eight to twelve times a day",
      options: [
        { id: "lc", label: "A lactation consultant", detail: "Covered by most plans." },
        { id: "llli", label: "La Leche League" },
        { id: "formula", label: "Formula", detail: "Ready to feed is easiest." },
      ],
    });
    const result = personalizePack(pack([feed]), { feeding: "formula" });
    expect(result.pack.coreActions[0]?.options.map((o) => o.id)).toEqual(["formula"]);
    expect(result.trimmed.map((t) => t.ruleId)).toEqual(["formula-options", "formula-options"]);
  });

  it("keeps the step when every option was breastfeeding support", () => {
    const feed = action({
      id: "feed",
      domain: "feeding",
      title: "Find a lactation consultant",
      options: [{ id: "lc", label: "A lactation consultant" }],
    });
    const result = personalizePack(pack([feed]), { feeding: "formula" });
    expect(result.pack.coreActions[0]?.options).toHaveLength(1);
    expect(result.trimmed).toEqual([]);
  });

  it("leaves the options alone when money is not tight", () => {
    const chair = action({
      id: "chair",
      title: "Get a high chair",
      options: [
        { id: "cheap", label: "A cheap one", cost: "$" },
        { id: "dear", label: "A dear one", cost: "$$$" },
      ],
    });
    const result = personalizePack(pack([chair]), { budget: "ok" });
    expect(result.pack.coreActions[0]?.options).toHaveLength(2);
    expect(result.trimmed).toEqual([]);
  });

  it("never leaves an action with no way to do it", () => {
    const chair = action({
      id: "chair",
      title: "Get a high chair",
      options: [{ id: "dear", label: "A dear one", cost: "$$$" }],
    });
    const result = personalizePack(pack([chair]), { budget: "tight" });
    expect(result.pack.coreActions[0]?.options).toHaveLength(1);
    expect(result.trimmed).toEqual([]);
  });

  it("does not touch an action with no options", () => {
    const result = personalizePack(pack([action({ id: "a" })]), { budget: "tight" });
    expect(result.trimmed).toEqual([]);
  });

  it("reports nothing at all when every action was hidden", () => {
    const carSeat = action({
      id: "car",
      title: "Install the car seat",
      domain: "safety",
      options: [{ id: "dear", label: "A dear one", cost: "$$$" }],
    });
    const result = personalizePack(pack([carSeat]), { hasCar: false, budget: "tight" });
    // A pack is never emptied: if every action was hidden, the rules were
    // wrong, so the original pack is shown and nothing is reported.
    expect(result.pack.coreActions).toHaveLength(1);
    expect(result.hidden).toEqual([]);
    expect(result.trimmed).toEqual([]);
  });
});

describe("PROFILE_FIELDS", () => {
  it("covers every field on the profile", () => {
    const keys = PROFILE_FIELDS.map((f) => f.key).sort();
    const expected: (keyof Profile)[] = [
      "budget",
      "country",
      "delivery",
      "feeding",
      "firstBaby",
      "hasCar",
      "housing",
      "loss",
      "mentalHealthHistory",
      "multiples",
      "preterm",
      "support",
      "work",
    ];
    expect(keys).toEqual(expected);
  });

  it("names a rule that exists, or says nothing changes", () => {
    for (const field of PROFILE_FIELDS) {
      if (field.ruleId) {
        const known = RULE_IDS.includes(field.ruleId);
        expect(known, `${field.key} names an unknown rule ${field.ruleId}`).toBe(true);
      } else {
        // A field with no rule must not claim to hide anything.
        expect(field.effect, `${field.key} claims to hide without a rule`).not.toMatch(/^Hides/);
      }
    }
  });

  it("gives every field at least two options and a label", () => {
    for (const field of PROFILE_FIELDS) {
      expect(field.label.length).toBeGreaterThan(0);
      expect(field.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("puts every field in a group that the screen renders", () => {
    for (const field of PROFILE_FIELDS) {
      expect(PROFILE_GROUPS, `${field.key} is in an unknown group`).toContain(field.group);
    }
    for (const group of PROFILE_GROUPS) {
      expect(
        PROFILE_FIELDS.some((f) => f.group === group),
        `${group} is empty`,
      ).toBe(true);
    }
  });

  it("only marks a field read-only when the product cannot honour the rest", () => {
    const readOnly = PROFILE_FIELDS.filter((f) => f.readOnly).map((f) => f.key);
    expect(readOnly).toEqual(["country"]);
  });

  it("uses yes and no for every boolean field", () => {
    for (const field of PROFILE_FIELDS.filter((f) => f.type === "boolean")) {
      expect(field.options.map((o) => o.value)).toEqual(["yes", "no"]);
    }
  });
});

describe("readField", () => {
  it("returns undefined for a field that was never set", () => {
    expect(readField({}, "feeding")).toBeUndefined();
  });

  it("turns a boolean into yes or no", () => {
    expect(readField({ hasCar: true }, "hasCar")).toBe("yes");
    expect(readField({ hasCar: false }, "hasCar")).toBe("no");
  });

  it("passes a choice through", () => {
    expect(readField({ feeding: "formula" }, "feeding")).toBe("formula");
  });
});

describe("writeField", () => {
  it("stores a boolean field as a boolean", () => {
    expect(writeField({}, "hasCar", "no")).toEqual({ hasCar: false });
    expect(writeField({}, "firstBaby", "yes")).toEqual({ firstBaby: true });
  });

  it("stores a choice field as a string", () => {
    expect(writeField({}, "feeding", "formula")).toEqual({ feeding: "formula" });
  });

  it("ignores a key that is not a profile field", () => {
    const profile: Profile = { feeding: "breast" };
    expect(writeField(profile, "nope" as keyof Profile, "x")).toBe(profile);
  });

  it("round-trips through readField", () => {
    const written = writeField({}, "mentalHealthHistory", "yes");
    expect(readField(written, "mentalHealthHistory")).toBe("yes");
  });
});

describe("ADD_RULES", () => {
  const alone = ADD_RULES.find((r) => r.id === "alone-support")!;

  it("fires only when the parent is doing this alone", () => {
    expect(alone.adds({ support: "alone" })).toBe(true);
    expect(alone.adds({ support: "partner" })).toBe(false);
    expect(alone.adds({})).toBe(false);
  });

  it("puts the pack's profile action in, and reports the rule that did it", () => {
    const support = action({ id: "p-support", title: "Line up one person to call" });
    const withProfileAction: StagePack = {
      ...pack([action({ id: "a1" })]),
      profileActions: [{ when: "alone-support", action: support }],
    };

    const result = personalizePack(withProfileAction, { support: "alone" });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["a1", "p-support"]);
    expect(result.added).toEqual([
      { actionId: "p-support", ruleId: "alone-support", reason: alone.reason },
    ]);
  });

  it("leaves the pack alone when the rule does not fire", () => {
    const withProfileAction: StagePack = {
      ...pack([action({ id: "a1" })]),
      profileActions: [{ when: "alone-support", action: action({ id: "p-support" }) }],
    };
    const result = personalizePack(withProfileAction, { support: "partner" });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["a1"]);
    expect(result.added).toEqual([]);
  });

  it("ignores a profile action naming a rule that does not exist", () => {
    const withProfileAction: StagePack = {
      ...pack([action({ id: "a1" })]),
      profileActions: [{ when: "no-such-rule", action: action({ id: "p-support" }) }],
    };
    const result = personalizePack(withProfileAction, { support: "alone" });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["a1"]);
    expect(result.added).toEqual([]);
  });

  it("does not add a step the pack already has", () => {
    const duplicate = action({ id: "a1" });
    const withProfileAction: StagePack = {
      ...pack([duplicate]),
      profileActions: [{ when: "alone-support", action: duplicate }],
    };
    const result = personalizePack(withProfileAction, { support: "alone" });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["a1"]);
    expect(result.added).toEqual([]);
  });
});

describe("ADJUST_RULES", () => {
  const mindFirst = ADJUST_RULES.find((r) => r.id === "mind-first")!;

  it("moves the mind step to the front when mental health has been hard", () => {
    const body = action({ id: "a1", domain: "health-parent" });
    const mind = action({ id: "a2", domain: "mind" });
    const result = personalizePack(pack([body, mind]), { mentalHealthHistory: true });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["a2", "a1"]);
  });

  it("leaves the order alone otherwise", () => {
    const body = action({ id: "a1", domain: "health-parent" });
    const mind = action({ id: "a2", domain: "mind" });
    const result = personalizePack(pack([body, mind]), {});
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["a1", "a2"]);
  });

  it("does nothing to a pack with no mind step", () => {
    const only = pack([action({ id: "a1" })]);
    expect(mindFirst.adjust(only, { mentalHealthHistory: true })).toBe(only);
  });

  it("sees a step that an add rule put in", () => {
    const mind = action({ id: "p-mind", domain: "mind" });
    const withProfileAction: StagePack = {
      ...pack([action({ id: "a1" })]),
      profileActions: [{ when: "alone-support", action: mind }],
    };
    const result = personalizePack(withProfileAction, {
      support: "alone",
      mentalHealthHistory: true,
    });
    expect(result.pack.coreActions.map((a) => a.id)).toEqual(["p-mind", "a1"]);
  });
});

describe("red flags are never personalized away", () => {
  /**
   * One profile per answer a parent can give, plus the combinations that
   * fire more than one rule at once. If a rule could ever reach a red flag,
   * one of these would find it.
   */
  const PROFILES: Profile[] = [
    {},
    { country: "US" },
    { country: "UK" },
    { feeding: "breast" },
    { feeding: "formula" },
    { feeding: "both" },
    { feeding: "undecided" },
    { delivery: "vaginal" },
    { delivery: "cesarean" },
    { delivery: "undecided" },
    { work: "returning" },
    { work: "staying-home" },
    { work: "undecided" },
    { support: "partner" },
    { support: "alone" },
    { support: "other" },
    { firstBaby: true },
    { firstBaby: false },
    { hasCar: true },
    { hasCar: false },
    { mentalHealthHistory: true },
    { mentalHealthHistory: false },
    { multiples: true },
    { multiples: false },
    { preterm: true },
    { preterm: false },
    { budget: "tight" },
    { budget: "ok" },
    { budget: "comfortable" },
    { housing: "own" },
    { housing: "rent" },
    { housing: "shared" },
    { housing: "temporary" },
    {
      feeding: "formula",
      firstBaby: false,
      hasCar: false,
      work: "staying-home",
      budget: "tight",
      support: "alone",
    },
  ];

  it("keeps every red flag, for every answer, in every pack", () => {
    for (const p of PACKS) {
      for (const profile of PROFILES) {
        const result = personalizePack(p, profile);
        expect(result.pack.redFlags, `${p.id} with ${JSON.stringify(profile)}`).toEqual(p.redFlags);
      }
    }
  });

  it("never names a red flag as hidden or trimmed", () => {
    for (const p of PACKS) {
      const flagIds = new Set(p.redFlags.map((flag) => flag.id));
      for (const profile of PROFILES) {
        const result = personalizePack(p, profile);
        for (const entry of [...result.hidden, ...result.trimmed]) {
          expect(flagIds.has(entry.actionId), `${p.id} hid ${entry.actionId}`).toBe(false);
        }
      }
    }
  });

  it("keeps the flags on the safety page even in loss mode", () => {
    // Loss mode is the one case where the week is not shown at all, so there
    // is no week card to carry a flag. The safety page reads the packs
    // directly, which is why it still lists every one of them.
    const quiet = personalizePack(PACKS[0] as StagePack, { loss: "pregnancy" });
    expect(quiet.quiet).toBe(true);
    expect(quiet.pack.redFlags).toEqual([]);
    expect(PACKS.flatMap((p) => p.redFlags).length).toBeGreaterThan(0);
  });
});

describe("loss mode", () => {
  it("empties the week, and says it is quiet", () => {
    const result = personalizePack(pack([action({ id: "a1" })]), { loss: "pregnancy" });
    expect(result.quiet).toBe(true);
    expect(result.pack.coreActions).toEqual([]);
    expect(result.pack.redFlags).toEqual([]);
    expect(result.pack.appointments).toEqual([]);
    expect(result.pack.alsoKnow).toEqual([]);
    expect(result.pack.baby).toBeUndefined();
    expect(result.pack.you).toBeUndefined();
    expect(result.pack.subtitle).toBeUndefined();
  });

  it("keeps the pack's identity and its sources", () => {
    const result = personalizePack(pack([action({ id: "a1" })]), { loss: "baby" });
    expect(result.pack.id).toBe("test-pack");
    expect(result.pack.sources).toHaveLength(1);
    expect(result.pack.reviewedBy).toBe("Test");
  });

  it("reports nothing hidden, trimmed, or added, because nothing was decided", () => {
    const result = personalizePack(pack([action({ id: "a1" })]), {
      loss: "baby",
      hasCar: false,
      budget: "tight",
    });
    expect(result.hidden).toEqual([]);
    expect(result.trimmed).toEqual([]);
    expect(result.added).toEqual([]);
  });

  it("is not quiet for any other profile", () => {
    expect(personalizePack(pack([action({ id: "a1" })]), {}).quiet).toBe(false);
  });

  it("suppresses the weekly email, and only in loss mode", () => {
    expect(suppressesEmail({ loss: "pregnancy" })).toBe(true);
    expect(suppressesEmail({ loss: "baby" })).toBe(true);
    expect(suppressesEmail({})).toBe(false);
    expect(suppressesEmail({ mentalHealthHistory: true })).toBe(false);
  });
});

describe("the loss field", () => {
  it("clears the mode when the parent says no", () => {
    const withLoss = writeField({}, "loss", "baby");
    expect(withLoss.loss).toBe("baby");
    expect(writeField(withLoss, "loss", "none").loss).toBeUndefined();
  });

  it("reads back as the value the radio group uses", () => {
    expect(readField({ loss: "pregnancy" }, "loss")).toBe("pregnancy");
    expect(readField({}, "loss")).toBeUndefined();
  });
});

/**
 * One fixture per rule, keyed by rule id. The test below fails when a rule
 * is added without one, which is the point: a rule nobody exercised is a
 * rule nobody has thought about.
 */
const RULE_FIXTURES: Record<string, { profile: Profile; expect: "hides" | "adds" | "adjusts" }> = {
  "no-car": { profile: { hasCar: false }, expect: "hides" },
  "formula-feeding": { profile: { feeding: "formula" }, expect: "hides" },
  "not-first-baby": { profile: { firstBaby: false }, expect: "hides" },
  "staying-home": { profile: { work: "staying-home" }, expect: "hides" },
  "tight-budget": { profile: { budget: "tight" }, expect: "hides" },
  "formula-options": { profile: { feeding: "formula" }, expect: "hides" },
  "alone-support": { profile: { support: "alone" }, expect: "adds" },
  "mind-first": { profile: { mentalHealthHistory: true }, expect: "adjusts" },
};

describe("every rule has a fixture", () => {
  it("covers every rule id the product can report", () => {
    expect(Object.keys(RULE_FIXTURES).sort()).toEqual([...RULE_IDS].sort());
  });

  it("each fixture actually changes something", () => {
    const body = action({ id: "a1", domain: "health-parent" });
    const mind = action({ id: "a2", domain: "mind" });
    const carSeat = action({
      id: "a3",
      domain: "safety",
      title: "Install the car seat",
      options: [
        { id: "cheap", label: "A cheap one", cost: "$" },
        { id: "dear", label: "A dear one", cost: "$$$" },
      ],
    });
    const feed = action({
      id: "a4",
      domain: "feeding",
      title: "Learn to latch",
      options: [
        { id: "lc", label: "A lactation consultant" },
        { id: "bottle", label: "A bottle" },
      ],
    });
    const firstVisit = action({ id: "a5", title: "Book your first prenatal visit" });
    const childcare = action({ id: "a6", domain: "childcare" });
    const support = action({ id: "p-support" });
    const fixturePack: StagePack = {
      ...pack([body, mind, carSeat, feed, firstVisit, childcare]),
      profileActions: [{ when: "alone-support", action: support }],
    };

    for (const [id, fixture] of Object.entries(RULE_FIXTURES)) {
      const result = personalizePack(fixturePack, fixture.profile);
      const reported =
        result.hidden.length > 0 || result.trimmed.length > 0 || result.added.length > 0;
      // A reorder reports nothing, so compare the pack itself as well.
      const reordered =
        result.pack.coreActions.map((a) => a.id).join() !==
        fixturePack.coreActions.map((a) => a.id).join();
      expect(reported || reordered, `rule ${id} changed nothing`).toBe(true);
    }
  });
});
