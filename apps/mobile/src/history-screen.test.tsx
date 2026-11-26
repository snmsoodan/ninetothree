import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@ninetothree/ui-native";
import { EMPTY_STATE, type AppState, type ProgressEntry } from "@ninetothree/domain";
import { ACTION_INDEX } from "@ninetothree/content/action-index";
import { PACK_INDEX } from "@ninetothree/content/pack-index";
import { historyView } from "./history";
import { History, type HistoryHandlers } from "./history-screen";

const IDS = Object.keys(ACTION_INDEX);
const FIRST = IDS[0]!;
const SECOND = IDS[1]!;

const done = (at: string): ProgressEntry => ({ status: "done", at });
const skipped = (at: string): ProgressEntry => ({ status: "skipped", at, reason: "Too tender" });

function state(progress: Record<string, ProgressEntry> = {}): AppState {
  return { ...EMPTY_STATE, onboarded: true, progress };
}

const PIN = {
  id: FIRST,
  title: ACTION_INDEX[FIRST]!.title,
  packId: ACTION_INDEX[FIRST]!.packId,
  packTitle: ACTION_INDEX[FIRST]!.packTitle,
  at: "2026-10-20T09:00:00.000Z",
};

function handlers(): HistoryHandlers {
  return { onShare: vi.fn(), onOpenWeek: vi.fn() };
}

function draw(progress: Record<string, ProgressEntry> = {}, pins: AppState["pins"] = []) {
  const spies = handlers();
  render(
    <ThemeProvider mode="light">
      <History model={historyView({ ...state(progress), pins })} handlers={spies} />
    </ThemeProvider>,
  );
  return spies;
}

describe("History", () => {
  it("offers the empty card and no export before anything is recorded", () => {
    draw();
    expect(screen.getByTestId("history-empty")).toBeTruthy();
    expect(screen.queryByTestId("share-history")).toBeNull();
  });

  it("shows a done and a skipped row with their labels", () => {
    draw({
      [FIRST]: done("2026-10-20T09:00:00.000Z"),
      [SECOND]: skipped("2026-10-19T09:00:00.000Z"),
    });
    expect(screen.getAllByText("Done").length).toBe(1);
    expect(screen.getAllByText("Skipped").length).toBe(1);
  });

  it("prints the reason a step was skipped", () => {
    draw({ [FIRST]: skipped("2026-10-20T09:00:00.000Z") });
    expect(screen.getByText("You said: Too tender")).toBeTruthy();
  });

  it("shares the CSV the model built", () => {
    const spies = draw({ [FIRST]: done("2026-10-20T09:00:00.000Z") });
    fireEvent.click(screen.getByTestId("share-history"));
    const [csv, filename] = vi.mocked(spies.onShare).mock.calls[0]!;
    expect(csv).toContain("kind,week,item,status,date,note");
    expect(filename).toBe("nine-to-three-history.csv");
  });

  it("opens the week a row belongs to", () => {
    const spies = draw({ [FIRST]: done("2026-10-20T09:00:00.000Z") });
    fireEvent.click(screen.getByTestId(`open-${FIRST}`));
    expect(spies.onOpenWeek).toHaveBeenCalledWith(ACTION_INDEX[FIRST]!.packId);
  });

  it("shows a pinned step and opens its week", () => {
    const spies = draw({ [FIRST]: done("2026-10-20T09:00:00.000Z") }, [PIN]);
    fireEvent.click(screen.getByTestId(`pin-${FIRST}`));
    expect(spies.onOpenWeek).toHaveBeenCalledWith(PIN.packId);
  });

  it("marks a week complete only when every core step is accounted for", () => {
    const packId = ACTION_INDEX[FIRST]!.packId;
    const ids = PACK_INDEX.find((pack) => pack.id === packId)!.coreActionIds;
    const progress: Record<string, ProgressEntry> = {};
    for (const id of ids) progress[id] = done("2026-10-20T09:00:00.000Z");
    draw(progress);
    expect(screen.getAllByText("Everything in this week is accounted for.").length).toBe(1);
  });

  it("keeps a retired step visible and says what it was", () => {
    draw({ "gone-action": done("2026-10-20T09:00:00.000Z") });
    expect(screen.getByText(/no longer in the guide/)).toBeTruthy();
  });

  it("does not score the parent", () => {
    draw({
      [FIRST]: done("2026-10-20T09:00:00.000Z"),
      [SECOND]: skipped("2026-10-19T09:00:00.000Z"),
    });
    expect(screen.queryByText(/%/)).toBeNull();
    expect(screen.queryByText(/streak/i)).toBeNull();
  });
});
