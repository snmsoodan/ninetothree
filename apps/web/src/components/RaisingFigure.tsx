"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  FRAMES,
  FRAME_FADE_MS,
  raiseProgress,
  raiseSpan,
  themeForPath,
  walkFrame,
  walkOffset,
} from "./raising";

/**
 * A family walking, faintly, over the page.
 *
 * The art is hand-drawn, not geometry we build. Three attempts at computing a
 * body out of strokes all read as a mannequin — every joint was a seam — and a
 * real drawing carries the wobble, the uneven pressure and the curving line
 * that make a person look like a person. Each is used as a CSS mask over
 * `bg-current`, so it takes the page's own ink colour in both themes instead of
 * being a black picture pasted on top.
 *
 * A single drawing cannot swing its legs, so the legs come from four drawings
 * of one walk cycle, stepped through as the page scrolls: two contacts and two
 * passes, landing on frame 0 at rest. Hard cuts between four drawings read as a
 * slide show, so the layers cross-fade over `FRAME_FADE_MS` — the overlap is the
 * blur a real leg leaves between two positions, and the parent's own ink
 * carries it. `contain` (not `cover`) sizes them: the whole drawing has to be on
 * the page, and a tall phone viewport was cropping most of it away.
 *
 * Each part of the app gets its own cycle — a family of three where it opens, a
 * pregnant woman over the weeks, a toddler over growth, a newborn being held
 * where you join, a pram for the paperwork — picked from the pathname, so the
 * library does not look like the terms page. Safety, triage and print get none.
 *
 * What moves is computed: the group takes six cycles as the page scrolls and
 * stops at both ends. It is drawn over the page rather than behind it — an
 * opaque card hides anything underneath, and translucent enough to show a line
 * is translucent enough to dissolve the card. Over the top, the line is the
 * same weight on a card as on the paper, and ink over ink is a no-op, so it
 * passes through letters without softening them.
 *
 * One passive `scroll` listener reads `scrollY`; one `requestAnimationFrame`
 * loop eases toward it and stops on arrival. Motion and contrast stay the
 * parent's call: under reduced motion the group is drawn once, standing still,
 * and the listener is never attached, and `globals.css` hides the whole layer
 * under `prefers-contrast: more` or the Settings preference.
 */
export function RaisingFigure({ pathname }: { pathname?: string } = {}) {
  // Mounted once in the root layout so no page can forget it. AppShell still
  // hands over the route it already read, which saves a second subscription on
  // the pages that have one.
  const route = usePathname();
  const theme = themeForPath(pathname ?? route ?? "/");
  const art = useRef<HTMLDivElement | null>(null);
  const layers = useRef<Array<HTMLDivElement | null>>([]);
  const frame = useRef(0);
  const shown = useRef(-1);

  useEffect(() => {
    if (!theme) return;

    // Not every environment has `matchMedia` — jsdom leaves it out unless a
    // test stubs it — so the OS preference is optional and its absence means
    // "no opinion", not "reduced".
    const motion = window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    let current = 0;
    let target = 0;
    shown.current = -1;

    const apply = (t: number) => {
      const offset = walkOffset(t);
      if (!art.current) return;
      art.current.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${offset.sway}deg)`;

      // Opacity on four stacked copies: one drawing visible, the rest painted
      // out, so there is never a moment with two bodies on screen.
      const index = walkFrame(t);
      if (index === shown.current) return;
      shown.current = index;
      art.current.dataset.frame = String(index);
      layers.current.forEach((layer, i) => {
        if (!layer) return;
        layer.style.opacity = i === index ? "1" : "0";
        layer.dataset.active = i === index ? "true" : "false";
      });
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
      // A slower follow than a snap: the group has weight, and arriving before
      // the page does makes it look like it is being dragged.
      current += delta * 0.12;
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
  }, [theme]);

  if (!theme) return null;

  return (
    <div
      aria-hidden="true"
      data-raising-figure=""
      data-testid="raising-figure"
      data-theme={theme}
      className="no-print pointer-events-none fixed inset-0 z-20 select-none text-ink"
    >
      <div
        ref={art}
        data-testid="raising-figure-art"
        data-frame="0"
        className="relative h-full w-full opacity-[0.07] [will-change:transform]"
        style={{ transformOrigin: "50% 100%" }}
      >
        {Array.from({ length: FRAMES }, (_, i) => {
          const src = `/art/${theme}-${i + 1}.png`;
          return (
            <div
              key={src}
              ref={(el) => {
                layers.current[i] = el;
              }}
              data-testid={`raising-figure-frame-${i}`}
              data-active={i === 0 ? "true" : "false"}
              className="absolute inset-0 bg-current"
              style={{
                opacity: i === 0 ? 1 : 0,
                transition: `opacity ${FRAME_FADE_MS}ms linear`,
                maskImage: `url(${src})`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center center",
                WebkitMaskImage: `url(${src})`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center center",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
