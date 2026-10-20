import type { Source } from "@ninetothree/content";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** A review date is a fact about the page, so it carries the year. */
export function formatReviewDate(date: string): string {
  const [year, month, day] = date.split("-");
  const name = MONTHS[Number(month) - 1] ?? month;
  return `${name} ${Number(day)}, ${year}`;
}

const KIND_LABEL: Record<Source["kind"], string> = {
  clinical: "Clinical",
  government: "Government",
  charity: "Charity",
  editorial: "Editorial",
  vendor: "Vendor",
};

export interface SourceBlockProps {
  sources: Source[];
  reviewedBy: string;
  reviewedAt: string;
  updatedAt: string;
}

/**
 * The block that makes an article checkable.
 *
 * Every article ends with the same three facts: where the claims came from,
 * who reviewed it, and when. A page without them is not published — the
 * schema refuses it — so this block is never optional and never collapsed.
 */
export function SourceBlock({ sources, reviewedBy, reviewedAt, updatedAt }: SourceBlockProps) {
  return (
    <section aria-labelledby="sources-heading" className="mt-12 border-t border-line pt-6">
      <h2 id="sources-heading" className="font-display text-xl text-ink">
        Where this comes from
      </h2>
      <ul className="mt-3 space-y-2">
        {sources.map((source) => (
          <li key={source.id} className="text-sm">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink"
            >
              {source.title}
            </a>
            <span className="text-ink-muted">
              {" — "}
              {source.publisher}
              {", "}
              {KIND_LABEL[source.kind]}
            </span>
            <span className="sr-only"> (opens in a new tab)</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-muted">
        Reviewed by {reviewedBy} on {formatReviewDate(reviewedAt)}. Last changed{" "}
        {formatReviewDate(updatedAt)}.
      </p>
    </section>
  );
}
