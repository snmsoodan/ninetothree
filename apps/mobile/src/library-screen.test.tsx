import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LINKS } from "@ninetothree/content/link-registry";
import { ThemeProvider, type describeLayout } from "@ninetothree/ui-native";
import type { LibraryFilters } from "@ninetothree/domain";
import { Library, libraryColumns, type LibraryHandlers } from "./library-screen";
import { EMPTY_FILTERS, libraryModel, type LibraryModel } from "./library";

/**
 * The library tab, drawn.
 *
 * The model tests prove what the catalogue says. This file proves that each of
 * those lines reaches a card, that the cards group and widen the way the
 * window does, and that a press on a filter or a title reaches the container
 * carrying the value a parent chose.
 */
type Layout = ReturnType<typeof describeLayout>;

function windowFor(mode: Layout["mode"]): Layout {
  const width = { compact: 360, regular: 480, medium: 700, expanded: 1024 }[mode];
  const half = Math.round(width / 2);
  return {
    width,
    mode,
    columns: mode === "medium" || mode === "expanded" ? 2 : 1,
    panes:
      mode === "expanded"
        ? [
            { x: 0, width: half },
            { x: half, width: width - half },
          ]
        : [{ x: 0, width }],
    panesAcross: mode === "expanded" ? 2 : 1,
    posture: null,
    hinge: null,
  };
}

function build(overrides: Partial<LibraryFilters> = {}): LibraryModel {
  return libraryModel({ links: LINKS, filters: { ...EMPTY_FILTERS, ...overrides } });
}

function handlers(): LibraryHandlers {
  return {
    onQueryChange: vi.fn(),
    onDomainChange: vi.fn(),
    onCostChange: vi.fn(),
    onOpenLink: vi.fn(),
    onOpenSearch: vi.fn(),
  };
}

function draw(value: LibraryModel, extra?: Partial<LibraryHandlers>, layout?: Layout) {
  const spies = { ...handlers(), ...extra };
  const view = render(
    <ThemeProvider>
      <Library model={value} handlers={spies} layout={layout} />
    </ThemeProvider>,
  );
  return { ...view, spies };
}

/** One card, picked by the catalogue id it is drawn from. */
function card(id: string) {
  return screen.getByTestId(`library-${id}`);
}

describe("Library", () => {
  it("draws the page's own heading and intro", () => {
    const value = build();
    draw(value);
    expect(screen.getByText(value.heading)).toBeTruthy();
    expect(screen.getByText(value.intro)).toBeTruthy();
  });

  it("offers the whole-guide search, which the tab's own box cannot do", () => {
    const { spies } = draw(build());
    fireEvent.click(screen.getByTestId("library-open-search"));
    expect(spies.onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it("types into the search box and hands the text up", () => {
    const { spies } = draw(build());
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "car seat" } });
    expect(spies.onQueryChange).toHaveBeenCalledWith("car seat");
  });

  it("names a domain chip the way the catalogue does and sends its value", () => {
    const value = build();
    const { spies } = draw(value);
    const sleep = value.domains.find((choice) => choice.value === "sleep");
    if (!sleep) throw new Error("no sleep domain");
    fireEvent.click(screen.getByTestId("library-domain-sleep"));
    expect(spies.onDomainChange).toHaveBeenCalledWith("sleep");
  });

  it("marks the chosen domain and price, and only those", () => {
    const value = build({ domain: "feeding", cost: "free" });
    draw(value);
    const chosenDomains = value.domains.filter((choice) => choice.selected);
    expect(chosenDomains).toHaveLength(1);
    expect(
      screen.getByTestId(`library-domain-${chosenDomains[0]?.value}`).getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByTestId("library-cost-free").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByTestId("library-cost-any").getAttribute("aria-checked")).toBe("false");
  });

  it("says how many there are, in a live region so TalkBack hears a filter", () => {
    const value = build();
    draw(value);
    const count = screen.getByTestId("library-count");
    expect(count.getAttribute("aria-live")).toBe("polite");
    expect(within(count).getByText(value.count)).toBeTruthy();
  });

  it("draws every card the model holds, under its type heading", () => {
    const value = build();
    draw(value);
    for (const section of value.sections) {
      expect(screen.getAllByText(section.heading).length).toBeGreaterThan(0);
      for (const link of section.links) {
        const drawn = card(link.id);
        expect(within(drawn).getAllByText(link.title).length).toBeGreaterThan(0);
        expect(within(drawn).getAllByText(link.publisher).length).toBeGreaterThan(0);
        expect(within(drawn).getAllByText(link.why).length).toBeGreaterThan(0);
        expect(within(drawn).getAllByText(link.typeLabel).length).toBeGreaterThan(0);
        expect(within(drawn).getAllByText(link.costLabel).length).toBeGreaterThan(0);
      }
    }
  });

  it("opens the title's link through the container", () => {
    const value = build();
    const { spies } = draw(value);
    const link = value.sections[0]?.links[0];
    if (!link) throw new Error("no card");
    fireEvent.click(within(card(link.id)).getByRole("link"));
    expect(spies.onOpenLink).toHaveBeenCalledWith(link.url);
  });

  it("says nothing matches instead of drawing an empty list", () => {
    const value = build({ query: "qzxqzxqzx" });
    draw(value);
    expect(value.empty).toBe(true);
    expect(screen.getByText(value.emptyHint)).toBeTruthy();
    expect(screen.queryByTestId("library-links-authoritative")).toBeNull();
  });

  it("draws one column on a phone and three on a tabletop", () => {
    expect(libraryColumns("compact")).toBe(1);
    expect(libraryColumns("regular")).toBe(1);
    expect(libraryColumns("medium")).toBe(2);
    expect(libraryColumns("expanded")).toBe(3);
  });

  it("says where an app runs, and admits a commission where there is one", () => {
    const value = build();
    const cards = value.sections.flatMap((section) => section.links);
    const app = cards.find((link) => link.platforms !== null);
    if (!app) throw new Error("no app in the catalogue");
    draw(value);
    expect(within(card(app.id)).getAllByText(app.platforms as string).length).toBeGreaterThan(0);

    const paid = cards.find((link) => link.affiliate);
    if (paid) {
      draw(build());
      expect(within(card(paid.id)).getAllByText(/We earn a commission/).length).toBeGreaterThan(0);
    }
  });

  it("keeps every card in one column on a phone", () => {
    const value = build();
    draw(value, undefined, windowFor("compact"));
    const link = value.sections[0]?.links[0];
    if (!link) throw new Error("no card");
    const shell = card(link.id).parentElement;
    expect(shell?.style.flexBasis).toBe("100%");
  });
});
