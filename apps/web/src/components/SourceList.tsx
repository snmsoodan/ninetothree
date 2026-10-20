import type { Source } from "@ninetothree/content";
import { TextLink } from "@ninetothree/ui";

export interface SourceListProps {
  sources: Source[];
  reviewedBy: string;
  reviewedAt: string;
}

const KIND_LABEL: Record<Source["kind"], string> = {
  clinical: "Clinical",
  government: "Government",
  charity: "Charity",
  editorial: "Editorial",
  vendor: "Vendor",
};

/**
 * Every pack shows where it came from. This is the trust surface: a
 * parent can check us, and a clinician can see we are not inventing.
 */
export function SourceList({ sources, reviewedBy, reviewedAt }: SourceListProps) {
  return (
    <section aria-labelledby="sources-heading" className="border-t border-line pt-5">
      <h2 id="sources-heading" className="text-sm font-medium text-ink-muted">
        Where this comes from
      </h2>
      <ul className="mt-2 space-y-1.5">
        {sources.map((source) => (
          <li key={source.id} className="text-sm text-ink-muted">
            <TextLink href={source.url} external className="text-ink-muted">
              {source.title}
            </TextLink>
            <span className="text-ink-faint">
              {" "}
              — {source.publisher}, {KIND_LABEL[source.kind]}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-faint">
        Reviewed by {reviewedBy} · {reviewedAt}
      </p>
    </section>
  );
}
