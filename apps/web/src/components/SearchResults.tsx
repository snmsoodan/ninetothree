import Link from "next/link";
import type { SearchHit, SearchKind } from "@ninetothree/content";
import { Card, CardBody } from "@ninetothree/ui";

export interface SearchResultsProps {
  hits: SearchHit[];
  /** The query as typed, so the empty state can quote it back. */
  query: string;
}

const KIND_LABEL: Record<SearchKind, string> = {
  step: "A step",
  week: "A week",
  link: "In the library",
};

/**
 * What a search found, and where each answer comes from.
 *
 * Every result says which week it belongs to, because a parent searching
 * "glucose" needs to know whether this is something to do now or in
 * fourteen weeks. A result with no citation is not shown at all.
 */
export function SearchResults({ hits, query }: SearchResultsProps) {
  if (query.trim() === "") return null;

  if (hits.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-lg text-ink">Nothing here for that.</p>
        <p className="mt-2 text-ink-muted">
          Try a shorter word, or browse the library — everything we link to is in one place.
        </p>
        <p className="mt-4">
          <Link
            href="/library"
            className="text-clay underline decoration-1 underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Open the library
          </Link>
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {hits.map((hit) => (
        <li key={hit.id}>
          <Card>
            <CardBody className="pt-5">
              <p className="text-xs uppercase tracking-wide text-ink-faint">
                {KIND_LABEL[hit.kind]}
              </p>
              <h2 className="mt-1 font-display text-lg text-ink">
                <Link
                  href={hit.href}
                  className="underline decoration-1 underline-offset-2 hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                >
                  {hit.title}
                </Link>
              </h2>
              {hit.packTitle ? (
                <p className="mt-1 text-sm text-ink-muted">
                  {hit.packTitle} · {hit.sourceIds.length}{" "}
                  {hit.sourceIds.length === 1 ? "source" : "sources"}
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink-muted">Checked and cited in the library</p>
              )}
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}
