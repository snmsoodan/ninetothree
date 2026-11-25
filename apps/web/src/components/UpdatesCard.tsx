"use client";

import Link from "next/link";
import { Badge, Card, CardBody, TextLink } from "@ninetothree/ui";
import { CATEGORY_LABELS, ageWindowLabel, type Recall } from "@ninetothree/content";

import type { AgeUpdates } from "@/lib/recalls";

export interface UpdatesCardProps {
  updates: AgeUpdates | null;
  /** How many to show before sending them to the full page. */
  limit?: number;
}

const SEVERITY_TONE = {
  "stop-use": "red",
  check: "amber",
  info: "neutral",
} as const;

const SEVERITY_LABEL: Record<Recall["severity"], string> = {
  "stop-use": "Stop using it",
  check: "Check yours",
  info: "Worth knowing",
};

function monthsLabel(months: number): string {
  if (months < 0) return `${Math.abs(months)} months to go`;
  if (months === 0) return "just born";
  return `${months} months old`;
}

/**
 * What applies at this age, on the dashboard.
 *
 * Two deliberate omissions. It does not repeat anything already in the queue
 * above it, because the same recall twice on one screen reads as a system that
 * is not paying attention. And it never fills the space: three lines and a
 * link, because a parent opening this page at 3am needs to know whether
 * something affects them, not to read an inbox.
 *
 * When there is nothing it renders nothing at all. A heading over an empty
 * panel would suggest we had looked and found something bad.
 */
export function UpdatesCard({ updates, limit = 3 }: UpdatesCardProps) {
  if (!updates) return null;

  const theirs = updates.items.filter((item) => item.mine === null);
  if (theirs.length === 0) return null;

  const shown = theirs.slice(0, limit);
  const rest = theirs.length - shown.length;

  return (
    <section aria-labelledby="updates-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="updates-heading" className="font-display text-xl text-ink">
          Worth knowing now
        </h2>
        <span className="text-sm text-ink-faint">at {monthsLabel(updates.months)}</span>
      </div>

      <Card tone="sunken" className="mt-3">
        <CardBody className="pt-5">
          <ul className="space-y-4">
            {shown.map(({ recall }) => (
              <li key={recall.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={SEVERITY_TONE[recall.severity]}>
                    {SEVERITY_LABEL[recall.severity]}
                  </Badge>
                  <span className="text-sm text-ink-faint">
                    {CATEGORY_LABELS[recall.category]} · {ageWindowLabel(recall.ages)}
                  </span>
                </div>
                <p className="mt-1 text-base text-ink">
                  <TextLink href={recall.source.url} external>
                    {recall.title}
                  </TextLink>
                </p>
                <p className="mt-1 text-base text-ink-muted">{recall.product}</p>
              </li>
            ))}
          </ul>

          <Link
            href="/updates"
            className="mt-4 inline-block text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            {rest > 0 ? `And ${rest} more in Updates` : "All updates"}
          </Link>
        </CardBody>
      </Card>
    </section>
  );
}
