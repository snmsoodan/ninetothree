"use client";

import { useEffect, useRef } from "react";
import { FIGURE_VIEWBOX, figureAt, raiseProgress, raiseSpan } from "./raising";

/**
 * The first frame, rendered on the server.
 *
 * `useState` would be wrong here: the server cannot know the scroll position,
 * so the first client render has to be the same drawing or hydration
 * mismatches. Rendering the hug and correcting in an effect keeps the two
 * halves identical, and the correction is invisible because the figure is
 * already where it belongs by the time anyone has scrolled.
 */
const FIRST_FRAME = figureAt(0);

/**
 * A mother and child, faintly, behind the page.
 *
 * Every frame writes `d` attributes on paths that already exist. Nothing is
 * added, removed, or re-rendered, so React never runs during a scroll and the
 * only work per frame is thirteen short string assignments.
 *
 * The listener, not a scroll library: one `scroll` handler that reads
 * `scrollY`, then a single `requestAnimationFrame` loop that eases toward it
 * and stops when it arrives. A passive listener and no `preventDefault` means
 * the page keeps the compositor's own scrolling.
 *
 * Motion and contrast are the parent's call, not ours. Under reduced motion the
 * figure is drawn once in the hug pose and the listener is never attached.
 * Under `prefers-contrast: more` — set in the OS or in Settings — the whole
 * layer is hidden by `globals.css`, because a decorative smudge is one more
 * thing a low-vision parent has to look past on the page that tells them what
 * to do next.
 */
export function RaisingFigure() {
  const nodes = useRef<(SVGPathElement | null)[]>([]);
  const frame = useRef(0);

  useEffect(() => {
    // Not every environment has `matchMedia` — jsdom leaves it out unless a
    // test stubs it — so the OS preference is optional and its absence means
    // "no opinion", not "reduced".
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    let current = 0;
    let target = 0;

    const apply = (t: number) => {
      const shapes = figureAt(t);
      for (let index = 0; index < shapes.length; index += 1) {
        const shape = shapes[index];
        if (shape) nodes.current[index]?.setAttribute("d", shape.d);
      }
    };

    // The Settings preference and the OS preference are asked separately on
    // purpose: `data-motion` is only present when the parent chose it, so
    // "absent" has to mean "the OS decides", not "not reduced".
    const still = () =>
      motion?.matches === true || document.documentElement.dataset.motion === "reduced";

    const tick = () => {
      frame.current = 0;
      const delta = target - current;
      if (Math.abs(delta) < 0.002) {
        current = target;
        apply(current);
        return;
      }
      current += delta * 0.18;
      apply(current);
      frame.current = window.requestAnimationFrame(tick);
    };

    const read = () => {
      if (still()) {
        target = 0;
        current = 0;
        apply(0);
        return;
      }
      target = raiseProgress(window.scrollY, raiseSpan(window.innerHeight));
      frame.current ||= window.requestAnimationFrame(tick);
    };

    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    motion?.addEventListener("change", read);

    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      motion?.removeEventListener("change", read);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-raising-figure=""
      data-testid="raising-figure"
      className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-0 flex select-none items-end justify-center pb-28 text-ink"
    >
      <svg
        viewBox={FIGURE_VIEWBOX}
        focusable="false"
        className="h-[46vh] max-h-[430px] w-auto opacity-[0.10]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {FIRST_FRAME.map((shape, index) => (
          <path
            key={shape.key}
            ref={(element) => {
              nodes.current[index] = element;
            }}
            data-part={shape.key}
            d={shape.d}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}
