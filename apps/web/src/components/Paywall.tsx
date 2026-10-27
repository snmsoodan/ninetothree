"use client";

import type { ReactNode } from "react";
import { Card, CardBody, TextLink } from "@ninetothree/ui";

export interface PaywallProps {
  /** What is behind the wall, in the reader's words. */
  title: string;
  /** One line about what this particular thing is. */
  body?: string;
  /**
   * What stays free, in this context. The default is the timeline-and-pins
   * line, which is right for a week; the invite gate passes its own, because
   * "the week you are in" means nothing next to a household.
   */
  free?: string;
  /**
   * Anything that must stay visible regardless of the plan. The red flags of a
   * gated week are passed here, so "we never hide a red flag" is true of the
   * page rather than only of `/safety`.
   */
  children?: ReactNode;
}

const FREE_LINE =
  "Everything for the week you are in, and everything about safety, stays free. Plus opens the whole timeline — every week behind you and every week ahead — and lets you pin as much as you like.";

/**
 * The calm version of a paywall.
 *
 * No lock icon, no blurred text, no countdown. It says what this is, what stays
 * free, and where to read more — and then it gets out of the way. The red flags
 * for the week are rendered underneath, because a parent who lands on a week
 * they cannot read still needs to know what would be an emergency.
 */
export function Paywall({ title, body, free, children }: PaywallProps) {
  return (
    <div className="measure">
      <Card tone="sunken">
        <CardBody>
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          {body ? <p className="mt-2 text-base text-ink-muted">{body}</p> : null}
          <p className="mt-4 text-base text-ink-muted">{free ?? FREE_LINE}</p>
          <p className="mt-4">
            <TextLink href="/settings#plan">See what Plus is</TextLink>
          </p>
        </CardBody>
      </Card>
      {children}
    </div>
  );
}
