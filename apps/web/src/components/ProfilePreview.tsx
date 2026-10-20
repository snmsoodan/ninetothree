"use client";

import { useMemo } from "react";
import type { Action, Option, StagePack } from "@ninetothree/content";
import { personalizePack, type Profile } from "@ninetothree/rules";

export interface ProfilePreviewProps {
  packs: StagePack[];
  profile: Profile;
}

interface Change {
  ruleId: string;
  reason: string;
  items: string[];
}

/**
 * The answer to "why am I not seeing this?", shown where the parent changed
 * the setting rather than buried in a help page.
 *
 * It looks across the whole guide, not just this week: a parent who says they
 * have no car is changing week 36, and telling them "nothing is hidden" because
 * they happen to be on week 28 would be a lie.
 */
export function ProfilePreview({ packs, profile }: ProfilePreviewProps) {
  const { steps, options } = useMemo(() => {
    const steps = new Map<string, Change>();
    const options = new Map<string, Change>();

    const add = (into: Map<string, Change>, ruleId: string, reason: string, item: string) => {
      const existing = into.get(ruleId);
      if (existing) existing.items.push(item);
      else into.set(ruleId, { ruleId, reason, items: [item] });
    };

    for (const pack of packs) {
      const result = personalizePack(pack, profile);
      // A rule can only report an action or option it was given, so these
      // lookups always hit. The casts say so without a dead branch.
      for (const hidden of result.hidden) {
        const action = pack.coreActions.find((a) => a.id === hidden.actionId) as Action;
        add(steps, hidden.ruleId, hidden.reason, `${action.title} (${pack.title})`);
      }
      for (const trimmed of result.trimmed) {
        const action = pack.coreActions.find((a) => a.id === trimmed.actionId) as Action;
        const option = action.options.find((o) => o.id === trimmed.optionId) as Option;
        add(
          options,
          trimmed.ruleId,
          trimmed.reason,
          `${option.label} in ${action.title} (${pack.title})`,
        );
      }
    }

    return { steps: [...steps.values()], options: [...options.values()] };
  }, [packs, profile]);

  const empty = steps.length === 0 && options.length === 0;
  const quiet = profile.loss !== undefined;

  return (
    <section aria-labelledby="preview-heading" className="mt-8">
      <h2 id="preview-heading" className="font-display text-2xl text-ink">
        What these settings change
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        Across the whole guide, not just this week. It changes as you change the settings above.
      </p>
      {quiet ? (
        <p className="mt-3 text-sm text-ink">
          The weekly guide is paused, so there is no week to change. Nothing has been deleted.
        </p>
      ) : empty ? (
        <p className="mt-3 text-sm text-ink-faint">Nothing is hidden right now.</p>
      ) : (
        <div className="mt-3 space-y-5">
          {steps.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-ink-muted">Steps we do not show you</h3>
              <ul className="mt-2 space-y-3">
                {steps.map((change) => (
                  <li key={change.ruleId}>
                    <p className="text-base text-ink">{change.reason}</p>
                    <ul className="mt-1 space-y-1 text-sm text-ink-muted">
                      {change.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {options.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-ink-muted">Options we do not show you</h3>
              <ul className="mt-2 space-y-3">
                {options.map((change) => (
                  <li key={change.ruleId}>
                    <p className="text-base text-ink">{change.reason}</p>
                    <ul className="mt-1 space-y-1 text-sm text-ink-muted">
                      {change.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
