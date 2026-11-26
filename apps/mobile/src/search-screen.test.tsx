import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { LINKS } from "@ninetothree/content/link-registry";
import { PACKS } from "@ninetothree/content/registry";
import { guideIndex } from "@ninetothree/domain";
import { ThemeProvider } from "@ninetothree/ui-native";
import { Search, type SearchHandlers } from "./search-screen";
import { searchModel, type SearchModel } from "./search";

/**
 * Search, drawn.
 *
 * The model tests prove that the scoring is the web's. This file proves the
 * page exists: that the box is focused on arrival, that a blank box explains
 * itself instead of apologising, and that each hit is a link a parent can press.
 */

const INDEX = guideIndex(PACKS, LINKS);

function build(query: string): SearchModel {
  return searchModel({ docs: INDEX, query });
}

function handlers(): SearchHandlers {
  return { onQueryChange: vi.fn(), onOpen: vi.fn() };
}

function draw(value: SearchModel, extra?: Partial<SearchHandlers>) {
  const spies = { ...handlers(), ...extra };
  render(
    <ThemeProvider>
      <Search model={value} handlers={spies} />
    </ThemeProvider>,
  );
  return spies;
}

describe("Search", () => {
  it("opens with the box focused, so arriving is already typing", () => {
    draw(build(""));
    expect(screen.getByLabelText("What are you looking for?")).toBe(document.activeElement);
  });

  it("says what it is for when nothing is typed, rather than nothing found", () => {
    const value = build("");
    draw(value);
    expect(screen.getByText(value.heading)).toBeTruthy();
    expect(screen.getByText(value.intro)).toBeTruthy();
    expect(screen.queryByText(value.nothingLine)).toBeNull();
    expect(screen.queryByTestId("search-results")).toBeNull();
  });

  it("hands each keystroke up", () => {
    const spies = draw(build(""));
    fireEvent.change(screen.getByLabelText("What are you looking for?"), {
      target: { value: "glucose" },
    });
    expect(spies.onQueryChange).toHaveBeenCalledWith("glucose");
  });

  it("draws a hit's kind, title and citation line", () => {
    const value = build("car seat");
    draw(value);
    const results = screen.getByTestId("search-results");
    for (const row of value.rows) {
      const drawn = within(results).getAllByTestId(`search-hit-${row.id}`).at(0);
      expect(drawn).toBeTruthy();
      expect(within(drawn as HTMLElement).getAllByText(row.title).length).toBeGreaterThan(0);
      expect(screen.getAllByText(row.line).length).toBeGreaterThan(0);
      expect(screen.getAllByText(row.kindLabel).length).toBeGreaterThan(0);
    }
  });

  it("opens a result through the container, carrying its route", () => {
    const value = build("car seat");
    const spies = draw(value);
    const row = value.rows[0];
    if (!row) throw new Error("no results");
    fireEvent.click(screen.getByTestId(`search-hit-${row.id}`));
    expect(spies.onOpen).toHaveBeenCalledWith(row);
  });

  it("says nothing here, and offers the way out, when a word finds nothing", () => {
    const value = build("qzxqzxqzx");
    draw(value);
    expect(screen.getByText(value.nothingLine)).toBeTruthy();
    expect(screen.getByText(value.nothingHint)).toBeTruthy();
    expect(screen.queryByTestId("search-results")).toBeNull();
  });
});
