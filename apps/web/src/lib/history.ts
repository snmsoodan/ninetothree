import { findIndexedAction, type ActionIndexEntry } from "@ninetothree/content/action-index";
import type { PackIndexEntry } from "@ninetothree/content/pack-index";
import type { AppState, Pin, ProgressStatus } from "./store";

/**
 * History is a snapshot, not a pointer.
 *
 * The acceptance criterion for this is that history stays accurate after
 * content is re-versioned. A progress entry keyed only by action id would not
 * survive that: rename an action and the parent's history silently rewrites
 * itself; retire one and the record of having done it disappears. So every
 * entry carries the title and the week it had at the time, and this module
 * prefers the live content only when the action still exists.
 */

export interface HistoryAction {
  id: string;
  title: string;
  packId: string;
  packTitle: string;
  status: ProgressStatus;
  /** ISO timestamp. */
  at: string;
  reason?: string;
  /** True when the action is no longer in the guide. */
  retired: boolean;
}

export interface HistoryWeek {
  packId: string;
  packTitle: string;
  actions: HistoryAction[];
  done: number;
  skipped: number;
  /** Every core action in the pack has a record. False when the pack is gone. */
  complete: boolean;
  /** The most recent timestamp in the week. */
  at: string;
}

export interface History {
  weeks: HistoryWeek[];
  actions: HistoryAction[];
  pins: Pin[];
  /** How many steps were recorded, done or skipped. */
  total: number;
}

/** Shown when an entry predates snapshots and its action is gone. */
export const UNKNOWN_TITLE = "A step from an earlier version";
export const UNKNOWN_WEEK = "Earlier version";

function resolve(
  id: string,
  entry: {
    status: ProgressStatus;
    at: string;
    reason?: string;
    title?: string;
    packId?: string;
    packTitle?: string;
  },
  index: Record<string, ActionIndexEntry>,
): HistoryAction {
  const found = findIndexedAction(id, index);
  if (found) {
    return {
      id,
      title: found.title,
      packId: found.packId,
      packTitle: found.packTitle,
      status: entry.status,
      at: entry.at,
      ...(entry.reason ? { reason: entry.reason } : {}),
      retired: false,
    };
  }
  return {
    id,
    title: entry.title || UNKNOWN_TITLE,
    packId: entry.packId ?? "",
    packTitle: entry.packTitle || UNKNOWN_WEEK,
    status: entry.status,
    at: entry.at,
    ...(entry.reason ? { reason: entry.reason } : {}),
    retired: true,
  };
}

/**
 * Newest first. Ties break on id so the order is stable across renders —
 * two steps marked in the same millisecond must not swap places on a re-render.
 */
function byNewest(a: HistoryAction, b: HistoryAction): number {
  if (a.at !== b.at) return a.at < b.at ? 1 : -1;
  return a.id < b.id ? -1 : 1;
}

export function buildHistory(
  state: AppState,
  index: Record<string, ActionIndexEntry>,
  packs: readonly PackIndexEntry[],
): History {
  const actions = Object.entries(state.progress)
    .map(([id, entry]) => resolve(id, entry, index))
    .sort(byNewest);

  const groups = new Map<string, HistoryAction[]>();
  for (const action of actions) {
    const key = action.packId || action.packTitle;
    const group = groups.get(key);
    if (group) group.push(action);
    else groups.set(key, [action]);
  }

  const weeks: HistoryWeek[] = [];
  for (const group of groups.values()) {
    const first = group[0] as HistoryAction;
    const pack = packs.find((candidate) => candidate.id === first.packId);
    const complete = pack ? pack.coreActionIds.every((id) => Boolean(state.progress[id])) : false;
    weeks.push({
      packId: first.packId,
      packTitle: first.packTitle,
      actions: group,
      done: group.filter((action) => action.status === "done").length,
      skipped: group.filter((action) => action.status === "skipped").length,
      complete,
      at: first.at,
    });
  }

  return { weeks, actions, pins: state.pins, total: actions.length };
}
