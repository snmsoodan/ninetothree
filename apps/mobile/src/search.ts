import type { SearchDoc } from "@ninetothree/content";
import {
  SEARCH_HEADING,
  SEARCH_INTRO,
  SEARCH_KIND_LABEL,
  SEARCH_NOTHING,
  SEARCH_NOTHING_HINT,
  SEARCH_PLACEHOLDER,
  searchGuide,
  searchResultLine,
} from "@ninetothree/domain";

/**
 * Search, as data.
 *
 * The web fetches its index and keeps it in state; the phone already has the
 * corpus in the bundle, so it builds the same index once at start-up and hands
 * it here. The scoring is `@ninetothree/domain`'s `searchGuide`, which is the
 * web page's function, so a query typed in a shop finds what the laptop found.
 */

export const SEARCH_LIMIT = 20;

export const SEARCH_PROMPT = "Plain words are fine. Try “car seat”, “glucose”, “daycare”.";

export interface SearchRow {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  /** The line under the title: which week it belongs to, or the library. */
  line: string;
  href: string;
  /** A result with a URL leaves the app; everything else is a route. */
  external: boolean;
}

export interface SearchModel {
  heading: string;
  intro: string;
  query: string;
  queryLabel: string;
  placeholder: string;
  prompt: string;
  /** Nothing typed yet: the page says what it is for rather than "no results". */
  blank: boolean;
  nothing: boolean;
  nothingLine: string;
  nothingHint: string;
  rows: SearchRow[];
}

export interface SearchInput {
  docs: readonly SearchDoc[];
  query: string;
}

export function searchModel({ docs, query }: SearchInput): SearchModel {
  const blank = query.trim() === "";
  const hits = blank ? [] : searchGuide(docs, query, SEARCH_LIMIT);

  return {
    heading: SEARCH_HEADING,
    intro: SEARCH_INTRO,
    query,
    queryLabel: "What are you looking for?",
    placeholder: SEARCH_PLACEHOLDER,
    prompt: SEARCH_PROMPT,
    blank,
    nothing: !blank && hits.length === 0,
    nothingLine: SEARCH_NOTHING,
    nothingHint: SEARCH_NOTHING_HINT,
    rows: hits.map((hit) => ({
      id: hit.id,
      kind: hit.kind,
      kindLabel: SEARCH_KIND_LABEL[hit.kind],
      title: hit.title,
      line: searchResultLine(hit),
      // The web's index points a link result at `/library#id`; the phone keeps
      // the route and drops the anchor, because a tab has no scroll position
      // to restore.
      href: hit.href.split("#")[0] ?? hit.href,
      external: /^https?:\/\//.test(hit.href),
    })),
  };
}
