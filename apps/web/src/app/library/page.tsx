"use client";

import { useMemo, useState } from "react";
import { LINKS } from "@ninetothree/content/link-registry";
import {
  LIBRARY_COUNT,
  LIBRARY_EMPTY,
  LIBRARY_EMPTY_HINT,
  LIBRARY_HEADING,
  LIBRARY_INTRO,
  costChoices,
  domainChoices,
  filterLibrary,
  libraryGroups,
  type LibraryCost,
  type LibraryDomain,
} from "@ninetothree/domain";
import { AppShell } from "@/components/AppShell";
import { LinkCard } from "@/components/LinkCard";

/**
 * The whole catalogue, browsable. This is the "I just want to look at
 * everything" surface — the guided version lives inside each week.
 */
export default function LibraryPage() {
  const [domain, setDomain] = useState<LibraryDomain>("all");
  const [cost, setCost] = useState<LibraryCost>("any");
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => filterLibrary(LINKS, { domain, cost, query }),
    [domain, cost, query],
  );

  const groups = useMemo(() => libraryGroups(results), [results]);

  return (
    <AppShell stage="Library">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">{LIBRARY_HEADING}</h1>
        <p className="mt-2 text-base text-ink-muted">{LIBRARY_INTRO}</p>

        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="library-search" className="block text-sm font-medium text-ink">
              Search
            </label>
            <input
              id="library-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Sleep, car seat, WIC…"
              className="mt-1 w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-base text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            />
          </div>

          <div>
            <label htmlFor="library-domain" className="block text-sm font-medium text-ink">
              What do you need?
            </label>
            <select
              id="library-domain"
              value={domain}
              onChange={(event) => setDomain(event.target.value as LibraryDomain)}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              {domainChoices(domain).map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="library-cost" className="block text-sm font-medium text-ink">
              What can you spend?
            </label>
            <select
              id="library-cost"
              value={cost}
              onChange={(event) => setCost(event.target.value as LibraryCost)}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              {costChoices(cost).map((choice) => (
                <option key={choice.value} value={choice.value}>
                  {choice.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p aria-live="polite" className="mt-5 text-sm text-ink-muted tabular">
          {results.length === 0 ? LIBRARY_EMPTY : LIBRARY_COUNT(results.length)}
        </p>

        {results.length === 0 ? (
          <p className="mt-3 text-base text-ink-muted">{LIBRARY_EMPTY_HINT}</p>
        ) : (
          <div className="mt-6 space-y-8">
            {groups.map((group) => (
              <section key={group.type} aria-labelledby={`type-${group.type}`}>
                <h2 id={`type-${group.type}`} className="font-display text-2xl text-ink">
                  {group.heading}
                </h2>
                <ul className="mt-3 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.id}>
                      <LinkCard link={link} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
