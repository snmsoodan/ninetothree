"use client";

import Link from "next/link";
import { Card, CardBody } from "@ninetothree/ui";
import type { Recall } from "@ninetothree/content";
import type { Notice } from "@/lib/store";
import { RecallNotice, type RecallNoticeItem } from "./RecallNotice";

export interface RecallListProps {
  notices: Notice[];
  recalls: Recall[];
  onDismiss?: (id: string) => void;
}

/**
 * Turns a stored notice back into something readable.
 *
 * The notice is a snapshot of the recall's title and product, but the hazard,
 * the action and the source are read live from the feed. A recall that has
 * been withdrawn from the feed is dropped rather than shown from the snapshot:
 * a parent should not be told to stop using something because of a notice we
 * can no longer stand behind.
 */
function toItem(notice: Notice, recall: Recall): RecallNoticeItem {
  return {
    id: notice.id,
    title: recall.title,
    product: recall.product,
    hazard: recall.hazard,
    action: recall.action,
    severity: recall.severity,
    because: notice.because,
    matchedOn: notice.matchedOn,
    publishedAt: recall.publishedAt,
    source: recall.source,
  };
}

/**
 * The recall queue.
 *
 * It is a list, not a feed: it only ever holds things that match something
 * this parent pinned or chose, it never grows on its own, and putting one away
 * is permanent. An empty queue is the normal state and is written as good
 * news, not as a blank panel.
 */
export function RecallList({ notices, recalls, onDismiss }: RecallListProps) {
  const byId = new Map(recalls.map((recall) => [recall.id, recall]));
  const items = notices
    .map((notice) => {
      const recall = byId.get(notice.recallId);
      return recall ? toItem(notice, recall) : null;
    })
    .filter((item): item is RecallNoticeItem => item !== null);

  return (
    <section aria-labelledby="recalls-heading">
      <h2 id="recalls-heading" className="font-display text-xl text-ink">
        Recalls
      </h2>

      {items.length === 0 ? (
        <Card tone="sunken" className="mt-3">
          <CardBody className="pt-5">
            <p className="text-base text-ink">Nothing recalled.</p>
            <p className="mt-1 text-base text-ink-muted">
              We check the things you pinned and chose against new recalls. If one of them is
              affected, it shows up here.
            </p>
            <Link
              href="/shelf"
              className="mt-3 inline-block text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              See what you can pin
            </Link>
          </CardBody>
        </Card>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <RecallNotice notice={item} onDismiss={onDismiss} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
