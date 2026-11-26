import { findIndexedAction, type ActionIndexEntry } from "@ninetothree/content/action-index";
import type { PackIndexEntry } from "@ninetothree/content/pack-index";

import type { AppState, Pin, ProgressStatus } from "./model";

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

/** The page's words, so the phone and the browser cannot drift. */
export const HISTORY_HEADING = "Your history";
export const HISTORY_INTRO_EMPTY = "Nothing recorded yet. This fills in as you go.";
export const HISTORY_NOTHING = "Nothing recorded yet.";
export const HISTORY_NOTHING_BODY =
  "When you mark something done or skip it, it lands here. Nothing is recorded until you say so.";
export const HISTORY_RETIRED = "This step is no longer in the guide. What you did is still here.";
export const HISTORY_REASON = "You said: ";
export const HISTORY_COMPLETE = "Everything in this week is accounted for.";
export const HISTORY_PINNED = "Pinned";
export const HISTORY_DONE = "Done";
export const HISTORY_SKIPPED = "Skipped";

/** "3 steps across 2 weeks. Nothing here expires." */
export function historyLine(total: number, weeks: number): string {
  if (total === 0) return HISTORY_INTRO_EMPTY;
  const step = total === 1 ? "step" : "steps";
  const week = weeks === 1 ? "week" : "weeks";
  return `${total} ${step} across ${weeks} ${week}. Nothing here expires.`;
}

/** "2 done, 1 skipped", or an empty string when a week has only records it cannot describe. */
export function weekSummary(week: HistoryWeek): string {
  const parts: string[] = [];
  if (week.done > 0) parts.push(`${week.done} done`);
  if (week.skipped > 0) parts.push(`${week.skipped} skipped`);
  return parts.join(", ");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Hand-rolled, not `Intl`. `Intl.DateTimeFormat` can resolve differently on
 * the server and the client, which produces a hydration mismatch and a visible
 * re-render. A month table cannot disagree with itself.
 */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  // getUTCMonth is 0-11 and MONTHS has twelve entries, so the lookup always hits.
  const month = MONTHS[date.getUTCMonth()] as string;
  return `${month} ${date.getUTCDate()}`;
}

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
