import type { SearchDoc } from "@ninetothree/content";

/**
 * The guide, flattened for the search box.
 *
 * `scripts/gen-indexes.mjs` writes this file at build time. It is fetched
 * rather than imported so the corpus stays off every other route: 400 kB of
 * text is the right price for search and the wrong one for the dashboard.
 */
export const SEARCH_INDEX_URL = "/search-index.json";

/** Fetches the index. Throws when it is not there, so the page can say so. */
export async function loadSearchIndex(signal?: AbortSignal): Promise<SearchDoc[]> {
  const response = await fetch(SEARCH_INDEX_URL, { signal });
  if (!response.ok) {
    throw new Error(`Search index unavailable (${response.status})`);
  }
  return (await response.json()) as SearchDoc[];
}
