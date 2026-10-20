import type { Action, StagePack } from "@ninetothree/content";

/**
 * Personalization is a rules engine, not a model.
 *
 * Every rule is a named, testable function with a written reason. If a
 * parent asks "why am I not seeing this?", the answer is a rule id, not
 * a shrug. Nothing here ever removes a red flag, a source, or an
 * appointment — those are safety and provenance, not content.
 */

export type Feeding = "breast" | "formula" | "both" | "undecided";
export type Delivery = "vaginal" | "cesarean" | "undecided";
export type Work = "returning" | "staying-home" | "undecided";
export type Support = "partner" | "alone" | "other";

export interface Profile {
  feeding?: Feeding;
  delivery?: Delivery;
  work?: Work;
  support?: Support;
  firstBaby?: boolean;
  hasCar?: boolean;
  mentalHealthHistory?: boolean;
}

export interface Rule {
  id: string;
  /** Shown to the user if they ask why something is hidden. */
  reason: string;
  /** True when the action should be hidden for this profile. */
  hides: (action: Action, profile: Profile) => boolean;
}

/**
 * The rule table. Order matters only for which reason is reported first.
 * Keep this list short — every rule is a way the product can be wrong.
 */
export const RULES: Rule[] = [
  {
    id: "no-car",
    reason: "You told us you do not have a car, so car seat steps are hidden.",
    hides: (action, profile) =>
      profile.hasCar === false &&
      (action.domain === "safety" || action.domain === "gear") &&
      /car seat|car-seat|booster/i.test(`${action.title} ${action.why}`),
  },
  {
    id: "formula-feeding",
    reason: "You told us you are formula feeding, so breastfeeding-specific steps are hidden.",
    hides: (action, profile) =>
      profile.feeding === "formula" &&
      action.domain === "feeding" &&
      /breastfeed|latch|milk supply|pump/i.test(`${action.title} ${action.why}`),
  },
  {
    id: "not-first-baby",
    reason: "You told us this is not your first baby, so first-time-only steps are hidden.",
    hides: (action, profile) =>
      profile.firstBaby === false && /first prenatal visit|childbirth class/i.test(action.title),
  },
  {
    id: "staying-home",
    reason: "You told us you are not returning to work, so childcare search steps are hidden.",
    hides: (action, profile) => profile.work === "staying-home" && action.domain === "childcare",
  },
];

export interface PersonalizeResult {
  pack: StagePack;
  /** Action ids that were hidden, with the rule that hid them. */
  hidden: { actionId: string; ruleId: string; reason: string }[];
}

/**
 * Applies the rule table and reorders what is left.
 *
 * Reordering is deliberately conservative: the essential action stays
 * first, and the only thing that moves is a mental-health action, which
 * comes up when the parent has told us it matters to them.
 */
export function personalizePack(pack: StagePack, profile: Profile): PersonalizeResult {
  const hidden: PersonalizeResult["hidden"] = [];

  const kept = pack.coreActions.filter((action) => {
    const rule = RULES.find((r) => r.hides(action, profile));
    if (rule) {
      hidden.push({ actionId: action.id, ruleId: rule.id, reason: rule.reason });
      return false;
    }
    return true;
  });

  // A pack must never end up empty. If every action was hidden, the
  // rules were wrong, not the parent — so show the original pack.
  const actions = kept.length > 0 ? kept : pack.coreActions;

  const ordered = profile.mentalHealthHistory
    ? [...actions].sort((a, b) => {
        const aMind = a.domain === "mind" ? 0 : 1;
        const bMind = b.domain === "mind" ? 0 : 1;
        if (aMind !== bMind) return aMind - bMind;
        return 0;
      })
    : actions;

  return {
    pack: { ...pack, coreActions: ordered },
    hidden: kept.length > 0 ? hidden : [],
  };
}

/** The one action to lead with. Essential first, then recommended, then the rest. */
export function leadAction(pack: StagePack): Action | undefined {
  const order = { essential: 0, recommended: 1, optional: 2, "skip-if": 3 } as const;
  return [...pack.coreActions].sort((a, b) => order[a.priority] - order[b.priority])[0];
}

/** How many of this pack's actions are done. Used for the quiet progress line. */
export function completion(pack: StagePack, doneIds: readonly string[]): number {
  if (pack.coreActions.length === 0) return 0;
  const done = new Set(doneIds);
  const count = pack.coreActions.filter((a) => done.has(a.id)).length;
  return count / pack.coreActions.length;
}
