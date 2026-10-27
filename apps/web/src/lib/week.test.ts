import { describe, expect, it } from "vitest";
import { TEST_PACK } from "@/test-fixtures";
import { EMPTY_STATE, type AppState } from "./store";
import { settledIds, weekProgress, type WeekRef } from "./week";

const [first, second, third] = TEST_PACK.coreActions;

/** The week as the dashboard knows it: an id and its step ids, nothing else. */
const REF: WeekRef = { id: TEST_PACK.id, coreActionIds: TEST_PACK.coreActions.map((a) => a.id) };

function withProgress(entries: AppState["progress"]): AppState {
  return { ...EMPTY_STATE, progress: entries };
}

function done(id: string) {
  return { status: "done" as const, at: "2026-06-15T10:00:00.000Z", id };
}

function skipped(id: string) {
  return { status: "skipped" as const, at: "2026-06-15T10:00:00.000Z", id };
}

describe("settledIds", () => {
  it("counts a skipped step as settled", () => {
    const state = withProgress({ [first!.id]: skipped(first!.id) });
    expect(settledIds(REF, state)).toEqual([first!.id]);
  });

  it("counts a done step as settled", () => {
    const state = withProgress({ [first!.id]: done(first!.id) });
    expect(settledIds(REF, state)).toEqual([first!.id]);
  });

  it("ignores a step with no entry", () => {
    expect(settledIds(REF, EMPTY_STATE)).toEqual([]);
  });

  it("keeps the pack's order, not the order they were settled in", () => {
    const state = withProgress({
      [third!.id]: done(third!.id),
      [first!.id]: done(first!.id),
    });
    expect(settledIds(REF, state)).toEqual([first!.id, third!.id]);
  });
});

describe("weekProgress", () => {
  it("is open with nothing settled", () => {
    expect(weekProgress(REF, EMPTY_STATE)).toEqual({
      settled: 0,
      total: 3,
      percent: 0,
      status: "open",
      finished: false,
      reopenable: false,
    });
  });

  it("is open partway through", () => {
    const state = withProgress({ [first!.id]: done(first!.id) });
    const progress = weekProgress(REF, state);
    expect(progress.settled).toBe(1);
    expect(progress.percent).toBeCloseTo(33.33, 1);
    expect(progress.status).toBe("open");
    expect(progress.finished).toBe(false);
  });

  it("is settled when every step is done or skipped, without anyone pressing a button", () => {
    const state = withProgress({
      [first!.id]: done(first!.id),
      [second!.id]: skipped(second!.id),
      [third!.id]: done(third!.id),
    });
    const progress = weekProgress(REF, state);
    expect(progress.status).toBe("settled");
    expect(progress.finished).toBe(true);
    expect(progress.percent).toBe(100);
    // Nothing to reopen: the steps are resolved.
    expect(progress.reopenable).toBe(false);
  });

  it("is closed when a parent forced it with steps still open, and that one can be reopened", () => {
    const state: AppState = {
      ...EMPTY_STATE,
      completed: { [TEST_PACK.id]: { at: "2026-06-15T10:00:00.000Z", forced: true } },
    };
    const progress = weekProgress(REF, state);
    expect(progress.status).toBe("closed");
    expect(progress.finished).toBe(true);
    expect(progress.settled).toBe(0);
    expect(progress.reopenable).toBe(true);
  });

  it("stops being reopenable once the open steps are settled", () => {
    const state: AppState = {
      ...EMPTY_STATE,
      progress: {
        [first!.id]: done(first!.id),
        [second!.id]: done(second!.id),
        [third!.id]: done(third!.id),
      },
      completed: { [TEST_PACK.id]: { at: "2026-06-15T10:00:00.000Z", forced: true } },
    };
    expect(weekProgress(REF, state).reopenable).toBe(false);
  });

  it("does not divide by zero on a pack with no actions", () => {
    const empty = { ...REF, coreActionIds: [] };
    const progress = weekProgress(empty, EMPTY_STATE);
    expect(progress.percent).toBe(0);
    expect(progress.status).toBe("open");
    expect(progress.finished).toBe(false);
  });
});
