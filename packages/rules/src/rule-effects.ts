import type { Action, Option } from "@ninetothree/content";
import type { RuleIndexPack } from "@ninetothree/content/rule-index";
import { HIDE_RULES, OPTION_RULES, type Profile } from "./personalize";

/**
 * "Why am I not seeing this?", answered from the index.
 *
 * The settings page asks this across the whole guide, which means it needs
 * every step's rule-bearing fields — but not a word of their prose. This walks
 * the same two rule lists as `personalizePack`, over the generated projection,
 * and reports the same reasons. One rule engine, two shapes of input.
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
export function ruleEffects(packs: readonly RuleIndexPack[], profile: Profile): RuleEffects {
  if (profile.loss) return { steps: [], options: [], quiet: true };

  const steps = new Map<string, RuleChange>();
  const options = new Map<string, RuleChange>();

  for (const pack of packs) {
    const actions = pack.actions as unknown as Action[];

    const kept = actions.filter((action) => {
      const rule = HIDE_RULES.find((candidate) => candidate.hides(action, profile));
      if (!rule) return true;
      add(steps, rule.id, rule.reason, `${action.title} (${pack.title})`);
      return false;
    });

    // Same fallback as `personalizePack`: a pack never ends up empty, because
    // then the rule was wrong, not the parent.
    const shown = kept.length > 0 ? kept : actions;
    for (const action of shown) {
      if (action.options.length === 0) continue;
      // Collected first, then reported: if every option of an action was
      // trimmed, the rule was wrong and the parent should see them all.
      const trimmed: { rule: { id: string; reason: string }; option: Option }[] = [];
      for (const option of action.options) {
        const rule = OPTION_RULES.find((candidate) => candidate.trims(action, option, profile));
        if (rule) trimmed.push({ rule, option });
      }
      if (trimmed.length === action.options.length) continue;
      for (const { rule, option } of trimmed) {
        add(options, rule.id, rule.reason, `${option.label} in ${action.title} (${pack.title})`);
      }
    }
  }

  return { steps: [...steps.values()], options: [...options.values()], quiet: false };
}
