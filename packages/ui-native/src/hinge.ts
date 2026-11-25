/**
 * The crease, and the one question the layout asks about it.
 *
 * On a foldable the window is genuinely discontinuous: there are pixels the
 * app cannot draw on, and a button sitting on them cannot be pressed. The OS
 * is the only thing that knows where they are, so this module holds the shape
 * of that answer and nothing else. `hingeFor()` is the seam `expo-hinge`
 * (`useHinge()`) will be plugged into in the Expo shell; today it reports no
 * hinge, which is correct on every device that has none and safe on the ones
 * that do — a one-pane layout never crosses anything.
 */

export type Posture = "closed" | "open" | "half-open";

export interface Hinge {
  /** First pixel of the unusable gap, from the left edge. */
  start: number;
  /** First usable pixel after the gap. */
  end: number;
  /** Degrees between the two panels. 180 is flat. */
  angle: number;
  posture: Posture;
}

/**
 * The hinge under the current window, if there is one.
 *
 * Deliberately a function, not a hook: when `expo-hinge` lands this becomes
 * `return useHinge() ?? null;` and no caller changes.
 */
export function hingeFor(): Hinge | null {
  return null;
}

/**
 * Half-open "laptop" posture: the bottom half lies flat on the table, so the
 * primary action belongs in the top half where the user can still see it.
 */
export function isHalfOpen(hinge: Hinge | null): boolean {
  return hinge?.posture === "half-open";
}

/** The usable width once the crease is subtracted. */
export function usableWidth(width: number, hinge: Hinge | null): number {
  if (hinge === null) return width;
  return Math.max(0, width - Math.max(0, hinge.end - hinge.start));
}
