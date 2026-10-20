"use client";

import { useState } from "react";
import { Button, Card, CardBody } from "@ninetothree/ui";

export interface ShareCardProps {
  /** The week being shared, e.g. "Week 28". */
  stage: string;
  /** Absolute URL to share. Falls back to the current location. */
  url?: string;
}

/**
 * The partner card. Partner accounts are issue #36; this is the honest v1 —
 * a way to put this week in front of the other person without an invite flow,
 * an email capture, or a promise the product cannot keep yet.
 */
export function ShareCard({ stage, url }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  async function share(): Promise<void> {
    const target = url ?? window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `Nine to Three — ${stage}`, url: target });
        return;
      } catch {
        // The parent dismissed the sheet. Fall through to copying, which is
        // the only other thing that could have been meant.
      }
    }
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      // Clipboard is blocked. The URL is visible in the address bar; saying
      // nothing is better than an error dialog for a non-essential action.
    }
  }

  return (
    <section aria-labelledby="share-heading">
      <h2 id="share-heading" className="font-display text-xl text-ink">
        Bringing someone with you
      </h2>
      <Card tone="sunken" className="mt-3">
        <CardBody className="pt-5">
          <p className="text-base text-ink-muted">
            Send them this week. They will see the same page you do — no account, nothing to set up.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => void share()}>
              Share {stage}
            </Button>
            <span role="status" aria-live="polite" className="text-sm text-sage">
              {copied ? "Link copied." : ""}
            </span>
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
