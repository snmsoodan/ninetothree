import { describe, expect, it } from "vitest";

import type { Pin } from "@ninetothree/domain";
import { shelfView } from "./shelf";

/**
 * The shelf view, as data.
 *
 * `shelfModel` already has its own tests in `@ninetothree/domain`; what is new
 * here is the words the phone draws around it — so these tests read the view
 * the way the screen does: empty, filtered, and full.
 */

function pin(id: string, title: string, packId = "week-20", at = "2026-01-01T00:00:00.000Z"): Pin {
  return { id, title, packId, packTitle: "Week 20", at };
}

describe("shelfView", () => {
  it("opens with the copy a parent reads first, and no filter", () => {
    const view = shelfView({ pins: [pin("a", "Book the scan")], doneCount: 3 });

    expect(view.heading).toBe("Your shelf");
    expect(view.intro.length).toBeGreaterThan(0);
    expect(view.pinnedHeading.length).toBeGreaterThan(0);
    expect(view.query).toBe("");
    expect(view.rows.all).toHaveLength(1);
    expect(view.rows.filtering).toBe(false);
    expect(view.rows.noMatch).toBeNull();
    expect(view.empty).toBe(false);
  });

  it("stays in the store's order, and offers the moves it allows", () => {
    const view = shelfView({
      pins: [pin("a", "First"), pin("b", "Second"), pin("c", "Third")],
      doneCount: 0,
    });

    expect(view.rows.all.map((row) => row.id)).toEqual(["a", "b", "c"]);
    expect(view.rows.all[0]!.canMoveUp).toBe(false);
    expect(view.rows.all[0]!.canMoveDown).toBe(true);
    expect(view.rows.all[1]!.canMoveUp).toBe(true);
    expect(view.rows.all[2]!.canMoveDown).toBe(false);
  });

  it("narrows by title or week, and refuses to reorder while narrowed", () => {
    const view = shelfView({
      pins: [pin("a", "Book the scan"), pin("b", "Buy the car seat", "week-34")],
      query: "car",
      doneCount: 0,
    });

    expect(view.rows.shown.map((row) => row.id)).toEqual(["b"]);
    expect(view.rows.filtering).toBe(true);
    expect(view.rows.shown[0]!.canMoveUp).toBe(false);
    expect(view.rows.shown[0]!.canMoveDown).toBe(false);
    expect(view.rows.noMatch).toBeNull();
    // The count is the shelf's size, not the filter's: narrowing does not shrink it.
    expect(view.rows.countLine).toBe("2 pinned");
  });

  it("says so plainly when the filter matches nothing, and offers the way back", () => {
    const view = shelfView({ pins: [pin("a", "Book the scan")], query: "zzz", doneCount: 0 });

    expect(view.rows.shown).toEqual([]);
    expect(view.rows.noMatch?.line.length).toBeGreaterThan(0);
    expect(view.rows.noMatch?.clearLabel).toBeTruthy();
  });

  it("gives an empty shelf its own screen rather than an empty list", () => {
    const view = shelfView({ pins: [], doneCount: 0 });

    expect(view.empty).toBe(true);
    expect(view.emptyLine.length).toBeGreaterThan(0);
    expect(view.emptyBody.length).toBeGreaterThan(0);
    expect(view.emptyCta.length).toBeGreaterThan(0);
  });

  it("carries the finished count into the closing line", () => {
    expect(shelfView({ pins: [], doneCount: 1 }).finishedLine).toContain("1");
    expect(shelfView({ pins: [], doneCount: 4 }).finishedLine).toContain("4");
    expect(shelfView({ pins: [], doneCount: 0 }).finishedLine).not.toContain("0");
  });
});
