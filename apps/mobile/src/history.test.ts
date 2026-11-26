import { describe, expect, it } from "vitest";
import { EMPTY_STATE, type AppState, type ProgressEntry } from "@ninetothree/domain";
import { ACTION_INDEX } from "@ninetothree/content/action-index";
import { historyView } from "./history";

const FIRST = Object.keys(ACTION_INDEX)[0]!;

function state(progress: Record<string, ProgressEntry> = {}): AppState {
  return { ...EMPTY_STATE, onboarded: true, progress };
}

const done = (at: string): ProgressEntry => ({ status: "done", at });

describe("historyView", () => {
  it("is honest about an empty record", () => {
    const model = historyView(state());
    expect(model.nothing).toBe(true);
    expect(model.empty.title).toBe("Nothing recorded yet.");
    expect(model.weeks).toEqual([]);
  });

  it("shows one row for one completed step, with its day and status", () => {
    const model = historyView(state({ [FIRST]: done("2026-10-20T09:00:00.000Z") }));
    const rows = model.weeks.flatMap((week) => week.rows);
    expect(rows.length).toBe(1);
    expect(rows[0]!.statusLabel).toBe("Done");
    expect(rows[0]!.day).toBeTruthy();
  });

  it("gives a skipped step the same place in the list as a done one", () => {
    const model = historyView(
      state({
        [FIRST]: { status: "skipped", at: "2026-10-20T09:00:00.000Z", reason: "Too tender" },
      }),
    );
    const rows = model.weeks.flatMap((week) => week.rows);
    expect(rows[0]!.statusLabel).toBe("Skipped");
    expect(rows[0]!.reason).toBe("Too tender");
  });

  it("counts the weeks in the intro line", () => {
    const model = historyView(state({ [FIRST]: done("2026-10-20T09:00:00.000Z") }));
    expect(model.intro).toContain("1");
    expect(model.weeks[0]!.summary).toBeTruthy();
  });

  it("exports one long-format CSV with a header and a row per action", () => {
    const model = historyView(state({ [FIRST]: done("2026-10-20T09:00:00.000Z") }));
    const lines = model.csv.trim().split("\r\n");
    expect(lines[0]).toBe("kind,week,item,status,date,note");
    expect(lines.length).toBe(2);
    expect(model.csvFilename).toBe("nine-to-three-history.csv");
  });
});
