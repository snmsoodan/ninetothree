import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@ninetothree/ui-native";
import { ACTION_INDEX, findIndexedAction } from "@ninetothree/content/action-index";
import type { Pin } from "@ninetothree/domain";
import { shelfView } from "./shelf";
import { Shelf, type ShelfHandlers } from "./shelf-screen";

/**
 * The shelf, through react-native-web.
 *
 * The model tests prove what the list says; this proves the buttons reach it —
 * that the arrows exist only where a move is allowed, that unpinning names the
 * pin it removes, and that "open the week" is there for a live pin. There is no
 * simulator on this machine, so pixels are not covered — see EVIDENCE §81.
 */

const [firstId, secondId] = Object.keys(ACTION_INDEX);
const first = findIndexedAction(firstId!, ACTION_INDEX)!;
const second = findIndexedAction(secondId!, ACTION_INDEX)!;

function pin(id: string, title: string, packId = "week-20"): Pin {
  return { id, title, packId, packTitle: "Week 20", at: "2026-01-01T00:00:00.000Z" };
}

const PINS = [pin(first.id, first.title), pin(second.id, second.title)];

function handlers(): ShelfHandlers {
  return {
    onQueryChange: vi.fn(),
    onMove: vi.fn(),
    onUnpin: vi.fn(),
    onOpenWeek: vi.fn(),
    onOpenOption: vi.fn(),
    onFindSomethingToPin: vi.fn(),
  };
}

function draw(pins: Pin[], query = "", extra?: Partial<ShelfHandlers>) {
  const spies = { ...handlers(), ...extra };
  const view = render(
    <ThemeProvider>
      <Shelf model={shelfView({ pins, query, doneCount: 2 })} handlers={spies} />
    </ThemeProvider>,
  );
  return { ...view, spies };
}

describe("Shelf", () => {
  it("draws every pin in the order it is kept, with the week it came from", () => {
    draw(PINS);

    expect(screen.getByText(first.title)).toBeTruthy();
    expect(screen.getByText(second.title)).toBeTruthy();
    // The week comes from the action index, not from the pin: a pin is a
    // bookmark, and the title on it is whatever the guide says today.
    expect(screen.getAllByText(first.packTitle)).toHaveLength(2);
  });

  it("keeps both arrows on every pin and disables the ends, as the shelf page does", () => {
    draw(PINS);

    expect((screen.getByTestId(`shelf-up-${first.id}`) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId(`shelf-down-${first.id}`) as HTMLButtonElement).disabled).toBe(
      false,
    );
    expect((screen.getByTestId(`shelf-up-${second.id}`) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByTestId(`shelf-down-${second.id}`) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("takes both arrows away under a filter, because a move there would lie", () => {
    draw(PINS, first.packTitle);

    expect(screen.queryByTestId(`shelf-up-${first.id}`)).toBeNull();
    expect(screen.queryByTestId(`shelf-down-${first.id}`)).toBeNull();
  });

  it("moves and unpins by id, with the pin named for a screen reader", () => {
    const { spies } = draw(PINS);

    fireEvent.click(screen.getByTestId(`shelf-down-${first.id}`));
    expect(spies.onMove).toHaveBeenCalledWith(first.id, "down");

    const unpin = screen.getByTestId(`shelf-unpin-${first.id}`);
    fireEvent.click(unpin);
    expect(spies.onUnpin).toHaveBeenCalledWith(first.id);
    expect(unpin.getAttribute("aria-label")).toContain(first.title);
  });

  it("opens the week a live pin came from, and does not for a stale one", () => {
    const stale: Pin = { ...pin("gone", "An action we retired"), packId: "week-20" };
    const { spies } = draw([pin(first.id, first.title), stale]);

    fireEvent.click(screen.getByTestId(`shelf-week-${first.id}`));
    expect(spies.onOpenWeek).toHaveBeenCalledWith(first.packId);

    // A pin whose action no longer exists has nowhere to go.
    expect(screen.queryByTestId("shelf-week-gone")).toBeNull();
    expect(screen.getByText("An action we retired")).toBeTruthy();
  });

  it("opens an option that has a link", () => {
    const entry = Object.keys(ACTION_INDEX)
      .map((id) => findIndexedAction(id, ACTION_INDEX)!)
      .find((item) => item.options.some((option) => option.url));
    const option = entry!.options.find((item) => item.url)!;
    const { spies } = draw([pin(entry!.id, entry!.title)]);
    fireEvent.click(screen.getByTestId(`shelf-option-${option.id}`));
    expect(spies.onOpenOption).toHaveBeenCalledWith(option.url);
  });

  it("passes what the filter box is given", () => {
    const { spies } = draw(PINS);

    fireEvent.change(screen.getByTestId("shelf-filter"), { target: { value: "scan" } });
    expect(spies.onQueryChange).toHaveBeenCalledWith("scan");
  });

  it("replaces the list with a way back when the filter matches nothing", () => {
    const { spies } = draw(PINS, "zzzz");

    expect(screen.getByTestId("shelf-no-match")).toBeTruthy();
    expect(screen.queryByTestId("shelf-pins")).toBeNull();

    fireEvent.click(screen.getByTestId("shelf-clear"));
    expect(spies.onQueryChange).toHaveBeenCalledWith("");
  });

  it("gives an empty shelf an invitation instead of a blank page", () => {
    const { spies } = draw([]);

    expect(screen.queryByTestId("shelf-filter")).toBeNull();
    fireEvent.click(screen.getByTestId("shelf-empty-cta"));
    expect(spies.onFindSomethingToPin).toHaveBeenCalled();
  });

  it("closes with how much has been finished", () => {
    draw(PINS);
    expect(screen.getByTestId("shelf-finished").textContent).toContain("2");
  });
});
