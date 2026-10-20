"use client";

export interface ProgressLineProps {
  weeksDone: number;
  actionsDone: number;
}

/**
 * Progress, without a score. No streak, no level, no percentage of the whole
 * three years — a parent who has done eleven things should not be told they
 * are 0.4% of the way through.
 */
export function ProgressLine({ weeksDone, actionsDone }: ProgressLineProps) {
  const weeks = `${weeksDone} ${weeksDone === 1 ? "week" : "weeks"}`;
  const actions = `${actionsDone} ${actionsDone === 1 ? "step" : "steps"}`;

  return (
    <section aria-labelledby="progress-heading">
      <h2 id="progress-heading" className="font-display text-xl text-ink">
        So far
      </h2>
      <p className="mt-2 text-base text-ink-muted tabular">
        {weeksDone === 0 && actionsDone === 0
          ? "Nothing yet. That is fine — this is the first one."
          : `You have finished ${weeks} and ${actions}.`}
      </p>
    </section>
  );
}
