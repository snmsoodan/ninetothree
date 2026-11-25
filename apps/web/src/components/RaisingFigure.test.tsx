import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RaisingFigure } from "./RaisingFigure";

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

    const style = art().getAttribute("style") ?? "";
    // A mask over `bg-current` is what lets the line follow the theme; an
    // `<img>` would be a black drawing in dark mode and a black one in light.
    expect(style).toContain("raising-family.png");
    expect(style).toContain("mask-image");
    expect(art().className).toContain("bg-current");
  });

  it("is faint, so it never competes with the words", () => {
    matchMedia(false);
    render(<RaisingFigure />);
    expect(art().className).toContain("opacity-[0.07]");
  });

  it("walks the family as the page scrolls", async () => {
    matchMedia(false);
    render(<RaisingFigure />);
    expect(walked()).toBe(0);

    await scrollTo(300); // a quarter of raiseSpan(800)
    await waitFor(() => expect(walked()).toBeGreaterThan(8));
  });

  it("turns the walk around over the second half of the page", async () => {
    matchMedia(false);
    render(<RaisingFigure />);

    await scrollTo(900);
    await waitFor(() => expect(walked()).toBeLessThan(-8));
  });

  it("comes back to the start when the page returns to the top", async () => {
    matchMedia(false);
    render(<RaisingFigure />);

    await scrollTo(300);
    await waitFor(() => expect(walked()).toBeGreaterThan(8));

    await scrollTo(0);
    await waitFor(() => expect(walked()).toBe(0));
  });

  it("does not move at all under reduced motion", async () => {
    matchMedia(true);
    render(<RaisingFigure />);

    await scrollTo(300);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(walked()).toBe(0);
  });

  it("also holds still when the preference is set in the app", async () => {
    matchMedia(false);
    document.documentElement.dataset.motion = "reduced";
    render(<RaisingFigure />);

    await scrollTo(300);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(walked()).toBe(0);
  });

  it("returns to the start if reduced motion is turned on mid-walk", async () => {
    const motion = matchMedia(false);
    render(<RaisingFigure />);

    await scrollTo(300);
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

    await scrollTo(300);
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
