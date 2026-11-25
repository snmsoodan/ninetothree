"use client";

import { useEffect, useRef } from "react";
import { raiseProgress, raiseSpan, walkOffset } from "./raising";

/** The drawing, in `public/art`. Wide, short and line-only on transparent. */
const ART = "/art/raising-family.png";

/**
 * A family walking, faintly, over the page.
 *
 * The art is a hand-drawn file, not geometry we build. Three attempts at
 * computing a body out of strokes all read as a mannequin — every joint was a
 * seam — and a real drawing carries the wobble, the uneven pressure and the
 * curving line that make a person look like a person. It is used as a CSS mask
 * over `bg-current`, so it takes the page's own ink colour in both themes
 * instead of being a black picture pasted on top.
 *
 * What moves is computed: the group takes one stride each way as the page
 * scrolls, and stops at both ends. It is drawn over the page rather than
 * behind it — an opaque card hides anything underneath, and translucent enough
 * to show a line is translucent enough to dissolve the card. Over the top, the
 * line is the same weight on a card as on the paper, and ink over ink is a
 * no-op, so it passes through letters without softening them.
 *
 * One passive `scroll` listener reads `scrollY`; one `requestAnimationFrame`
 * loop eases toward it and stops on arrival. Motion and contrast stay the
 * parent's call: under reduced motion the group is drawn once at the start of
 * the walk and the listener is never attached, and `globals.css` hides the
 * whole layer under `prefers-contrast: more` or the Settings preference.
 */
export function RaisingFigure() {
  const art = useRef<HTMLDivElement | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    // Not every environment has `matchMedia` — jsdom leaves it out unless a
    // test stubs it — so the OS preference is optional and its absence means
    // "no opinion", not "reduced".
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    let current = 0;
    let target = 0;

    const apply = (t: number) => {
      const offset = walkOffset(t);
      if (art.current) {
        art.current.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
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

    apply(0);
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
      className="no-print pointer-events-none fixed inset-x-0 bottom-0 z-20 flex select-none items-end justify-center pb-24 text-ink"
    >
      <div
        ref={art}
        data-testid="raising-figure-art"
        className="w-[min(92vw,900px)] bg-current opacity-[0.07] [will-change:transform]"
        style={{
          aspectRatio: "1100 / 701",
          maskImage: `url(${ART})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center bottom",
          WebkitMaskImage: `url(${ART})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center bottom",
        }}
      />
    </div>
  );
}
