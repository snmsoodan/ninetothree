"use client";

import { Badge, Card, CardBody, TextLink } from "@ninetothree/ui";
import type { RecallBecause, RecallSeverity } from "@ninetothree/content";

import { formatDate } from "@/lib/i18n";

export interface RecallNoticeItem {
  /** `${recallId}:${matchedOn}`. */
  id: string;
  title: string;
  product: string;
  hazard: string;
  action: string;
  severity: RecallSeverity;
  because: RecallBecause;
  /** The option id, action id, or keyword that made the match. */
  matchedOn: string;
  /** ISO date, YYYY-MM-DD. */
  publishedAt: string;
  source: { title: string; publisher: string; url: string };
}

export interface RecallNoticeProps {
  notice: RecallNoticeItem;
  onDismiss?: (id: string) => void;
}

const SEVERITY_LABEL: Record<RecallSeverity, string> = {
  "stop-use": "Stop using it",
  check: "Check yours",
  info: "Worth knowing",
};

const SEVERITY_TONE = {
  "stop-use": "red",
  check: "amber",
  info: "neutral",
} as const;

/**
 * Why this reached them, in the parent's own terms.
 *
 * The reason is the whole point of the notice: a recall that arrives with no
 * explanation reads as a mailing list. "You pinned this step" is the product
 * saying "I remembered what you told me".
 */
const BECAUSE_COPY: Record<RecallBecause, string> = {
  option: "You chose this.",
  step: "You pinned this step.",
  keyword: "You pinned a step about this.",
};

function announcedOn(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return formatDate(new Date(Date.UTC(year, month - 1, day)), {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * One recall, for one parent.
 *
 * Red is used here and almost nowhere else, because a stop-use recall is the
 * one thing in this product that is actually wrong. It is still not a banner:
 * no icon, no exclamation, no "URGENT". The severity is a word, the hazard is
 * a sentence, and the action is the last thing they read.
 */
export function RecallNotice({ notice, onDismiss }: RecallNoticeProps) {
  return (
    <Card tone="raised" className="border-l-2 border-l-red">
      <CardBody className="py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={SEVERITY_TONE[notice.severity]}>{SEVERITY_LABEL[notice.severity]}</Badge>
          <span className="text-sm text-ink-faint">{BECAUSE_COPY[notice.because]}</span>
        </div>

        <h3 className="mt-2 font-display text-xl text-ink">{notice.title}</h3>
        <p className="mt-1 text-base text-ink-muted">{notice.product}</p>

        <p className="mt-3 text-base text-ink">{notice.hazard}</p>
        <p className="mt-2 text-base text-ink">{notice.action}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <TextLink href={notice.source.url} external className="text-sm">
            {notice.source.publisher}
          </TextLink>
          <span className="text-sm text-ink-faint tabular">
            Announced {announcedOn(notice.publishedAt)}
          </span>
        </div>

        {onDismiss ? (
          <button
            type="button"
            onClick={() => onDismiss(notice.id)}
            className="mt-3 rounded-sm text-sm text-ink-faint underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Put this away
          </button>
        ) : null}
      </CardBody>
    </Card>
  );
}
