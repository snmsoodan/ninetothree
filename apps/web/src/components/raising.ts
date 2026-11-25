/**
 * Where the family is on their walk, given how far the page has been scrolled.
 *
 * The drawing itself is a hand-drawn file — `/art/raising-family.png`, used as
 * a mask so it takes the page's ink colour — and not a path we compute. Real
 * line art has the wobble and the uneven pressure that make a person read as a
 * person, and no amount of geometry got close. What is computed here is only
 * the motion: how far along the walk the group has come.
 */

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * How much scrolling one walk takes: a page and a half.
 *
 * Shorter and the group slides past while the parent is still reading the
 * first card; longer and the movement is so slow that it reads as a rendering
 * fault rather than as someone walking.
 */
export function raiseSpan(viewportHeight: number): number {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return 0;
  return viewportHeight * 1.5;
}

/**
 * The fraction of the walk completed at `scrollY`, clamped at both ends.
 *
 * Overscroll on iOS reports negative `scrollY` and on some browsers a value
 * past the document, so neither end may be taken at face value: the group
 * must stop, not slide off.
 */
export function raiseProgress(scrollY: number, span: number): number {
  if (!Number.isFinite(scrollY) || !Number.isFinite(span) || span <= 0) return 0;
  return clamp01(scrollY / span);
}

/**
 * The offset of the drawing at `t`, in CSS pixels.
 *
 * They walk a little to the right and back again over the page — one stride
 * each way, so the group is where it started by the time the walk is done and
 * nothing drifts off the edge of a narrow screen. The vertical part is the
 * rise of a footfall, damped to under a pixel so it is felt rather than seen.
 */
export function walkOffset(t: number): { x: number; y: number } {
  const step = clamp01(Number.isFinite(t) ? t : 0);
  const swing = Math.sin(step * Math.PI * 2);
  return {
    x: Math.round(swing * 18 * 100) / 100 + 0,
    y: Math.round((Math.cos(step * Math.PI * 4) - 1) * 0.8 * 100) / 100 + 0,
  };
}
