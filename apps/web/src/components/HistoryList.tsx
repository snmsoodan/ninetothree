"use client";

import { Badge, Card, CardBody } from "@ninetothree/ui";
import type { History, HistoryAction, HistoryWeek } from "@/lib/history";

export interface HistoryListProps {
  history: History;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Hand-rolled, not `Intl`. `Intl.DateTimeFormat` can resolve differently on
 * the server and the client, which produces a hydration mismatch and a visible
 * re-render. A month table cannot disagree with itself.
 */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  // getUTCMonth is 0-11 and MONTHS has twelve entries, so the lookup always hits.
  const month = MONTHS[date.getUTCMonth()] as string;
  return `${month} ${date.getUTCDate()}`;
}

function summary(week: HistoryWeek): string {
  const parts: string[] = [];
  if (week.done > 0) parts.push(`${week.done} done`);
  if (week.skipped > 0) parts.push(`${week.skipped} skipped`);
  return parts.join(", ");
}

function Row({ action }: { action: HistoryAction }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-base text-ink">{action.title}</p>
        {action.retired ? (
          <p className="mt-0.5 text-sm text-ink-faint">
            This step is no longer in the guide. What you did is still here.
          </p>
        ) : null}
        {action.reason ? (
          <p className="mt-0.5 text-sm text-ink-faint">You said: {action.reason}</p>
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
          <p className="text-base text-ink">Nothing recorded yet.</p>
          <p className="mt-1 text-base text-ink-muted">
            When you mark something done or skip it, it lands here. Nothing is recorded until you
            say so.
          </p>
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
            <p className="text-sm text-ink-faint tabular">{summary(week)}</p>
          </div>
          {week.complete ? (
            <p className="mt-1 text-sm text-sage">Everything in this week is accounted for.</p>
          ) : null}
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
