"use client";

import Link from "next/link";
import type { Lens } from "@ninetothree/content/core";
import { Badge, Card, CardBody } from "@ninetothree/ui";
import { ActionItem } from "./ActionItem";

export interface PersonaLensCardProps {
  lens: Lens;
  /** The pack this lens belongs to, for a pin's label and snapshot. */
  packId: string;
  packTitle: string;
  /** ISO date. Passed in so the snooze answer is the same on server and client. */
  today: string;
  /** The week page, when the lens is shown on the dashboard. */
  href?: string;
}

/**
 * The lens: what this week asks of the person reading it.
 *
 * Two shapes, one component. An **authored** week was written for this reader,
 * so its actions are real and checkable. A **track** is advice for the band —
 * the whole first trimester, the whole first year — so its suggestions are
 * read-only and it says which band it is talking about. A tick on a
 * three-month band would be a lie about what was done.
 *
 * The light line is last, in the same quiet type as everything else. It is
 * already suppressed by the caller for a loss or with humour off.
 */
export function PersonaLensCard({ lens, packId, packTitle, today, href }: PersonaLensCardProps) {
  return (
    <Card>
      <CardBody className="pt-5">
        {lens.source === "track" ? (
          <p className="text-sm text-ink-faint">{lens.bandLabel}</p>
        ) : null}
        <h2 className="mt-1 font-display text-2xl text-ink">{lens.headline}</h2>
        <p className="mt-2 text-base text-ink-muted">{lens.body}</p>

        {lens.actions.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {lens.actions.map((action) => (
              <li key={action.id}>
                <ActionItem action={action} packId={packId} packTitle={packTitle} today={today} />
              </li>
            ))}
          </ul>
        ) : null}

        {lens.suggestions.length > 0 ? (
          <ul className="mt-5 space-y-4">
            {lens.suggestions.map((suggestion) => (
              <li key={suggestion.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-base font-medium text-ink">{suggestion.title}</h3>
                  {suggestion.minutes ? (
                    <Badge tone="neutral" className="tabular shrink-0">
                      {suggestion.minutes} min
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-ink-muted">{suggestion.why}</p>
              </li>
            ))}
          </ul>
        ) : null}

        {lens.light ? <p className="mt-5 text-sm text-ink-faint">{lens.light}</p> : null}

        {href ? (
          <p className="mt-5">
            <Link
              href={href}
              className="text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              Read this week in full
            </Link>
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
