"use client";

import { useState } from "react";
import { Button, Dialog } from "@ninetothree/ui";
import { ButtonLink } from "@/components/ButtonLink";
import { completeWeek, reopenWeek } from "@/lib/store";
import type { WeekProgress } from "@/lib/week";

export interface WeekCompletionProps {
  packId: string;
  progress: WeekProgress;
  /** Where "Look ahead" goes. Absent on the last week of the guide. */
  nextHref?: string;
}

/**
 * The whole celebration, and the way out of it.
 *
 * A week finishes two ways: every step is done or skipped, or a parent decides
 * to move on with steps still open. The second is a real decision and it is
 * recorded as `forced`, because only a forced week can be reopened — there is
 * nothing to reopen in a week whose steps are all settled.
 */
export function WeekCompletion({ packId, progress, nextHref }: WeekCompletionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (progress.finished) {
    return (
      <section
        aria-labelledby="week-finished-heading"
        className="mt-8 rounded-lg border border-line bg-paper-raised p-6"
      >
        <h2 id="week-finished-heading" className="font-display text-2xl text-ink">
          That&rsquo;s this week.
        </h2>
        <p className="mt-1 text-base text-ink-muted">Nothing else to do until Monday.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {nextHref ? (
            <ButtonLink href={nextHref} variant="secondary" size="sm">
              Look ahead
            </ButtonLink>
          ) : null}
          <ButtonLink href="/" variant="quiet" size="sm">
            Go to dashboard
          </ButtonLink>
          {progress.reopenable ? (
            <Button variant="quiet" size="sm" onClick={() => reopenWeek(packId)}>
              Reopen this week
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="mt-8">
      <Button variant="quiet" size="sm" onClick={() => setConfirmOpen(true)}>
        I&rsquo;m done with this week
      </Button>
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Mark this week done?"
        description="Some steps are still open. Nothing expires — they will be here if you come back."
        footer={
          <>
            <Button variant="quiet" onClick={() => setConfirmOpen(false)}>
              Not yet
            </Button>
            <Button
              onClick={() => {
                completeWeek(packId, true);
                setConfirmOpen(false);
              }}
            >
              Mark it done
            </Button>
          </>
        }
      />
    </div>
  );
}
