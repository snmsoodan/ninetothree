import { describe, expect, it } from "vitest";
import { ACTION_INDEX, findIndexedAction } from "@ninetothree/content/action-index";

import { finishedLine, moveLabel, shelfModel, unpinLabel } from "./shelf";
import type { Pin } from "./model";

const first = Object.keys(ACTION_INDEX)[0]!;
const second = Object.keys(ACTION_INDEX)[1]!;
const a = findIndexedAction(first, ACTION_INDEX)!;
const b = findIndexedAction(second, ACTION_INDEX)!;

function pin(id: string, title: string, packTitle: string): Pin {
  return { id, title, packId: "week-20", packTitle, at: "2026-01-01T00:00:00.000Z" };
}

const pins = [pin(a.id, a.title, a.packTitle), pin(b.id, b.title, b.packTitle)];

describe("shelfModel", () => {
  it("keeps the order the parent chose", () => {
    const model = shelfModel({ pins, index: ACTION_INDEX });
    expect(model.shown.map((p) => p.id)).toEqual([a.id, b.id]);
  });

  it("cannot move the first pin up or the last pin down", () => {
    const [head, tail] = shelfModel({ pins, index: ACTION_INDEX }).shown;
    expect(head!.canMoveUp).toBe(false);
    expect(head!.canMoveDown).toBe(true);
    expect(tail!.canMoveUp).toBe(true);
    expect(tail!.canMoveDown).toBe(false);
  });

  it("refuses reordering inside a filter, where a move would be a lie", () => {
    const model = shelfModel({ pins, index: ACTION_INDEX, query: b.title.slice(0, 4) });
    expect(model.filtering).toBe(true);
    for (const shown of model.shown) {
      expect(shown.canMoveUp).toBe(false);
      expect(shown.canMoveDown).toBe(false);
    }
  });

  it("matches on the week as well as the title", () => {
    const model = shelfModel({ pins, index: ACTION_INDEX, query: a.packTitle });
    expect(model.shown.map((p) => p.id)).toContain(a.id);
  });

  it("says what matched nothing, and offers every pin back", () => {
    const model = shelfModel({ pins, index: ACTION_INDEX, query: "zzz" });
    expect(model.shown).toEqual([]);
    expect(model.noMatch).toEqual({
      line: "Nothing matches “zzz”.",
      clearLabel: "Show all 2",
    });
  });

  it("says nothing about a match when no filter is on", () => {
    expect(shelfModel({ pins, index: ACTION_INDEX }).noMatch).toBeNull();
  });

  it("counts the pins, and says nothing when there are none", () => {
    expect(shelfModel({ pins, index: ACTION_INDEX }).countLine).toBe("2 pinned");
    expect(shelfModel({ pins: [], index: ACTION_INDEX }).countLine).toBeNull();
  });

  it("carries the why and the options of a live step", () => {
    const [head] = shelfModel({ pins, index: ACTION_INDEX }).shown;
    expect(head!.why).toBe(a.why);
    expect(head!.options).toEqual(
      a.options.map((option) => ({ id: option.id, label: option.label, url: option.url ?? null })),
    );
  });

  it("drops the why, the options and the week link when the step is gone", () => {
    const [stale] = shelfModel({
      pins: [{ ...pin("gone", "Something retired", "Week 12") }],
      index: ACTION_INDEX,
    }).shown;
    expect(stale!.stale).toBe(true);
    expect(stale!.why).toBeNull();
    expect(stale!.options).toEqual([]);
    expect(stale!.weekHref).toBeNull();
  });

  it("links the week of a pin that still exists", () => {
    const [head] = shelfModel({ pins, index: ACTION_INDEX }).shown;
    expect(head!.weekHref).toBe(`/week/${a.packId}`);
  });

  it("carries a reminder through untouched", () => {
    const [head] = shelfModel({
      pins: [{ ...pin(a.id, a.title, a.packTitle), remindOn: "2026-05-01" }],
      index: ACTION_INDEX,
    }).shown;
    expect(head!.remindOn).toBe("2026-05-01");
  });
});

describe("the copy", () => {
  it("counts finished steps, and is kind at zero", () => {
    expect(finishedLine(0)).toBe("Nothing yet. That is fine.");
    expect(finishedLine(1)).toBe("1 step done.");
    expect(finishedLine(4)).toBe("4 steps done.");
  });

  it("names the pin in the move and unpin labels, so a screen reader has a target", () => {
    expect(moveLabel("Car seat", "up")).toBe("Move Car seat up");
    expect(unpinLabel("Car seat")).toBe("Unpin Car seat");
  });
});
