import { describe, expect, it } from "vitest";
import { LINKS } from "@ninetothree/content/link-registry";
import {
  COST_LABEL,
  DOMAIN_LABEL,
  LIBRARY_COUNT,
  LIBRARY_EMPTY,
  TYPE_HEADING,
  filterLibrary,
} from "@ninetothree/domain";
import { EMPTY_FILTERS, checkedLabel, libraryModel } from "./library";

/**
 * The library tab, as data.
 *
 * The filtering is already proven in `@ninetothree/domain`; what is left is the
 * part only the phone decides — which words a card shows, and whether it says
 * it is free.
 */

function model(overrides: Partial<typeof EMPTY_FILTERS> = {}) {
  return libraryModel({ links: LINKS, filters: { ...EMPTY_FILTERS, ...overrides } });
}

describe("libraryModel", () => {
  it("opens on the whole catalogue, counted", () => {
    const value = model();
    expect(value.count).toBe(LIBRARY_COUNT(LINKS.length));
    expect(value.empty).toBe(false);
    expect(value.sections.flatMap((section) => section.links)).toHaveLength(LINKS.length);
  });

  it("keeps every card's words the catalogue's words", () => {
    const source = LINKS[0];
    const card = model()
      .sections.flatMap((section) => section.links)
      .find((link) => link.id === source.id);
    expect(card?.title).toBe(source.title);
    expect(card?.publisher).toBe(source.publisher);
    expect(card?.why).toBe(source.why);
    expect(card?.url).toBe(source.url);
    expect(card?.typeLabel).toBe(TYPE_HEADING[source.type]);
    expect(card?.costLabel).toBe(COST_LABEL[source.cost]);
  });

  it("says a free thing is free, and a paid thing is not", () => {
    const cards = model().sections.flatMap((section) => section.links);
    for (const card of cards) {
      expect(card.free).toBe(card.costLabel === COST_LABEL.free);
    }
  });

  it("names the platforms it runs on, or says nothing when it is not an app", () => {
    const cards = model().sections.flatMap((section) => section.links);
    const app = cards.find((card) => card.platforms !== null);
    expect(app?.platforms).toMatch(/^On (iPhone|Android|Web)(( and |, )(iPhone|Android|Web))*$/);
    const site = LINKS.find((link) => !link.platforms);
    if (site) {
      const card = cards.find((candidate) => candidate.id === site.id);
      expect(card?.platforms).toBeNull();
    }
  });

  it("carries the affiliate line only where there is a commission", () => {
    const cards = model().sections.flatMap((section) => section.links);
    for (const card of cards) {
      const source = LINKS.find((link) => link.id === card.id);
      expect(card.affiliate).toBe(source?.affiliate === true);
    }
  });

  it("narrows to a domain and a price together, as the web page does", () => {
    const filters = { ...EMPTY_FILTERS, domain: "feeding" as const, cost: "free" as const };
    const value = libraryModel({ links: LINKS, filters });
    const expected = filterLibrary(LINKS, filters);
    const drawn = value.sections.flatMap((section) => section.links);
    expect(drawn.map((link) => link.id).sort()).toEqual(expected.map((link) => link.id).sort());
    expect(drawn.length).toBeGreaterThan(0);
    for (const link of drawn) expect(link.free).toBe(true);
  });

  it("says nothing is here, rather than an empty page, when nothing matches", () => {
    const value = model({ query: "zzzzzzzz" });
    expect(value.empty).toBe(true);
    expect(value.sections).toEqual([]);
    expect(value.count).toBe(LIBRARY_EMPTY);
  });

  it("offers the cost answers and marks the chosen one", () => {
    const value = model({ cost: "$$" });
    const chosen = value.costs.filter((choice) => choice.selected);
    expect(chosen).toHaveLength(1);
    expect(chosen[0]?.value).toBe("$$");
    expect(chosen[0]?.label).toBe(COST_LABEL["$$"]);
  });

  it("offers every domain and marks the chosen one", () => {
    const value = model({ domain: "sleep" });
    const chosen = value.domains.filter((choice) => choice.selected);
    expect(chosen).toHaveLength(1);
    expect(chosen[0]?.label).toBe(DOMAIN_LABEL.sleep);
  });
});

describe("checkedLabel", () => {
  it("writes a date the way a parent reads one", () => {
    expect(checkedLabel("2026-03-09")).toBe("March 9, 2026");
  });

  it("does not slip a day west of UTC", () => {
    expect(checkedLabel("2026-01-01")).toBe("January 1, 2026");
  });

  it("leaves something it cannot parse alone", () => {
    expect(checkedLabel("soon")).toBe("soon");
  });
});
