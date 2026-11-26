import { describe, expect, it } from "vitest";
import { DOMAINS, type Domain } from "@ninetothree/content";
import { LINKS } from "@ninetothree/content/link-registry";
import {
  COST_LABEL,
  LIBRARY_COUNT,
  LIBRARY_EMPTY,
  TYPE_HEADING,
  costChoices,
  domainChoices,
  filterLibrary,
  libraryGroups,
  searchResultLine,
  type LibraryFilters,
} from "./library";

const ALL: LibraryFilters = { domain: "all", cost: "any", query: "" };

/**
 * The queries below are the ten the issue asks for: the ones a parent types
 * in a shop, plus the empty string and a filter combination that returns
 * nothing. They are fixed rather than random so a failure names a sentence
 * somebody actually said.
 */
const SAVED_QUERIES = [
  "car seat",
  "sleep",
  "glucose",
  "daycare",
  "bottle",
  "monitor",
  "wic",
  "",
  "not-a-word-anyone-uses",
  "stroller",
];

describe("filterLibrary", () => {
  it("returns the catalogue unchanged when nothing is filtered", () => {
    expect(filterLibrary(LINKS, ALL)).toHaveLength(LINKS.length);
  });

  it("filters by domain and then by cost", () => {
    const free = filterLibrary(LINKS, { ...ALL, domain: "gear", cost: "free" });
    expect(free.length).toBeGreaterThan(0);
    for (const link of free) {
      expect(link.domains).toContain("gear");
      expect(link.cost).toBe("free");
    }
  });

  it("treats a blank query as no query rather than as no results", () => {
    expect(filterLibrary(LINKS, { ...ALL, query: "   " })).toHaveLength(LINKS.length);
  });

  it("intersects the query with the filters instead of replacing them", () => {
    const gear = filterLibrary(LINKS, { ...ALL, domain: "gear" });
    const matching = filterLibrary(LINKS, { ...ALL, domain: "gear", query: "car" });
    expect(matching.length).toBeLessThanOrEqual(gear.length);
    for (const link of matching) expect(link.domains).toContain("gear");
  });

  it("returns nothing for a filter combination no link carries", () => {
    const empty = filterLibrary(LINKS, {
      ...ALL,
      domain: "milestones",
      cost: "$$$",
      query: "bottle warmer",
    });
    expect(empty).toEqual([]);
    expect(LIBRARY_EMPTY).toBe("Nothing matches that yet.");
  });

  it("returns the same ids as the web page's three lines, for ten saved queries", () => {
    for (const query of SAVED_QUERIES) {
      const filters: LibraryFilters = { domain: "feeding", cost: "any", query };
      // The web page, restated exactly:
      const byDomain = LINKS.filter((link) => link.domains.includes("feeding"));
      const web =
        query.trim() === ""
          ? byDomain
          : (() => {
              const matched = new Set(
                LINKS.filter((link) =>
                  [link.title, link.publisher, link.why].some((field) =>
                    field.toLowerCase().includes(query.trim().toLowerCase()),
                  ),
                ).map((link) => link.id),
              );
              return byDomain.filter((link) => matched.has(link.id));
            })();
      expect(filterLibrary(LINKS, filters).map((link) => link.id)).toEqual(
        web.map((link) => link.id),
      );
    }
  });
});

describe("libraryGroups", () => {
  it("heads each group in the catalogue's order", () => {
    const groups = libraryGroups(LINKS);
    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(group.heading).toBe(TYPE_HEADING[group.type]);
      expect(group.links.length).toBeGreaterThan(0);
      for (const link of group.links) expect(link.type).toBe(group.type);
    }
  });

  it("has no group for a type the catalogue does not use", () => {
    const groups = libraryGroups([]);
    expect(groups).toEqual([]);
  });
});

describe("the copy", () => {
  it("pluralises a count once", () => {
    expect(LIBRARY_COUNT(0)).toBe("0 places.");
    expect(LIBRARY_COUNT(1)).toBe("1 place.");
    expect(LIBRARY_COUNT(2)).toBe("2 places.");
  });

  it("names every cost the schema allows", () => {
    expect(Object.keys(COST_LABEL).sort()).toEqual(["$", "$$", "$$$", "free", "varies"]);
  });

  it("offers every domain, with Everything first and the chosen one marked", () => {
    for (const domain of ["all", ...DOMAINS] as (Domain | "all")[]) {
      const choices = domainChoices(domain);
      expect(choices).toHaveLength(DOMAINS.length + 1);
      expect(choices[0]!.label).toBe("Everything");
      expect(choices.filter((choice) => choice.selected)).toHaveLength(1);
      expect(choices.find((choice) => choice.selected)!.value).toBe(domain);
    }
  });

  it("offers any price and the five bands", () => {
    const choices = costChoices("$$");
    expect(choices.map((choice) => choice.label)).toEqual([
      "Any price",
      "Free",
      "Cheap",
      "Moderate",
      "Expensive",
      "Cost varies",
    ]);
    expect(choices.filter((choice) => choice.selected)).toHaveLength(1);
  });

  it("writes the citation line for a step and for a library link", () => {
    expect(
      searchResultLine({
        id: "week-1",
        kind: "week",
        title: "Week 1",
        body: "",
        keywords: "",
        href: "/week/1",
        packId: "p1",
        packTitle: "Week 1",
        sourceIds: ["a"],
        score: 1,
        matched: [],
      }),
    ).toBe("Week 1 · 1 source");
    expect(
      searchResultLine({
        id: "link-1",
        kind: "link",
        title: "ACOG",
        body: "",
        keywords: "",
        href: "https://example.com",
        sourceIds: ["a", "b"],
        score: 1,
        matched: [],
      }),
    ).toBe("Checked and cited in the library");
  });
});
