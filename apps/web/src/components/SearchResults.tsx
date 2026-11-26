import Link from "next/link";
import type { SearchHit } from "@ninetothree/content";
import {
  SEARCH_KIND_LABEL,
  SEARCH_NOTHING,
  SEARCH_NOTHING_HINT,
  searchResultLine,
} from "@ninetothree/domain";
import { Card, CardBody } from "@ninetothree/ui";

export interface SearchResultsProps {
  hits: SearchHit[];
  /** The query as typed, so the empty state can quote it back. */
  query: string;
}

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
        <p className="text-lg text-ink">{SEARCH_NOTHING}</p>
        <p className="mt-2 text-ink-muted">{SEARCH_NOTHING_HINT}</p>
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
                {SEARCH_KIND_LABEL[hit.kind]}
              </p>
              <h2 className="mt-1 font-display text-lg text-ink">
                <Link
                  href={hit.href}
                  className="underline decoration-1 underline-offset-2 hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                >
                  {hit.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-ink-muted">{searchResultLine(hit)}</p>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}
