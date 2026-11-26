import { useWindowDimensions } from "react-native";
import { hingeFor, type Hinge, type Posture } from "./hinge.ts";
import {
  columnsFor,
  layoutModeFor,
  paneCount,
  panesFor,
  type LayoutMode,
  type Span,
} from "./layout.ts";

export interface Layout {
  width: number;
  mode: LayoutMode;
  columns: 1 | 2;
  /** Panes, from `panesFor`. One entry unless `expanded`. */
  panes: Span[];
  panesAcross: 1 | 2;
  posture: Posture | null;
  hinge: Hinge | null;
}

/**
 * The layout, derived from a width.
 *
 * Kept separate from the hook so the whole matrix — every breakpoint, every
 * posture — is testable in jsdom, where there is no device to rotate.
 */
export function describeLayout(width: number, hinge: Hinge | null = null): Layout {
  const mode = layoutModeFor(width);
  // A reported crease is two panes even on a narrow window: one body spanning
  // the gap is the thing this exists to prevent.
  const panesAcross = hinge ? 2 : paneCount(mode);
  return {
    width,
    mode,
    columns: columnsFor(mode),
    panes: panesAcross === 2 ? panesFor(width, hinge) : [{ x: 0, width }],
    panesAcross,
    posture: hinge?.posture ?? null,
    hinge,
  };
}

export function useLayoutMode(): Layout {
  const { width } = useWindowDimensions();
  return describeLayout(width, hingeFor());
}
