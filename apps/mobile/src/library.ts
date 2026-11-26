import type { LinkEntry } from "@ninetothree/content";
import {
  COST_LABEL,
  LIBRARY_COUNT,
  LIBRARY_EMPTY,
  LIBRARY_EMPTY_HINT,
  LIBRARY_HEADING,
  LIBRARY_INTRO,
  TYPE_HEADING,
  costChoices,
  domainChoices,
  filterLibrary,
  libraryGroups,
  type CostChoice,
  type DomainChoice,
  type LibraryFilters,
} from "@ninetothree/domain";

/**
 * The library, as data.
 *
 * The web page and the phone tab are two drawings of one catalogue, so the
 * filtering, the labels and the sentences come from `@ninetothree/domain` and
 * this file only decides what the phone needs in hand: whether a card is free,
 * which platforms it runs on, and whether the commission line is shown.
 */

export interface LibraryLink {
  id: string;
  title: string;
  publisher: string;
  why: string;
  typeLabel: string;
  costLabel: string;
  free: boolean;
  /** "On iPhone and Android", or null when it is not an app. */
  platforms: string | null;
  note: string | null;
  affiliate: boolean;
  /** "9 March 2026". */
  checked: string;
  url: string;
}

export interface LibrarySection {
  /** The link type, used as a key rather than read out. */
  type: string;
  heading: string;
  links: LibraryLink[];
}

export interface LibraryModel {
  heading: string;
  intro: string;
  query: string;
  queryLabel: string;
  queryPlaceholder: string;
  domainLabel: string;
  costLabel: string;
  domains: DomainChoice[];
  costs: CostChoice[];
  count: string;
  empty: boolean;
  emptyLine: string;
  emptyHint: string;
  sections: LibrarySection[];
}

export interface LibraryInput {
  links: readonly LinkEntry[];
  filters: LibraryFilters;
}

export const EMPTY_FILTERS: LibraryFilters = { domain: "all", cost: "any", query: "" };

const PLATFORM_LABEL = {
  ios: "iPhone",
  android: "Android",
  web: "Web",
} as const;

const CHECKED: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

/** Noon, so a timezone west of UTC cannot show yesterday's date. */
export function checkedLabel(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-US", CHECKED).format(new Date(year, month - 1, day, 12));
}

function toLink(link: LinkEntry): LibraryLink {
  return {
    id: link.id,
    title: link.title,
    publisher: link.publisher,
    why: link.why,
    typeLabel: TYPE_HEADING[link.type],
    costLabel: COST_LABEL[link.cost],
    free: link.cost === "free",
    platforms: link.platforms
      ? `On ${link.platforms.map((platform) => PLATFORM_LABEL[platform]).join(" and ")}`
      : null,
    note: link.note ?? null,
    affiliate: link.affiliate === true,
    checked: checkedLabel(link.lastChecked),
    url: link.url,
  };
}

export function libraryModel({ links, filters }: LibraryInput): LibraryModel {
  const results = filterLibrary(links, filters);
  const sections = libraryGroups(results).map((group) => ({
    type: group.type as string,
    heading: group.heading,
    links: group.links.map(toLink),
  }));

  return {
    heading: LIBRARY_HEADING,
    intro: LIBRARY_INTRO,
    query: filters.query,
    queryLabel: "Search",
    queryPlaceholder: "Sleep, car seat, WIC…",
    domainLabel: "What do you need?",
    costLabel: "What can you spend?",
    domains: domainChoices(filters.domain),
    costs: costChoices(filters.cost),
    count: results.length === 0 ? LIBRARY_EMPTY : LIBRARY_COUNT(results.length),
    empty: results.length === 0,
    emptyLine: LIBRARY_EMPTY,
    emptyHint: LIBRARY_EMPTY_HINT,
    sections,
  };
}
