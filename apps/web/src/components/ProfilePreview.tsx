"use client";

import { useMemo } from "react";
import type { RuleIndexPack } from "@ninetothree/content/rule-index";
import { ruleEffects, type Profile } from "@ninetothree/rules";

export interface ProfilePreviewProps {
  /** The rule projection of the guide — every step's rule-bearing fields, no prose. */
  index: readonly RuleIndexPack[];
  profile: Profile;
}

/**
 * The answer to "why am I not seeing this?", shown where the parent changed
 * the setting rather than buried in a help page.
 *
 * It looks across the whole guide, not just this week: a parent who says they
 * have no car is changing week 36, and telling them "nothing is hidden" because
 * they happen to be on week 28 would be a lie.
 */
export function ProfilePreview({ index, profile }: ProfilePreviewProps) {
  const { steps, options, quiet } = useMemo(() => ruleEffects(index, profile), [index, profile]);

  const empty = steps.length === 0 && options.length === 0;

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
