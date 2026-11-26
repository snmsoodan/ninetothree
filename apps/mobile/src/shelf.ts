import { ACTION_INDEX } from "@ninetothree/content/action-index";
import {
  SHELF_EMPTY,
  SHELF_EMPTY_BODY,
  SHELF_EMPTY_CTA,
  SHELF_FILTER_LABEL,
  SHELF_FILTER_NOTE,
  SHELF_FILTER_PLACEHOLDER,
  SHELF_FINISHED,
  SHELF_HEADING,
  SHELF_INTRO,
  SHELF_MOVE_DOWN,
  SHELF_MOVE_UP,
  SHELF_OPEN_WEEK,
  SHELF_PINNED,
  SHELF_STALE_NOTE,
  SHELF_UNPIN,
  finishedLine,
  moveLabel,
  shelfModel,
  unpinLabel,
  type ShelfPin,
} from "@ninetothree/domain";

import type { Pin } from "@ninetothree/domain";

/**
 * The shelf, as data.
 *
 * Same model as the browser — `shelfModel` decides order, the stale note, and
 * whether a pin may move — and this file only adds the words the phone draws
 * and the labels a screen reader reads out.
 */

export interface ShelfRows {
  /** Every pin, in the order it is kept. */
  all: ShelfPin[];
  /** The pins the filter lets through. */
  shown: ShelfPin[];
  /** True when a filter is on, so reordering is refused. */
  filtering: boolean;
  countLine: string | null;
  /** Set when a filter matched nothing. */
  noMatch: { line: string; clearLabel: string } | null;
}

export interface ShelfView {
  heading: string;
  intro: string;
  pinnedHeading: string;
  rows: ShelfRows;
  empty: boolean;
  emptyLine: string;
  emptyBody: string;
  emptyCta: string;
  filterLabel: string;
  query: string;
  filterPlaceholder: string;
  filterNote: string;
  staleNote: string;
  openWeek: string;
  moveUp: string;
  moveDown: string;
  unpin: string;
  finishedHeading: string;
  finishedLine: string;
}

export interface ShelfInput {
  pins: readonly Pin[];
  query?: string;
  doneCount: number;
}

export function shelfView({ pins, query = "", doneCount }: ShelfInput): ShelfView {
  const model = shelfModel({ pins, index: ACTION_INDEX, query });

  return {
    heading: SHELF_HEADING,
    intro: SHELF_INTRO,
    pinnedHeading: SHELF_PINNED,
    rows: {
      all: model.all,
      shown: model.shown,
      filtering: model.filtering,
      countLine: model.countLine,
      noMatch: model.noMatch,
    },
    empty: model.all.length === 0,
    emptyLine: SHELF_EMPTY,
    emptyBody: SHELF_EMPTY_BODY,
    emptyCta: SHELF_EMPTY_CTA,
    filterLabel: SHELF_FILTER_LABEL,
    query,
    filterPlaceholder: SHELF_FILTER_PLACEHOLDER,
    filterNote: SHELF_FILTER_NOTE,
    staleNote: SHELF_STALE_NOTE,
    openWeek: SHELF_OPEN_WEEK,
    moveUp: SHELF_MOVE_UP,
    moveDown: SHELF_MOVE_DOWN,
    unpin: SHELF_UNPIN,
    finishedHeading: SHELF_FINISHED,
    finishedLine: finishedLine(doneCount),
  };
}

export { moveLabel, unpinLabel };
