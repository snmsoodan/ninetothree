"use client";

import {
  HISTORY_COMPLETE,
  HISTORY_NOTHING,
  HISTORY_NOTHING_BODY,
  HISTORY_REASON,
  HISTORY_RETIRED,
  formatDay,
  weekSummary,
} from "@ninetothree/domain";
import type { History, HistoryAction } from "@ninetothree/domain";
import { Badge, Card, CardBody } from "@ninetothree/ui";

export interface HistoryListProps {
  history: History;
}

function Row({ action }: { action: HistoryAction }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-base text-ink">{action.title}</p>
        {action.retired ? <p className="mt-0.5 text-sm text-ink-faint">{HISTORY_RETIRED}</p> : null}
        {action.reason ? (
          <p className="mt-0.5 text-sm text-ink-faint">
            {HISTORY_REASON}
            {action.reason}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm text-ink-faint tabular">{formatDay(action.at)}</span>
        <Badge tone={action.status === "done" ? "sage" : "neutral"}>
          {action.status === "done" ? "Done" : "Skipped"}
        </Badge>
      </div>
    </div>
  );
}

/**
 * The record of what a parent actually did, newest first. It is deliberately
 * not a scoreboard: no percentage, no streak, no "you are behind". A skipped
 * step is shown with the same weight as a done one, because skipping is a
 * decision, not a failure.
 */
export function HistoryList({ history }: HistoryListProps) {
  if (history.weeks.length === 0) {
    return (
      <Card tone="sunken">
        <CardBody className="pt-5">
          <p className="text-base text-ink">{HISTORY_NOTHING}</p>
          <p className="mt-1 text-base text-ink-muted">{HISTORY_NOTHING_BODY}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {history.weeks.map((week) => (
        <section
          key={`${week.packId}-${week.packTitle}`}
          aria-labelledby={`history-${week.packId}`}
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 id={`history-${week.packId}`} className="font-display text-xl text-ink">
              {week.packTitle}
            </h2>
            <p className="text-sm text-ink-faint tabular">{weekSummary(week)}</p>
          </div>
          {week.complete ? <p className="mt-1 text-sm text-sage">{HISTORY_COMPLETE}</p> : null}
          <ul className="mt-3">
            {week.actions.map((action) => (
              <li key={action.id} className="border-t border-line py-3 first:border-t-0 first:pt-0">
                <Row action={action} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
