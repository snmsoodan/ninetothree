import { ACTION_INDEX } from "@ninetothree/content/action-index";
import { PACK_INDEX } from "@ninetothree/content/pack-index";
import {
  HISTORY_COMPLETE,
  HISTORY_DONE,
  HISTORY_HEADING,
  HISTORY_NOTHING,
  HISTORY_NOTHING_BODY,
  HISTORY_PINNED,
  HISTORY_REASON,
  HISTORY_RETIRED,
  HISTORY_SKIPPED,
  buildHistory,
  formatDay,
  historyLine,
  toCsv,
  weekSummary,
  type AppState,
  type History,
  type HistoryAction,
} from "@ninetothree/domain";

/**
 * The record, on the phone.
 *
 * Same rows, same order, same words as `/history`, because both call
 * `buildHistory`. It is deliberately not a scoreboard: a skipped step is drawn
 * with the same weight as a done one, since skipping is a decision rather than
 * a failure, and there is no percentage or streak anywhere.
 */

export interface HistoryRow extends HistoryAction {
  /** The day it happened, as the website prints it. */
  day: string;
  statusLabel: string;
}

export interface HistoryWeek {
  packId: string;
  packTitle: string;
  complete: boolean;
  summary: string;
  rows: HistoryRow[];
}

export interface HistoryView {
  heading: string;
  intro: string;
  empty: { title: string; body: string };
  weeksHeading: string;
  weeks: HistoryWeek[];
  pinnedHeading: string;
  pins: { id: string; title: string; packId: string; packTitle: string }[];
  /** True when there is nothing at all, so the empty card is the page. */
  nothing: boolean;
  /** The long-format CSV, ready for a share sheet. */
  csv: string;
  csvFilename: string;
}

function row(action: HistoryAction): HistoryRow {
  return {
    ...action,
    day: formatDay(action.at),
    statusLabel: action.status === "done" ? HISTORY_DONE : HISTORY_SKIPPED,
  };
}

export function historyView(state: AppState): HistoryView {
  const history = buildHistory(state, ACTION_INDEX, PACK_INDEX);
  return historyViewOf(state, history);
}

export function historyViewOf(state: AppState, history: History): HistoryView {
  return {
    heading: HISTORY_HEADING,
    intro: historyLine(history.total, history.weeks.length),
    empty: { title: HISTORY_NOTHING, body: HISTORY_NOTHING_BODY },
    weeksHeading: "",
    weeks: history.weeks.map((week) => ({
      packId: week.packId,
      packTitle: week.packTitle,
      complete: week.complete,
      summary: weekSummary(week),
      rows: week.actions.map(row),
    })),
    pinnedHeading: HISTORY_PINNED,
    pins: history.pins.map((pin) => ({
      id: pin.id,
      title: pin.title,
      packId: pin.packId,
      packTitle: pin.packTitle,
    })),
    nothing: history.weeks.length === 0,
    csv: toCsv(state, history),
    csvFilename: "nine-to-three-history.csv",
  };
}

export { HISTORY_COMPLETE, HISTORY_REASON, HISTORY_RETIRED };
