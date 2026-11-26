/**
 * The four window sizes, named once for both clients.
 *
 * These numbers are the same as `packages/ui-native/src/layout.ts`. A width
 * that means "expanded" in the iOS app means "expanded" in a browser, which is
 * what makes a screenshot at 900 px comparable across the two.
 */
export type LayoutMode = "compact" | "regular" | "medium" | "expanded";

export const BREAKPOINTS = { regular: 360, medium: 600, expanded: 840 } as const;

export const LAYOUT_MODES: readonly LayoutMode[] = ["compact", "regular", "medium", "expanded"];

export function layoutModeFor(width: number): LayoutMode {
  if (!Number.isFinite(width) || width < BREAKPOINTS.regular) return "compact";
  if (width < BREAKPOINTS.medium) return "regular";
  if (width < BREAKPOINTS.expanded) return "medium";
  return "expanded";
}

/** The class that names a mode, so a test can read it off the DOM. */
export function layoutClass(mode: LayoutMode): string {
  return `layout-${mode}`;
}

/** The columns the grid draws at a mode; the native `columnsFor` is the pair. */
export function columnsFor(mode: LayoutMode): 1 | 2 {
  return mode === "medium" || mode === "expanded" ? 2 : 1;
}
