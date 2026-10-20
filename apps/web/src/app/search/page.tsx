"use client";

import { useMemo, useState } from "react";
import { LINKS, PACKS, buildIndex, search } from "@ninetothree/content";
import { AppShell } from "@/components/AppShell";
import { SearchResults } from "@/components/SearchResults";

/**
 * One box over the whole guide. The index is built once at module load, so
 * typing does not wait for anything.
 */
const INDEX = buildIndex(PACKS, LINKS);

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const hits = useMemo(() => search(INDEX, query, 20), [query]);

  return (
    <AppShell>
      <h1 className="font-display text-3xl text-ink">Search</h1>
      <p className="mt-2 text-ink-muted">
        Every week, every step, and everything we link to. Plain words are fine.
      </p>

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
          placeholder="glucose, car seat, daycare"
          className="mt-2 w-full rounded-lg border border-line bg-paper-raised px-4 py-3 text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        />
      </div>

      <SearchResults hits={hits} query={query} />
    </AppShell>
  );
}
