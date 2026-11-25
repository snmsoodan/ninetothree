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

function paths() {
  return Array.from(document.querySelectorAll('[data-testid="raising-figure"] path'));
}

/** The child's head is the one part named for it, so it is found by name. */
function childHeadY(): number {
  const shape = document.querySelector('[data-part="child-head"]');
  const match = /^M-?[\d.]+ (-?[\d.]+)/.exec(shape?.getAttribute("d") ?? "");
  if (!match) throw new Error("no child head");
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
    expect(wrapper.querySelector("svg")).toHaveAttribute("focusable", "false");
    expect(paths()).toHaveLength(17);
  });

  it("keeps every path out of the tab order and the way of a tap", () => {
    matchMedia(false);
    render(<RaisingFigure />);

    const wrapper = screen.getByTestId("raising-figure");
    expect(wrapper.className).toContain("pointer-events-none");
    expect(paths().every((path) => !path.hasAttribute("tabindex"))).toBe(true);
  });

  it("lifts the child as the page scrolls", async () => {
    matchMedia(false);
    render(<RaisingFigure />);
    const held = childHeadY();

    await scrollTo(1200); // raiseSpan(800)
    await waitFor(() => expect(childHeadY()).toBeLessThan(held));
    await waitFor(() => expect(childHeadY()).toBeLessThan(90));
  });

  it("puts the child back down when the page returns to the top", async () => {
    matchMedia(false);
    render(<RaisingFigure />);
    const held = childHeadY();

    await scrollTo(1200);
    await waitFor(() => expect(childHeadY()).toBeLessThan(90));

    await scrollTo(0);
    await waitFor(() => expect(childHeadY()).toBeCloseTo(held, 0));
  });

  it("does not move at all under reduced motion", async () => {
    matchMedia(true);
    render(<RaisingFigure />);
    const held = childHeadY();

    await scrollTo(1200);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(childHeadY()).toBe(held);
  });

  it("also holds still when the preference is set in the app", async () => {
    matchMedia(false);
    document.documentElement.dataset.motion = "reduced";
    render(<RaisingFigure />);
    const held = childHeadY();

    await scrollTo(1200);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });
    expect(childHeadY()).toBe(held);
  });

  it("settles back into the hug if reduced motion is turned on mid-scroll", async () => {
    const motion = matchMedia(false);
    render(<RaisingFigure />);
    const held = childHeadY();

    await scrollTo(1200);
    await waitFor(() => expect(childHeadY()).toBeLessThan(90));

    await act(async () => {
      motion.flip(true);
    });
    await waitFor(() => expect(childHeadY()).toBeCloseTo(held, 0));
  });

  it("re-reads the scroll position when the window is resized", async () => {
    matchMedia(false);
    render(<RaisingFigure />);
    const held = childHeadY();

    Object.defineProperty(window, "innerHeight", { configurable: true, value: 400 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 600 });
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
    });
    await waitFor(() => expect(childHeadY()).toBeLessThan(held));
  });

  it("stops listening when it is removed, mid-rise or not", async () => {
    matchMedia(false);
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<RaisingFigure />);

    await scrollTo(1200);
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
