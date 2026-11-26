"use client";

import { BECAUSE_COPY, SEVERITY_LABEL, announcedOn, type NoticeReason } from "@ninetothree/domain";
import type { RecallSeverity } from "@ninetothree/content";
import { Badge, Card, CardBody, TextLink } from "@ninetothree/ui";

/**
 * `age` is not a match: it is the window saying this applies right now. `list`
 * is the same admission one step earlier — a parent who has not told us any
 * dates is reading the list itself, unfiltered, and we say that rather than
 * implying a window we do not have.
 */
export interface RecallNoticeItem {
  /** `${recallId}:${matchedOn}`. */
  id: string;
  title: string;
  product: string;
  hazard: string;
  action: string;
  severity: RecallSeverity;
  because: NoticeReason;
  /** The option id, action id, or keyword that made the match. */
  matchedOn: string;
  /** ISO date, YYYY-MM-DD. */
  publishedAt: string;
  source: { title: string; publisher: string; url: string };
}

export interface RecallNoticeProps {
  notice: RecallNoticeItem;
  /** A short line beside the reason, e.g. "Sleep · Birth to 6 months". */
  meta?: string;
  onDismiss?: (id: string) => void;
}

const SEVERITY_TONE = {
  "stop-use": "red",
  check: "amber",
  info: "neutral",
} as const;

/**
 * One recall, for one parent.
 *
 * Red is used here and almost nowhere else, because a stop-use recall is the
 * one thing in this product that is actually wrong. It is still not a banner:
 * no icon, no exclamation, no "URGENT". The severity is a word, the hazard is
 * a sentence, and the action is the last thing they read.
 */
export function RecallNotice({ notice, meta, onDismiss }: RecallNoticeProps) {
  return (
    <Card tone="raised" className="border-l-2 border-l-red">
      <CardBody className="py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={SEVERITY_TONE[notice.severity]}>{SEVERITY_LABEL[notice.severity]}</Badge>
          <span className="text-sm text-ink-faint">{BECAUSE_COPY[notice.because]}</span>
          {meta ? <span className="text-sm text-ink-faint">· {meta}</span> : null}
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
