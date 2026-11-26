"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SearchDoc } from "@ninetothree/content";
import {
  SEARCH_FAILED,
  SEARCH_FAILED_HINT,
  SEARCH_HEADING,
  SEARCH_INTRO,
  SEARCH_PLACEHOLDER,
  searchGuide,
} from "@ninetothree/domain";
import { AppShell } from "@/components/AppShell";
import { SearchResults } from "@/components/SearchResults";
import { loadSearchIndex } from "@/lib/search-index";

/**
 * One box over the whole guide.
 *
 * The index is fetched when the page opens rather than bundled, so a parent
 * who is not searching never downloads the corpus. Until it arrives the box
 * works; it just cannot answer yet, and says so.
 */
export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadSearchIndex(controller.signal)
      .then((loaded) => {
        setDocs(loaded);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFailed(true);
      });
    return () => {
      controller.abort();
    };
  }, []);

  const hits = useMemo(() => (docs ? searchGuide(docs, query, 20) : []), [docs, query]);

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-ink">{SEARCH_HEADING}</h1>
      <p className="mt-2 text-ink-muted">{SEARCH_INTRO}</p>

      <div className="mt-6">
        <label htmlFor="search" className="block text-sm font-medium text-ink">
          What are you looking for?
        </label>
        <input
          id="search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          placeholder={SEARCH_PLACEHOLDER}
          className="mt-2 w-full rounded-lg border border-line bg-paper-raised px-4 py-3 text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        />
      </div>

      {failed ? (
        <div className="mt-8">
          <p className="text-lg text-ink">{SEARCH_FAILED}</p>
          <p className="mt-2 text-ink-muted">{SEARCH_FAILED_HINT}</p>
          <p className="mt-4">
            <Link
              href="/library"
              className="text-clay underline decoration-1 underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              Open the library
            </Link>
          </p>
        </div>
      ) : docs === null ? (
        <p className="mt-8 text-ink-muted" role="status">
          {query.trim() === "" ? "Opening the guide…" : "One moment — still opening the guide."}
        </p>
      ) : (
        <SearchResults hits={hits} query={query} />
      )}
    </AppShell>
  );
}
