"use client";

import { useMemo, useState } from "react";
import {
  DOMAINS,
  LINKS,
  groupByType,
  linksForDomain,
  searchLinks,
  type Domain,
  type LinkEntry,
  type LinkType,
} from "@ninetothree/content";
import { AppShell } from "@/components/AppShell";
import { LinkCard } from "@/components/LinkCard";

const DOMAIN_LABEL: Record<Domain, string> = {
  "health-parent": "Your health",
  "health-baby": "Baby's health",
  feeding: "Feeding",
  sleep: "Sleep",
  nutrition: "Food",
  play: "Play",
  safety: "Safety",
  gear: "Gear",
  money: "Money and leave",
  mind: "How you feel",
  childcare: "Childcare",
  home: "Home",
  milestones: "Milestones",
};

const COST_LABEL: Record<LinkEntry["cost"], string> = {
  free: "Free",
  $: "Cheap",
  $$: "Moderate",
  $$$: "Expensive",
  varies: "Cost varies",
};

const COSTS = ["free", "$", "$$", "$$$", "varies"] as const;

const TYPE_HEADING: Record<LinkType, string> = {
  authoritative: "Official guidance",
  charity: "Charities and support",
  "local-service": "Help near you",
  community: "Other parents",
  editorial: "Independent reviews",
  app: "Apps",
  course: "Classes",
  book: "Books",
  commercial: "Where to buy",
};

/**
 * The whole catalogue, browsable. This is the "I just want to look at
 * everything" surface — the guided version lives inside each week.
 */
export default function LibraryPage() {
  const [domain, setDomain] = useState<Domain | "all">("all");
  const [cost, setCost] = useState<LinkEntry["cost"] | "any">("any");
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const byDomain = domain === "all" ? LINKS : linksForDomain(LINKS, domain);
    const byCost = cost === "any" ? byDomain : byDomain.filter((link) => link.cost === cost);
    if (query.trim() === "") return byCost;
    const matched = new Set(searchLinks(LINKS, query).map((link) => link.id));
    return byCost.filter((link) => matched.has(link.id));
  }, [domain, cost, query]);

  const groups = useMemo(() => groupByType(results), [results]);

  return (
    <AppShell stage="Library">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">The library</h1>
        <p className="mt-2 text-base text-ink-muted">
          Every place we send you, in one list. Nothing is here because someone paid for it. Where a
          link earns us a commission, the card says so.
        </p>

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
              onChange={(event) => setDomain(event.target.value as Domain | "all")}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              <option value="all">Everything</option>
              {DOMAINS.map((value) => (
                <option key={value} value={value}>
                  {DOMAIN_LABEL[value]}
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
              onChange={(event) => setCost(event.target.value as LinkEntry["cost"] | "any")}
              className="mt-1 w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              <option value="any">Any price</option>
              {COSTS.map((value) => (
                <option key={value} value={value}>
                  {COST_LABEL[value]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p aria-live="polite" className="mt-5 text-sm text-ink-muted tabular">
          {results.length === 0
            ? "Nothing matches that yet."
            : `${results.length} place${results.length === 1 ? "" : "s"}.`}
        </p>

        {results.length === 0 ? (
          <p className="mt-3 text-base text-ink-muted">
            Try a broader word, or clear the filter. The catalogue is still growing.
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            {[...groups.entries()].map(([type, links]) => (
              <section key={type} aria-labelledby={`type-${type}`}>
                <h2 id={`type-${type}`} className="font-display text-2xl text-ink">
                  {TYPE_HEADING[type]}
                </h2>
                <ul className="mt-3 space-y-3">
                  {links.map((link) => (
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
