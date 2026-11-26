import {
  DOMAINS,
  buildIndex,
  groupByType,
  linksForDomain,
  search,
  searchLinks,
  type Domain,
  type LinkEntry,
  type LinkType,
  type SearchDoc,
  type SearchHit,
  type SearchKind,
  type StagePack,
} from "@ninetothree/content";

/**
 * The catalogue, as data.
 *
 * The web's `/library` and `/search` pages filter and rank in the browser; the
 * phone has no browser, so the same two operations live here instead. They are
 * not reimplemented: `filterLibrary` is the web page's three lines moved out of
 * a component, and `searchGuide` is `@ninetothree/content`'s scorer called with
 * the same index the web fetches. A test asks both for the same ten queries and
 * gets the same ids back.
 *
 * The labels live here too. A parent who reads "Moderate" on a laptop must read
 * "Moderate" on a phone, and "Cost varies" must not become "Varries" in one of
 * them.
 */

export type LibraryDomain = Domain | "all";
export type LibraryCost = LinkEntry["cost"] | "any";

export interface LibraryFilters {
  domain: LibraryDomain;
  cost: LibraryCost;
  query: string;
}

export const DOMAIN_LABEL: Record<Domain, string> = {
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

export const COST_LABEL: Record<LinkEntry["cost"], string> = {
  free: "Free",
  $: "Cheap",
  $$: "Moderate",
  $$$: "Expensive",
  varies: "Cost varies",
};

export const LIBRARY_COSTS: readonly LinkEntry["cost"][] = ["free", "$", "$$", "$$$", "varies"];

export const TYPE_HEADING: Record<LinkType, string> = {
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

export const LIBRARY_HEADING = "The library";
export const LIBRARY_INTRO =
  "Every place we send you, in one list. Nothing is here because someone paid for it. Where a link earns us a commission, the card says so.";
export const LIBRARY_COUNT = (count: number): string => `${count} place${count === 1 ? "" : "s"}.`;
export const LIBRARY_EMPTY = "Nothing matches that yet.";
export const LIBRARY_EMPTY_HINT =
  "Try a broader word, or clear the filter. The catalogue is still growing.";

/** The web page's filter chain, with the order of operations kept. */
export function filterLibrary(links: readonly LinkEntry[], filters: LibraryFilters): LinkEntry[] {
  const byDomain = filters.domain === "all" ? links : linksForDomain(links, filters.domain);
  const byCost =
    filters.cost === "any" ? byDomain : byDomain.filter((link) => link.cost === filters.cost);
  if (filters.query.trim() === "") return [...byCost];
  // The search runs over the whole catalogue rather than the filtered set, so a
  // query that matches a link outside the filter still intersects correctly.
  const matched = new Set(searchLinks(links, filters.query).map((link) => link.id));
  return byCost.filter((link) => matched.has(link.id));
}

export interface LibraryGroup {
  type: LinkType;
  heading: string;
  links: LinkEntry[];
}

export function libraryGroups(links: readonly LinkEntry[]): LibraryGroup[] {
  const groups = groupByType(links);
  return [...groups.entries()].map(([type, inGroup]) => ({
    type,
    heading: TYPE_HEADING[type],
    links: inGroup,
  }));
}

/**
 * The guide, flattened the way a search box wants it, in memory.
 *
 * The web fetches `/search-index.json` so a parent who never searches never
 * pays for the corpus. A phone has already paid for it: the packs and links are
 * in the bundle, so building the index costs one pass over them at start-up and
 * saves a request that would fail in a tunnel.
 */
export function guideIndex(packs: readonly StagePack[], links: readonly LinkEntry[]): SearchDoc[] {
  return buildIndex(packs, links);
}

/** The same scorer, the same limit and the same order the web page gets. */
export function searchGuide(index: readonly SearchDoc[], query: string, limit = 20): SearchHit[] {
  return search(index, query, limit);
}

export const SEARCH_HEADING = "Search";
export const SEARCH_INTRO =
  "Every week, every step, and everything we link to. Plain words are fine.";
export const SEARCH_PLACEHOLDER = "glucose, car seat, daycare";
export const SEARCH_NOTHING = "Nothing here for that.";
export const SEARCH_NOTHING_HINT =
  "Try a shorter word, or browse the library — everything we link to is in one place.";
export const SEARCH_FAILED = "Search is not loading right now.";
export const SEARCH_FAILED_HINT =
  "Nothing is lost — everything we link to is in the library, and every step is still on your week.";

export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  step: "A step",
  week: "A week",
  link: "In the library",
};

/**
 * The line under a result: which week it belongs to, or that the library holds
 * it. A result with no citation is not shown at all, so this is never blank.
 */
export function searchResultLine(hit: SearchHit): string {
  if (!hit.packTitle) return "Checked and cited in the library";
  const count = hit.sourceIds.length;
  return `${hit.packTitle} · ${count} ${count === 1 ? "source" : "sources"}`;
}

/** The domains as filter choices, "Everything" first, in the catalogue's order. */
export interface DomainChoice {
  value: LibraryDomain;
  label: string;
  selected: boolean;
}

export function domainChoices(selected: LibraryDomain): DomainChoice[] {
  return [
    { value: "all" as LibraryDomain, label: "Everything" },
    ...DOMAINS.map((domain) => ({ value: domain as LibraryDomain, label: DOMAIN_LABEL[domain] })),
  ].map((choice) => ({ ...choice, selected: choice.value === selected }));
}

export interface CostChoice {
  value: LibraryCost;
  label: string;
  selected: boolean;
}

export function costChoices(selected: LibraryCost): CostChoice[] {
  return [
    { value: "any" as LibraryCost, label: "Any price" },
    ...LIBRARY_COSTS.map((cost) => ({ value: cost as LibraryCost, label: COST_LABEL[cost] })),
  ].map((choice) => ({ ...choice, selected: choice.value === selected }));
}
