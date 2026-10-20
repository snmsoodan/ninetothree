"use client";

import { Card, CardBody } from "@ninetothree/ui";
import { ButtonLink } from "@/components/ButtonLink";

/**
 * What the guide shows instead of a week, after a loss.
 *
 * No sympathy card, no advice, no euphemism. It says what changed, what did
 * not, and where the two things that still work are.
 */
export function QuietWeek() {
  return (
    <Card tone="sunken">
      <CardBody className="space-y-4 pt-5">
        <h2 className="font-display text-2xl text-ink">The weekly guide is paused.</h2>
        <p className="text-base text-ink">
          You told us about a loss. We have stopped showing the week, and we have stopped sending
          the weekly email.
        </p>
        <p className="text-base text-ink-muted">
          Nothing you wrote down has been deleted. The safety page is still here, and so is
          everything you pinned.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <ButtonLink href="/safety" variant="secondary">
            Open the safety page
          </ButtonLink>
          <ButtonLink href="/settings" variant="quiet">
            Change this in settings
          </ButtonLink>
        </div>
      </CardBody>
    </Card>
  );
}
