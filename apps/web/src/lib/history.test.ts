import { describe, expect, it } from "vitest";
import { TEST_PACK } from "@/test-fixtures";
import { UNKNOWN_TITLE, UNKNOWN_WEEK, buildHistory } from "./history";
import { EMPTY_STATE, type AppState, type ProgressEntry } from "./store";

const packs = [TEST_PACK];

function stateWith(progress: Record<string, ProgressEntry>, overrides: Partial<AppState> = {}) {
  return { ...EMPTY_STATE, onboarded: true, progress, ...overrides };
}

const done = (at: string, extra: Partial<ProgressEntry> = {}): ProgressEntry => ({
  status: "done",
  at,
  ...extra,
});

describe("buildHistory", () => {
  it("is empty when nothing has been recorded", () => {
    const history = buildHistory(EMPTY_STATE, packs);
    expect(history).toEqual({ weeks: [], actions: [], pins: [], total: 0 });
  });

  it("prefers the live content when the action still exists", () => {
    const history = buildHistory(
      stateWith({
        "t-glucose": done("2026-10-01T10:00:00.000Z", {
          title: "A title from an older release",
          packId: "pregnancy-w28",
          packTitle: "Week 28",
        }),
      }),
      packs,
    );
    expect(history.actions[0]).toMatchObject({
      title: "Book your glucose screening",
      packId: "test-week",
      packTitle: "Week 28",
      retired: false,
    });
  });

  it("falls back to the snapshot when the action is gone", () => {
    const history = buildHistory(
      stateWith({
        "retired-action": done("2026-10-01T10:00:00.000Z", {
          title: "A step that used to exist",
          packId: "pregnancy-w20",
          packTitle: "Week 20",
        }),
      }),
      packs,
    );
    expect(history.actions[0]).toMatchObject({
      title: "A step that used to exist",
      packId: "pregnancy-w20",
      packTitle: "Week 20",
      retired: true,
    });
  });

  it("keeps the date of a legacy entry whose action is gone", () => {
    const history = buildHistory(
      stateWith({ "retired-action": done("2026-10-01T10:00:00.000Z") }),
      packs,
    );
    expect(history.actions[0]).toMatchObject({
      title: UNKNOWN_TITLE,
      packTitle: UNKNOWN_WEEK,
      at: "2026-10-01T10:00:00.000Z",
      retired: true,
    });
  });

  it("orders newest first", () => {
    const history = buildHistory(
      stateWith({
        "t-glucose": done("2026-10-01T10:00:00.000Z"),
        "t-tdap": done("2026-10-05T10:00:00.000Z"),
      }),
      packs,
    );
    expect(history.actions.map((action) => action.id)).toEqual(["t-tdap", "t-glucose"]);
  });

  it("sorts three entries newest first in both directions", () => {
    const history = buildHistory(
      stateWith({
        "t-glucose": done("2026-10-01T10:00:00.000Z"),
        "t-tdap": done("2026-10-09T10:00:00.000Z"),
        "t-car-seat": done("2026-10-05T10:00:00.000Z"),
      }),
      packs,
    );
    expect(history.actions.map((action) => action.id)).toEqual([
      "t-tdap",
      "t-car-seat",
      "t-glucose",
    ]);
  });

  it("breaks a timestamp tie on id in both directions", () => {
    const at = "2026-10-01T10:00:00.000Z";
    const history = buildHistory(
      stateWith({ "t-tdap": done(at), "t-glucose": done(at), "t-car-seat": done(at) }),
      packs,
    );
    expect(history.actions.map((action) => action.id)).toEqual([
      "t-car-seat",
      "t-glucose",
      "t-tdap",
    ]);
  });

  it("breaks a tie the same way whatever order the entries were written in", () => {
    const at = "2026-10-01T10:00:00.000Z";
    const history = buildHistory(
      stateWith({ "t-car-seat": done(at), "t-glucose": done(at), "t-tdap": done(at) }),
      packs,
    );
    expect(history.actions.map((action) => action.id)).toEqual([
      "t-car-seat",
      "t-glucose",
      "t-tdap",
    ]);
  });

  it("keeps a reason on a retired entry", () => {
    const history = buildHistory(
      stateWith({
        "retired-action": {
          status: "skipped",
          at: "2026-10-01T10:00:00.000Z",
          reason: "not-for-me",
          title: "Gone",
          packTitle: "Week 20",
        },
      }),
      packs,
    );
    expect(history.actions[0]?.reason).toBe("not-for-me");
  });

  it("breaks a timestamp tie on id so the order is stable", () => {
    const at = "2026-10-01T10:00:00.000Z";
    const history = buildHistory(stateWith({ "t-tdap": done(at), "t-glucose": done(at) }), packs);
    expect(history.actions.map((action) => action.id)).toEqual(["t-glucose", "t-tdap"]);
  });

  it("groups actions into their week", () => {
    const history = buildHistory(
      stateWith({
        "t-glucose": done("2026-10-01T10:00:00.000Z"),
        "t-tdap": { status: "skipped", at: "2026-10-02T10:00:00.000Z", reason: "not-now" },
      }),
      packs,
    );
    expect(history.weeks).toHaveLength(1);
    expect(history.weeks[0]).toMatchObject({
      packId: "test-week",
      packTitle: "Week 28",
      done: 1,
      skipped: 1,
      complete: false,
    });
  });

  it("calls a week complete when every core action has a record", () => {
    const history = buildHistory(
      stateWith({
        "t-glucose": done("2026-10-01T10:00:00.000Z"),
        "t-tdap": done("2026-10-02T10:00:00.000Z"),
        "t-car-seat": { status: "skipped", at: "2026-10-03T10:00:00.000Z" },
      }),
      packs,
    );
    expect(history.weeks[0]?.complete).toBe(true);
  });

  it("never calls a week complete when its pack is gone", () => {
    const history = buildHistory(
      stateWith({
        "retired-action": done("2026-10-01T10:00:00.000Z", {
          title: "Gone",
          packId: "pregnancy-w20",
          packTitle: "Week 20",
        }),
      }),
      packs,
    );
    expect(history.weeks[0]?.complete).toBe(false);
  });

  it("keeps a skip reason", () => {
    const history = buildHistory(
      stateWith({
        "t-tdap": { status: "skipped", at: "2026-10-02T10:00:00.000Z", reason: "not-for-me" },
      }),
      packs,
    );
    expect(history.actions[0]?.reason).toBe("not-for-me");
  });

  it("omits the reason key entirely when there is none", () => {
    const history = buildHistory(stateWith({ "t-tdap": done("2026-10-02T10:00:00.000Z") }), packs);
    expect(history.actions[0]).not.toHaveProperty("reason");
  });

  it("carries the pins through untouched", () => {
    const pins = [
      {
        id: "t-tdap",
        title: "Get your Tdap shot",
        packId: "test-week",
        packTitle: "Week 28",
        at: "",
      },
    ];
    const history = buildHistory(stateWith({}, { pins }), packs);
    expect(history.pins).toEqual(pins);
  });

  it("counts every recorded step, done or skipped", () => {
    const history = buildHistory(
      stateWith({
        "t-glucose": done("2026-10-01T10:00:00.000Z"),
        "t-tdap": { status: "skipped", at: "2026-10-02T10:00:00.000Z" },
      }),
      packs,
    );
    expect(history.total).toBe(2);
  });

  it("groups a retired entry with no pack id under its own week", () => {
    const history = buildHistory(
      stateWith({ "retired-action": done("2026-10-01T10:00:00.000Z") }),
      packs,
    );
    expect(history.weeks).toHaveLength(1);
    expect(history.weeks[0]?.packTitle).toBe(UNKNOWN_WEEK);
  });
});
