import type { Source } from "@ninetothree/content";
import {
  READ_OPEN_NOTE,
  READ_SOURCES_HEADING,
  SOURCE_KIND_LABEL,
  reviewLine,
} from "@ninetothree/domain";

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
        {READ_SOURCES_HEADING}
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
              {SOURCE_KIND_LABEL[source.kind]}
            </span>
            <span className="sr-only">{READ_OPEN_NOTE}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-muted">{reviewLine(reviewedBy, reviewedAt, updatedAt)}</p>
    </section>
  );
}
