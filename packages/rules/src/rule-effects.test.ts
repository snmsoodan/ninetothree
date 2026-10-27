import { describe, expect, it } from "vitest";
import { PACKS } from "@ninetothree/content/registry";
import { RULE_INDEX, type RuleIndexPack } from "@ninetothree/content/rule-index";
import { personalizePack, type Profile } from "./personalize";
import { ruleEffects, type RuleChange } from "./rule-effects";

/** What ProfilePreview used to build by hand, kept here as the oracle. */
function fromFullPacks(profile: Profile): { steps: RuleChange[]; options: RuleChange[] } {
  const steps = new Map<string, RuleChange>();
  const options = new Map<string, RuleChange>();
  const add = (into: Map<string, RuleChange>, ruleId: string, reason: string, item: string) => {
    const existing = into.get(ruleId);
    if (existing) existing.items.push(item);
    else into.set(ruleId, { ruleId, reason, items: [item] });
  };

  for (const pack of PACKS) {
    const result = personalizePack(pack, profile);
    for (const hidden of result.hidden) {
      const action = pack.coreActions.find((a) => a.id === hidden.actionId)!;
      add(steps, hidden.ruleId, hidden.reason, `${action.title} (${pack.title})`);
    }
    for (const trimmed of result.trimmed) {
      const action = pack.coreActions.find((a) => a.id === trimmed.actionId)!;
      const option = action.options.find((o) => o.id === trimmed.optionId)!;
      add(
        options,
        trimmed.ruleId,
        trimmed.reason,
        `${option.label} in ${action.title} (${pack.title})`,
      );
    }
  }

  return { steps: [...steps.values()], options: [...options.values()] };
}

const EVERYTHING: Profile = {
  hasCar: false,
  feeding: "formula",
  firstBaby: false,
  work: "staying-home",
  budget: "tight",
};

describe("ruleEffects", () => {
  it("reports exactly what personalizePack reports, for a profile that trips every rule", () => {
    const expected = fromFullPacks(EVERYTHING);
    expect(expected.steps.length).toBeGreaterThan(0);
    expect(expected.options.length).toBeGreaterThan(0);

    const actual = ruleEffects(RULE_INDEX, EVERYTHING);
    expect(actual.quiet).toBe(false);
    expect(actual.steps).toEqual(expected.steps);
    expect(actual.options).toEqual(expected.options);
  });

  it("matches personalizePack for a quiet profile too", () => {
    expect(ruleEffects(RULE_INDEX, {})).toEqual({
      steps: [],
      options: [],
      quiet: false,
    });
  });

  it("says nothing at all when the guide is paused", () => {
    expect(ruleEffects(RULE_INDEX, { ...EVERYTHING, loss: "baby" })).toEqual({
      steps: [],
      options: [],
      quiet: true,
    });
  });

  // The two fallbacks below only fire when a rule is wrong, so no real pack
  // reaches them. Synthetic packs keep them honest.
  function packOf(domain: string, title: string, costs: string[]): RuleIndexPack {
    return {
      id: "synthetic",
      title: "Week 40",
      actions: [
        {
          id: "synthetic-action",
          domain,
          title,
          why: "Because.",
          options: costs.map((cost, index) => ({
            id: `synthetic-option-${index}`,
            label: `Option ${index}`,
            cost,
          })),
        },
      ],
    } as RuleIndexPack;
  }

  it("still reports the step when a rule would have emptied the whole pack", () => {
    const { steps, options } = ruleEffects([packOf("childcare", "Find a daycare", ["$"])], {
      work: "staying-home",
    });
    expect(steps.map((s) => s.ruleId)).toEqual(["staying-home"]);
    expect(options).toEqual([]);
  });

  it("does not report options when a rule would have trimmed all of them", () => {
    const { options } = ruleEffects([packOf("nutrition", "Eat protein", ["$$$", "$$$"])], {
      budget: "tight",
    });
    expect(options).toEqual([]);
  });

  it("does report options when the rule leaves at least one", () => {
    const { options } = ruleEffects([packOf("nutrition", "Eat protein", ["$$$", "$"])], {
      budget: "tight",
    });
    expect(options.map((o) => o.ruleId)).toEqual(["tight-budget"]);
  });

  it("covers every rule that can fire, so no rule can go unreported", () => {
    const { steps, options } = ruleEffects(RULE_INDEX, EVERYTHING);
    expect(steps.map((s) => s.ruleId).sort()).toEqual(
      ["formula-feeding", "no-car", "not-first-baby", "staying-home"].sort(),
    );
    expect(options.map((o) => o.ruleId).sort()).toEqual(["formula-options", "tight-budget"]);
  });
});
