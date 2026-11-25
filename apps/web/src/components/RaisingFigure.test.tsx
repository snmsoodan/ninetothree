import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RaisingFigure } from "./RaisingFigure";
import { FRAME_FADE_MS, TRAVEL } from "./raising";

/** A `MediaQueryList` that answers one question and can be flipped later. */
function matchMedia(matches: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;

  vi.spyOn(window, "matchMedia").mockImplementation(() => query);
  return {
    query,
    flip(next: boolean) {
      (query as { matches: boolean }).matches = next;
      listeners.forEach((listener) => listener());
    },
  };
}

const art = () => screen.getByTestId("raising-figure-art");

/** The four stacked drawings, in cycle order. */
const layers = () => [0, 1, 2, 3].map((i) => screen.getByTestId(`raising-figure-frame-${i}`));

/** Which drawing is painted in, as the component last set it. */
const showing = () =>
  layers()
    .map((layer, i) => (layer.style.opacity === "1" ? i : -1))
    .filter((i) => i >= 0);

/** The horizontal part of the group's transform. */
function walked(): number {
  const match = /translate3d\((-?[\d.]+)px/.exec(art().style.transform ?? "");
  if (!match) throw new Error(`no walk offset in "${art().style.transform}"`);
  return Number(match[1]);
}

async function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  await act(async () => {
    window.dispatchEvent(new Event("scroll"));
  });
}

beforeEach(() => {
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete document.documentElement.dataset.motion;
  delete document.documentElement.dataset.contrast;
});

describe("RaisingFigure", () => {
  it("is a drawing and not content, so it is hidden from assistive technology", () => {
    matchMedia(false);
    render(<RaisingFigure />);

    const wrapper = screen.getByTestId("raising-figure");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper.className).toContain("pointer-events-none");
  });

  it("draws the hand-drawn art in the page's own ink, not a black image", () => {
    matchMedia(false);
    render(<RaisingFigure />);

    for (const layer of layers()) {
      const style = layer.getAttribute("style") ?? "";
      // A mask over `bg-current` is what lets the line follow the theme; an
      // `<img>` would be a black drawing in dark mode and a black one in light.
      expect(style).toContain("mask-image");
      expect(style).toContain("contain");
      expect(layer.className).toContain("bg-current");
    }
  });

  it("fades one drawing into the next instead of cutting, so the legs move smoothly", () => {
    matchMedia(false);
    render(<RaisingFigure />);

    for (const layer of layers()) {
      expect(layer.style.transition).toBe(`opacity ${FRAME_FADE_MS}ms linear`);
    }
  });

  it("holds four drawings of one walk, and starts on the first", () => {
    matchMedia(false);
    render(<RaisingFigure />);

    expect(showing()).toEqual([0]);
    expect(art()).toHaveAttribute("data-frame", "0");
    expect(layers().map((layer) => layer.style.maskImage ?? "")).toEqual([
      "url(/art/family-1.png)",
      "url(/art/family-2.png)",
      "url(/art/family-3.png)",
      "url(/art/family-4.png)",
    ]);
  });

  it("steps the drawings as the page scrolls, one after the next", async () => {
    matchMedia(false);
    render(<RaisingFigure />);

    const seen = new Set<number>();
    for (const y of [60, 120, 200, 300, 420, 560, 700, 900]) {
      await scrollTo(y);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 120));
      });
      // One drawing is the destination; the one it replaced is fading out
      // over the top of it, never a third.
      expect(showing()).toHaveLength(1);
      expect(showing()[0]).toBe(Number(art().getAttribute("data-frame")));
      seen.add(Number(art().getAttribute("data-frame")));
    }
    // The walk is a cycle, not a slide: more than one pose has to show.
    expect(seen.size).toBeGreaterThan(1);
  });

  it("draws the part of the work the page is about, not one picture everywhere", () => {
    matchMedia(false);
    const { unmount } = render(<RaisingFigure pathname="/week/24" />);
    expect(screen.getByTestId("raising-figure")).toHaveAttribute("data-theme", "expecting");
    expect(layers()[0]!.style.maskImage).toBe("url(/art/expecting-1.png)");
    unmount();

    render(<RaisingFigure pathname="/signin" />);
    expect(screen.getByTestId("raising-figure")).toHaveAttribute("data-theme", "welcome");
    expect(layers()[0]!.style.maskImage).toBe("url(/art/welcome-1.png)");
  });

  it("draws nothing at all on the pages that have to stand alone", () => {
    matchMedia(false);
    render(<RaisingFigure pathname="/triage" />);
    expect(screen.queryByTestId("raising-figure")).toBeNull();
  });

  it("is faint, so it never competes with the words", () => {
    matchMedia(false);
    render(<RaisingFigure />);
    expect(art().className).toContain("opacity-[0.07]");
  });

  it("walks the family forward as the page scrolls", async () => {
    matchMedia(false);
    render(<RaisingFigure />);
    expect(walked()).toBe(0);

    await scrollTo(600); // half of raiseSpan(800)
    await waitFor(() => expect(walked()).toBeGreaterThan(20));
  });

  it("ends the walk ahead, not back where it began", async () => {
    matchMedia(false);
    render(<RaisingFigure />);

    await scrollTo(4000);
    await waitFor(() => expect(walked()).toBe(TRAVEL));
    // It settles flat on the ground rather than freezing mid-stride.
    await waitFor(() => expect(art().style.transform).toContain("translate3d(44px, 0px, 0)"));
  });

  it("comes back to the start when the page returns to the top", async () => {
    matchMedia(false);
    render(<RaisingFigure />);

    await scrollTo(600);
    await waitFor(() => expect(walked()).toBeGreaterThan(8));

    await scrollTo(0);
    await waitFor(() => expect(walked()).toBe(0));
  });

  it("does not move at all under reduced motion", async () => {
    matchMedia(true);
    render(<RaisingFigure />);

    await scrollTo(600);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(walked()).toBe(0);
  });

  it("also holds still when the preference is set in the app", async () => {
    matchMedia(false);
    document.documentElement.dataset.motion = "reduced";
    render(<RaisingFigure />);

    await scrollTo(600);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(walked()).toBe(0);
  });

  it("returns to the start if reduced motion is turned on mid-walk", async () => {
    const motion = matchMedia(false);
    render(<RaisingFigure />);

    await scrollTo(600);
    await waitFor(() => expect(walked()).toBeGreaterThan(8));

    await act(async () => {
      motion.flip(true);
    });
    await waitFor(() => expect(walked()).toBe(0));
  });

  it("re-reads the scroll position when the window is resized", async () => {
    matchMedia(false);
    render(<RaisingFigure />);

    Object.defineProperty(window, "innerHeight", { configurable: true, value: 400 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 300 });
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => expect(walked()).toBeGreaterThan(8));
  });

  it("stops listening when it is removed, mid-walk or not", async () => {
    matchMedia(false);
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<RaisingFigure />);

    await scrollTo(600);
    unmount();

    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("stops listening when it is removed before it ever moves", () => {
    matchMedia(false);
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<RaisingFigure />);
    unmount();

    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
  });
});
