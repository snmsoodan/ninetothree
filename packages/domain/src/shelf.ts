import { findIndexedAction, type ActionIndexEntry } from "@ninetothree/content/action-index";

import { resolvePins, type ResolvedPin } from "./pins";
import type { Pin } from "./model";

/** One pin, with everything the shelf row needs already decided. */
export interface ShelfPin {
  id: string;
  title: string;
  packId: string;
  packTitle: string;
  /** ISO date, when the parent asked to be reminded. */
  remindOn?: string;
  /** True when the step changed under the pin. The note is still theirs. */
  stale: boolean;
  /** Why the step matters, when the step still exists. */
  why: string | null;
  options: ShelfOption[];
  /** The week to open, or null when the pin no longer has one. */
  weekHref: string | null;
  /** Reordering is refused inside a filter — the move would not mean what it looks like. */
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export interface ShelfOption {
  id: string;
  label: string;
  url: string | null;
}

export interface ShelfModel {
  all: ShelfPin[];
  /** The pins to draw, in the order to draw them. */
  shown: ShelfPin[];
  /** True when a filter is narrowing the list. */
  filtering: boolean;
  /** What the count in the header says, or null when there is nothing to count. */
  countLine: string | null;
  /** Set when a filter matched nothing. */
  noMatch: { line: string; clearLabel: string } | null;
}

export interface ShelfInput {
  pins: readonly Pin[];
  index: Record<string, ActionIndexEntry>;
  query?: string;
}

/**
 * The shelf, decided in one place.
 *
 * Every branch the page has — stale, filtered, first, last, empty — is a
 * decision here, so the phone cannot quietly disagree with the browser about
 * whether a pin can move.
 */
export function shelfModel({ pins, index, query = "" }: ShelfInput): ShelfModel {
  const resolved = resolvePins([...pins], index);
  const needle = query.trim().toLowerCase();
  const filtering = needle.length > 0;

  const shown = filtering
    ? resolved.filter(
        (pin) =>
          pin.title.toLowerCase().includes(needle) || pin.packTitle.toLowerCase().includes(needle),
      )
    : resolved;

  const all = resolved.map((pin, position) => {
    const action = pin.stale ? undefined : findIndexedAction(pin.id, index);
    return {
      id: pin.id,
      title: pin.title,
      packId: pin.packId,
      packTitle: pin.packTitle,
      ...(pin.remindOn ? { remindOn: pin.remindOn } : {}),
      stale: pin.stale,
      why: action?.why ?? null,
      options: (action?.options ?? []).map((option) => ({
        id: option.id,
        label: option.label,
        url: option.url ?? null,
      })),
      weekHref: pin.stale ? null : `/week/${pin.packId}`,
      canMoveUp: !filtering && position > 0,
      canMoveDown: !filtering && position < resolved.length - 1,
    };
  });

  return {
    all,
    shown: all.filter((pin) => shown.some((candidate) => candidate.id === pin.id)),
    filtering,
    countLine: resolved.length > 0 ? `${resolved.length} pinned` : null,
    noMatch:
      filtering && shown.length === 0
        ? {
            line: `Nothing matches “${query.trim()}”.`,
            clearLabel: `Show all ${resolved.length}`,
          }
        : null,
  };
}

export function finishedLine(doneCount: number): string {
  return doneCount === 0
    ? "Nothing yet. That is fine."
    : `${doneCount} step${doneCount === 1 ? "" : "s"} done.`;
}

export function moveLabel(title: string, direction: "up" | "down"): string {
  return `Move ${title} ${direction}`;
}

export function unpinLabel(title: string): string {
  return `Unpin ${title}`;
}

export const SHELF_HEADING = "Your shelf";
export const SHELF_INTRO =
  "The things you pinned, and the things you finished. Nothing here expires.";
export const SHELF_PINNED = "Pinned";
export const SHELF_EMPTY = "Nothing pinned yet.";
export const SHELF_EMPTY_BODY =
  "Pin the things you keep needing — the pediatrician’s number, your birth preferences, the safe-sleep checklist.";
export const SHELF_EMPTY_CTA = "See what you can pin";
export const SHELF_FILTER_LABEL = "Find a pin";
export const SHELF_FILTER_PLACEHOLDER = "Pediatrician, week 28, car seat";
export const SHELF_FILTER_NOTE =
  "Clear the filter to reorder. Moving a pin inside a filtered list would not mean what it looks like.";
export const SHELF_STALE_NOTE =
  "This step has changed since you pinned it. The note is still yours to keep or remove.";
export const SHELF_OPEN_WEEK = "Open the week";
export const SHELF_MOVE_UP = "Move up";
export const SHELF_MOVE_DOWN = "Move down";
export const SHELF_UNPIN = "Unpin";
export const SHELF_FINISHED = "Finished";

export type { ResolvedPin };
