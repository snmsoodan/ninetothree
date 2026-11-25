import type { AppState, Choice, Notice } from "./model";

/**
 * Questions asked of the state, never of the store.
 *
 * Every function here takes the state it reads, so the same answer is
 * available on the server, in a test, and in a component that already has the
 * snapshot. None of them touch storage or the clock — `isSnoozed` takes
 * `today` as an argument for exactly that reason, so a test can move time
 * without faking timers and the server agrees with the client.
 */

export function isDone(state: AppState, actionId: string): boolean {
  return state.progress[actionId]?.status === "done";
}

export function isSkipped(state: AppState, actionId: string): boolean {
  return state.progress[actionId]?.status === "skipped";
}

export function isSnoozed(state: AppState, actionId: string, today: string): boolean {
  const entry = state.snoozed[actionId];
  return Boolean(entry && entry.until > today);
}

export function chosenOption(state: AppState, actionId: string): Choice | undefined {
  return state.choices[actionId];
}

/** Every notice still on the screen, newest first. */
export function visibleNotices(state: AppState): Notice[] {
  return Object.values(state.notices)
    .filter((notice) => !notice.dismissedAt)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function isWeekComplete(state: AppState, packId: string): boolean {
  return Boolean(state.completed[packId]);
}

export function isPinned(state: AppState, actionId: string): boolean {
  return state.pins.some((pin) => pin.id === actionId);
}

export type StageInputValue =
  { status: "pregnant"; dueDate: string } | { status: "parent"; birthDate: string };

/** The date the product should treat as "today" for this parent. */
export function stageInput(state: AppState): StageInputValue | null {
  if (state.status === "pregnant" && state.dueDate) {
    return { status: "pregnant", dueDate: state.dueDate };
  }
  if (state.status === "parent" && state.birthDate) {
    return { status: "parent", birthDate: state.birthDate };
  }
  return null;
}
