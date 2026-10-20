"use client";

import Link from "next/link";
import type { StagePack } from "@ninetothree/content";
import { Badge, Progress } from "@ninetothree/ui";

export interface WeekSummaryCardProps {
  pack: StagePack;
  /** How many of this pack's core actions are done. */
  done: number;
  /** The stage label, e.g. "Week 28". */
  stage: string;
  /** Where "Open this week" goes. */
  href: string;
  /** Where "Look ahead" goes, when this week is finished. */
  nextHref?: string;
}

/**
 * The one primary card on the dashboard. It is the product: a parent opens the
 * app, sees what this week is, and taps once. Everything else on the screen is
 * quieter than this on purpose.
 */
export function WeekSummaryCard({ pack, done, stage, href, nextHref }: WeekSummaryCardProps) {
  const total = pack.coreActions.length;
  const finished = done >= total;
  const percent = total === 0 ? 0 : (done / total) * 100;

  return (
    <section
      aria-labelledby="this-week-heading"
      className="rounded-lg border border-line bg-paper-raised p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <Badge tone="clay">{stage}</Badge>
        <span className="text-sm text-ink-faint tabular">
          {done} of {total} done
        </span>
      </div>

      <h1 id="this-week-heading" className="mt-3 font-display text-3xl leading-tight text-ink">
        {pack.title}
      </h1>
      {pack.subtitle ? <p className="mt-2 text-lg text-ink-muted">{pack.subtitle}</p> : null}

      <Progress
        value={percent}
        label={finished ? "This week is done" : "This week"}
        hideValue
        className="mt-5"
      />

      {finished ? (
        <div className="mt-5">
          <p className="text-base text-ink">You are done for this week.</p>
          <p className="mt-1 text-base text-ink-muted">Nothing else to do until Monday.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {nextHref ? (
              <Link
                href={nextHref}
                className="inline-flex min-h-11 items-center rounded-md border border-line-strong bg-paper-raised px-4 text-base font-medium text-ink hover:bg-paper-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
              >
                Look ahead
              </Link>
            ) : null}
            <Link
              href={href}
              className="inline-flex min-h-11 items-center rounded-md px-4 text-base text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              Read it again
            </Link>
          </div>
        </div>
      ) : (
        <Link
          href={href}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-ink px-5 text-base font-medium text-paper hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        >
          Open this week
        </Link>
      )}
    </section>
  );
}
