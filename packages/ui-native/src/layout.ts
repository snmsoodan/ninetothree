import { isHalfOpen, type Hinge } from "./hinge.ts";

/**
 * How big the window is, in the four sizes the product draws for.
 *
 * Foldables are the reason this is a width function rather than a device
 * check: a fold is only a phone whose window grew. `useLayoutMode()` reads
 * `useWindowDimensions()`, so unfold, rotate, split-screen and tablet all
 * arrive through the same door.
 */
export type LayoutMode = "compact" | "regular" | "medium" | "expanded";

/** The open end of each range, in points. */
export const BREAKPOINTS = { regular: 360, medium: 600, expanded: 840 } as const;

/**
 * The smallest a control may be, in points. Apple asks for 44 and Android for
 * 48dp; 44 is the one that satisfies both when the platform rounds.
 */
export const MIN_TARGET = 44;

export function layoutModeFor(width: number): LayoutMode {
  // A missing or nonsense width is not an error to throw on: the first frame
  // before the window is measured reports one, and it must draw, not crash.
  if (!Number.isFinite(width)) return "compact";
  if (width < BREAKPOINTS.regular) return "compact";
  if (width < BREAKPOINTS.medium) return "regular";
  if (width < BREAKPOINTS.expanded) return "medium";
  return "expanded";
}

/** Cards across in a one-pane layout. `expanded` gets its columns from panes. */
export function columnsFor(mode: LayoutMode): 1 | 2 {
  return mode === "medium" || mode === "expanded" ? 2 : 1;
}

/** A horizontal slice of the window: where it starts and how wide it is. */
export interface Span {
  x: number;
  width: number;
}

/**
 * The panes an `expanded` window is split into.
 *
 * With a hinge, the gap *is* the split — the crease is a real pair of pixels
 * the OS will not let us paint on. Without one, the split is the middle.
 */
export function panesFor(width: number, hinge: Hinge | null = null): Span[] {
  if (hinge !== null && hinge.end > hinge.start && hinge.start > 0) {
    return [
      { x: 0, width: hinge.start },
      { x: hinge.end, width: width - hinge.end },
    ];
  }
  const half = Math.round(width / 2);
  return [
    { x: 0, width: half },
    { x: half, width: width - half },
  ];
}

/** True when a span has any pixels on the crease. Nothing interactive may. */
export function crossesHinge(span: Span, hinge: Hinge | null): boolean {
  if (hinge === null) return false;
  return span.x < hinge.end && span.x + span.width > hinge.start;
}

/** How many panes a layout has. One, except when the window is a book. */
export function paneCount(mode: LayoutMode): 1 | 2 {
  return mode === "expanded" ? 2 : 1;
}

/**
 * The direction the two panes take.
 *
 * Closed, flat or absent, they sit side by side like a book. A laptop fold is
 * held upright with its bottom half on the table, so the pair stacks and the
 * top half is the one a parent can still see.
 */
export function paneDirection(hinge: Hinge | null): "row" | "column" {
  return isHalfOpen(hinge) ? "column" : "row";
}

/**
 * The panes in the order they are drawn.
 *
 * A half-open window puts the pane holding the primary action first, because
 * the top half is the half above the table. Every other posture keeps the order
 * the screen passed, so a book reads left to right as it always did.
 */
export function orderedPanes<T>(
  panes: readonly [T, T],
  primary: 0 | 1,
  hinge: Hinge | null,
): [T, T] {
  if (!isHalfOpen(hinge)) return [panes[0], panes[1]];
  return primary === 0 ? [panes[0], panes[1]] : [panes[1], panes[0]];
}
