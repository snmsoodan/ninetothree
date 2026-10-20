import type { Action, Option, StagePack } from "@ninetothree/content";

/**
 * Personalization is a rules engine, not a model.
 *
 * Every rule is a named, testable function with a written reason. If a
 * parent asks "why am I not seeing this?", the answer is a rule id, not
 * a shrug. Nothing here ever removes a red flag, a source, or an
 * appointment — those are safety and provenance, not content.
 */

export type Country = "US" | "UK";
export type Feeding = "breast" | "formula" | "both" | "undecided";
export type Delivery = "vaginal" | "cesarean" | "undecided";
export type Work = "returning" | "staying-home" | "undecided";
export type Support = "partner" | "alone" | "other";
export type Budget = "tight" | "ok" | "comfortable";
export type Housing = "own" | "rent" | "shared" | "temporary";

export interface Profile {
  country?: Country;
  feeding?: Feeding;
  delivery?: Delivery;
  work?: Work;
  support?: Support;
  firstBaby?: boolean;
  hasCar?: boolean;
  mentalHealthHistory?: boolean;
  multiples?: boolean;
  preterm?: boolean;
  budget?: Budget;
  housing?: Housing;
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

/**
 * Option rules trim the choices inside an action that stays. They exist
 * because "we cannot afford that" is a reason to show fewer options, not a
 * reason to hide the step: the step is still the right thing to do, and the
 * cheaper way to do it is the one worth showing.
 */
export interface OptionRule {
  id: string;
  reason: string;
  trims: (action: Action, option: Option, profile: Profile) => boolean;
}

export const OPTION_RULES: OptionRule[] = [
  {
    id: "tight-budget",
    reason: "You told us money is tight, so the most expensive option is not shown.",
    trims: (_action, option, profile) => profile.budget === "tight" && option.cost === "$$$",
  },
];

export interface HiddenAction {
  actionId: string;
  ruleId: string;
  reason: string;
}

export interface TrimmedOption {
  actionId: string;
  optionId: string;
  ruleId: string;
  reason: string;
}

export interface PersonalizeResult {
  pack: StagePack;
  /** Action ids that were hidden, with the rule that hid them. */
  hidden: HiddenAction[];
  /** Options removed from actions that stayed, with the rule that removed them. */
  trimmed: TrimmedOption[];
}

/**
 * Applies the rule table and reorders what is left.
 *
 * Reordering is deliberately conservative: the essential action stays
 * first, and the only thing that moves is a mental-health action, which
 * comes up when the parent has told us it matters to them.
 */
export function personalizePack(pack: StagePack, profile: Profile): PersonalizeResult {
  const hidden: HiddenAction[] = [];
  const trimmed: TrimmedOption[] = [];

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

  const withOptions = actions.map((action) => {
    if (action.options.length === 0) return action;
    const removed: TrimmedOption[] = [];
    const options = action.options.filter((option) => {
      const rule = OPTION_RULES.find((r) => r.trims(action, option, profile));
      if (rule) {
        removed.push({
          actionId: action.id,
          optionId: option.id,
          ruleId: rule.id,
          reason: rule.reason,
        });
        return false;
      }
      return true;
    });
    // Never leave an action with no way to do it. If every option was
    // trimmed, the rule was wrong — show them all, and report nothing.
    if (options.length === 0) return action;
    trimmed.push(...removed);
    return { ...action, options };
  });

  const ordered = profile.mentalHealthHistory
    ? [...withOptions].sort((a, b) => {
        const aMind = a.domain === "mind" ? 0 : 1;
        const bMind = b.domain === "mind" ? 0 : 1;
        if (aMind !== bMind) return aMind - bMind;
        return 0;
      })
    : withOptions;

  return {
    pack: { ...pack, coreActions: ordered },
    hidden: kept.length > 0 ? hidden : [],
    trimmed: kept.length > 0 ? trimmed : [],
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

/**
 * One table for every profile field, so the settings screen and the rules
 * cannot drift apart. A field with no `ruleId` is recorded and does nothing
 * yet — and says so, rather than pretending to be wired up.
 */
export interface ProfileOption {
  value: string;
  label: string;
}

export interface ProfileField {
  key: keyof Profile;
  label: string;
  /** What this field does to the guide, in one sentence, in the parent's words. */
  effect: string;
  type: "choice" | "boolean";
  options: ProfileOption[];
  /** The rule this field drives, when it drives one. */
  ruleId?: string;
  /** The settings section this field belongs to. */
  group: string;
  /** Shown but not editable, because the product cannot honour the other values yet. */
  readOnly?: boolean;
}

/** The order the settings screen renders its sections in. */
export const PROFILE_GROUPS = ["Where you are", "Feeding", "The birth", "Home and money", "You"];

const YES_NO: ProfileOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const PROFILE_FIELDS: ProfileField[] = [
  {
    key: "country",
    group: "Where you are",
    readOnly: true,
    label: "Country",
    effect: "Sets the appointment schedule. Only the US schedule is switched on.",
    type: "choice",
    options: [
      { value: "US", label: "United States" },
      { value: "UK", label: "United Kingdom" },
    ],
  },
  {
    key: "feeding",
    group: "Feeding",
    label: "Feeding",
    effect: "Hides breastfeeding-specific steps if you are formula feeding.",
    type: "choice",
    options: [
      { value: "breast", label: "Breastfeeding" },
      { value: "formula", label: "Formula" },
      { value: "both", label: "Both" },
      { value: "undecided", label: "Not decided yet" },
    ],
    ruleId: "formula-feeding",
  },
  {
    key: "delivery",
    group: "The birth",
    label: "Birth",
    effect: "Recorded. Nothing in the guide changes for this yet.",
    type: "choice",
    options: [
      { value: "vaginal", label: "Vaginal" },
      { value: "cesarean", label: "Cesarean" },
      { value: "undecided", label: "Not decided yet" },
    ],
  },
  {
    key: "work",
    group: "Home and money",
    label: "Work after the baby",
    effect: "Hides childcare search steps if you are not going back to work.",
    type: "choice",
    options: [
      { value: "returning", label: "Going back to work" },
      { value: "staying-home", label: "Staying home" },
      { value: "undecided", label: "Not decided yet" },
    ],
    ruleId: "staying-home",
  },
  {
    key: "support",
    group: "Home and money",
    label: "Who is with you",
    effect: "Recorded. Nothing in the guide changes for this yet.",
    type: "choice",
    options: [
      { value: "partner", label: "A partner" },
      { value: "alone", label: "On my own" },
      { value: "other", label: "Someone else" },
    ],
  },
  {
    key: "firstBaby",
    group: "The birth",
    label: "First baby",
    effect: "Hides first-time-only steps if you have done this before.",
    type: "boolean",
    options: [
      { value: "yes", label: "Yes, my first" },
      { value: "no", label: "No, I have done this before" },
    ],
    ruleId: "not-first-baby",
  },
  {
    key: "hasCar",
    group: "Home and money",
    label: "A car",
    effect: "Hides car seat steps if you do not have one.",
    type: "boolean",
    options: YES_NO,
    ruleId: "no-car",
  },
  {
    key: "mentalHealthHistory",
    group: "You",
    label: "Mental health history",
    effect: "Moves the mental-health step to the top of the week.",
    type: "boolean",
    options: YES_NO,
  },
  {
    key: "multiples",
    group: "The birth",
    label: "More than one baby",
    effect: "Recorded. Nothing in the guide changes for this yet.",
    type: "boolean",
    options: YES_NO,
  },
  {
    key: "preterm",
    group: "The birth",
    label: "Born early",
    effect: "Recorded. Nothing in the guide changes for this yet.",
    type: "boolean",
    options: YES_NO,
  },
  {
    key: "budget",
    group: "Home and money",
    label: "Budget",
    effect: "Hides the most expensive option when money is tight.",
    type: "choice",
    options: [
      { value: "tight", label: "Tight" },
      { value: "ok", label: "Fine" },
      { value: "comfortable", label: "Comfortable" },
    ],
    ruleId: "tight-budget",
  },
  {
    key: "housing",
    group: "Home and money",
    label: "Housing",
    effect: "Recorded. Nothing in the guide changes for this yet.",
    type: "choice",
    options: [
      { value: "own", label: "We own it" },
      { value: "rent", label: "We rent" },
      { value: "shared", label: "Shared with others" },
      { value: "temporary", label: "Temporary" },
    ],
  },
];

/** The stored value as the string the radio group uses. */
export function readField(profile: Profile, key: keyof Profile): string | undefined {
  const value = profile[key];
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

/**
 * The inverse of `readField`. A boolean field stores a boolean, not the
 * string "yes" — the profile is read by rules, not by the form.
 */
export function writeField(profile: Profile, key: keyof Profile, value: string): Profile {
  const field = PROFILE_FIELDS.find((f) => f.key === key);
  if (!field) return profile;
  if (field.type === "boolean") return { ...profile, [key]: value === "yes" };
  return { ...profile, [key]: value };
}
