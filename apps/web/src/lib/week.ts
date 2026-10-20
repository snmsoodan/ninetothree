import type { StagePack } from "@ninetothree/content";
import type { AppState } from "./store";

/**
 * A step is settled when it is done or skipped. Skipping is a decision, not a
 * gap: a parent who read the step and decided it is not for them has finished
 * with it. Counting only `done` left a week at 0% forever for someone who
 * skipped all three, which is the opposite of what the product promises.
 */
export function settledIds(pack: StagePack, state: AppState): string[] {
  return pack.coreActions
    .filter((action) => {
      const status = state.progress[action.id]?.status;
      return status === "done" || status === "skipped";
    })
    .map((action) => action.id);
}

export type WeekStatus = "open" | "settled" | "closed";

export interface WeekProgress {
  /** Steps done or skipped. */
  settled: number;
  total: number;
  /** 0–100. */
  percent: number;
  status: WeekStatus;
  /** True when the week is finished, however it got there. */
  finished: boolean;
  /**
   * True only for a week a parent closed with steps still open. A week whose
   * steps are all settled has nothing to reopen.
   */
  reopenable: boolean;
}

export function weekProgress(pack: StagePack, state: AppState): WeekProgress {
  const total = pack.coreActions.length;
  const settled = settledIds(pack, state).length;
  const allSettled = total > 0 && settled === total;
  const closed = Boolean(state.completed[pack.id]);

  const status: WeekStatus = closed ? "closed" : allSettled ? "settled" : "open";

  return {
    settled,
    total,
    percent: total === 0 ? 0 : (settled / total) * 100,
    status,
    finished: status !== "open",
    reopenable: closed && !allSettled,
  };
}
