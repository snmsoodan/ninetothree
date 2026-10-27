import type { Action, Option } from "@ninetothree/content";
import type { RuleIndexAction, RuleIndexPack } from "@ninetothree/content/rule-index";
import { HIDE_RULES, OPTION_RULES, type Profile } from "./personalize";

/**
 * The rule table, applied to the index.
 *
 * `personalizePack` needs a whole `StagePack` because it returns one, with the
 * sources, the red flags and the prose. Two screens need the rules without the
 * prose: the settings page asks "why am I not seeing this?" across the whole
 * guide, and the weekly email picks the three steps a parent has not done. This
 * walks the same two rule lists over the generated projection, so there is one
 * rule engine and two shapes of input — and a test that proves they agree.
 */
export interface RuleChange {
  ruleId: string;
  reason: string;
  items: string[];
}

export interface RuleEffects {
  /** Steps the profile hides, grouped by the rule that hides them. */
  steps: RuleChange[];
  /** Options the profile trims, grouped by the rule that trims them. */
  options: RuleChange[];
  /** True when the guide is paused, so nothing is hidden or trimmed. */
  quiet: boolean;
}

export interface IndexedPersonalization {
  /** The steps that stay, in the order the week page would show them. */
  actions: RuleIndexAction[];
  hidden: { actionId: string; ruleId: string; reason: string }[];
  trimmed: { actionId: string; optionId: string; ruleId: string; reason: string }[];
  quiet: boolean;
}

function add(into: Map<string, RuleChange>, ruleId: string, reason: string, item: string): void {
  const existing = into.get(ruleId);
  if (existing) existing.items.push(item);
  else into.set(ruleId, { ruleId, reason, items: [item] });
}

/**
 * The rules only read `domain`, `title`, `why`, and an option's `cost`,
 * `label` and `detail` — which is exactly what `RuleIndexAction` carries, so
 * the cast is a statement about the projection, not a shortcut around it.
 */
export function personalizeIndexedPack(
  pack: RuleIndexPack,
  profile: Profile,
): IndexedPersonalization {
  if (profile.loss) return { actions: [], hidden: [], trimmed: [], quiet: true };

  const actions = pack.actions as unknown as Action[];

  const hidden: IndexedPersonalization["hidden"] = [];
  const kept = actions.filter((action) => {
    const rule = HIDE_RULES.find((candidate) => candidate.hides(action, profile));
    if (!rule) return true;
    hidden.push({ actionId: action.id, ruleId: rule.id, reason: rule.reason });
    return false;
  });

  // Same fallback as `personalizePack`: a pack never ends up empty, because
  // then the rule was wrong, not the parent.
  const shown = kept.length > 0 ? kept : actions;
  const trimmed: IndexedPersonalization["trimmed"] = [];
  const withOptions = shown.map((action) => {
    if (action.options.length === 0) return action;
    const removed: IndexedPersonalization["trimmed"] = [];
    const options = action.options.filter((option) => {
      const rule = OPTION_RULES.find((candidate) => candidate.trims(action, option, profile));
      if (!rule) return true;
      removed.push({
        actionId: action.id,
        optionId: option.id,
        ruleId: rule.id,
        reason: rule.reason,
      });
      return false;
    });
    // Never leave an action with no way to do it. If every option was
    // trimmed, the rule was wrong — show them all, and report nothing.
    if (options.length === 0) return action;
    trimmed.push(...removed);
    return { ...action, options };
  });

  return {
    actions: withOptions as unknown as RuleIndexAction[],
    hidden: kept.length > 0 ? hidden : [],
    trimmed: kept.length > 0 ? trimmed : [],
    quiet: false,
  };
}

/** The same rules, grouped into the sentences the settings page shows. */
export function ruleEffects(packs: readonly RuleIndexPack[], profile: Profile): RuleEffects {
  if (profile.loss) return { steps: [], options: [], quiet: true };

  const steps = new Map<string, RuleChange>();
  const options = new Map<string, RuleChange>();

  for (const pack of packs) {
    const result = personalizeIndexedPack(pack, profile);
    for (const entry of result.hidden) {
      const action = pack.actions.find((a) => a.id === entry.actionId) as RuleIndexAction;
      add(steps, entry.ruleId, entry.reason, `${action.title} (${pack.title})`);
    }
    for (const entry of result.trimmed) {
      const action = pack.actions.find((a) => a.id === entry.actionId) as RuleIndexAction;
      const option = action.options.find((o) => o.id === entry.optionId) as Option;
      add(
        options,
        entry.ruleId,
        entry.reason,
        `${option.label} in ${action.title} (${pack.title})`,
      );
    }
  }

  return { steps: [...steps.values()], options: [...options.values()], quiet: false };
}
