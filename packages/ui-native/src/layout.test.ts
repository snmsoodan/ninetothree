import { describe, expect, it } from "vitest";
import {
  BREAKPOINTS,
  columnsFor,
  crossesHinge,
  layoutModeFor,
  orderedPanes,
  paneDirection,
  paneCount,
  panesFor,
} from "./layout.ts";
import type { Hinge } from "./hinge.ts";

const hinge: Hinge = { start: 380, end: 420, angle: 180, posture: "open" };

describe("layoutModeFor", () => {
  it("gives each range its own mode, at the boundary that opens it", () => {
    expect(layoutModeFor(0)).toBe("compact");
    expect(layoutModeFor(359)).toBe("compact");
    expect(layoutModeFor(BREAKPOINTS.regular)).toBe("regular");
    expect(layoutModeFor(BREAKPOINTS.medium - 1)).toBe("regular");
    expect(layoutModeFor(BREAKPOINTS.medium)).toBe("medium");
    expect(layoutModeFor(BREAKPOINTS.expanded - 1)).toBe("medium");
    expect(layoutModeFor(BREAKPOINTS.expanded)).toBe("expanded");
    expect(layoutModeFor(1366)).toBe("expanded");
  });

  it("treats a nonsense width as the smallest layout rather than throwing", () => {
    expect(layoutModeFor(-1)).toBe("compact");
    expect(layoutModeFor(Number.NaN)).toBe("compact");
  });
});

describe("columnsFor and paneCount", () => {
  it("adds a second card column from medium up, and a second pane only when expanded", () => {
    expect(columnsFor("compact")).toBe(1);
    expect(columnsFor("regular")).toBe(1);
    expect(columnsFor("medium")).toBe(2);
    expect(columnsFor("expanded")).toBe(2);
    expect(paneCount("medium")).toBe(1);
    expect(paneCount("expanded")).toBe(2);
  });
});

describe("panesFor", () => {
  it("splits the middle when there is no crease", () => {
    expect(panesFor(840)).toEqual([
      { x: 0, width: 420 },
      { x: 420, width: 420 },
    ]);
    expect(panesFor(841)).toEqual([
      { x: 0, width: 421 },
      { x: 421, width: 420 },
    ]);
  });

  it("splits on the crease when there is one, and loses the unusable pixels", () => {
    expect(panesFor(800, hinge)).toEqual([
      { x: 0, width: 380 },
      { x: 420, width: 380 },
    ]);
  });

  it("ignores a degenerate hinge and falls back to the middle", () => {
    expect(panesFor(800, { start: 0, end: 0, angle: 180, posture: "open" })[1]).toEqual({
      x: 400,
      width: 400,
    });
  });
});

describe("paneDirection and orderedPanes", () => {
  const laptop: Hinge = { start: 400, end: 420, angle: 100, posture: "half-open" };

  it("reads a book left to right and stacks a laptop", () => {
    expect(paneDirection(null)).toBe("row");
    expect(paneDirection(hinge)).toBe("row");
    expect(paneDirection(laptop)).toBe("column");
  });

  it("moves the primary pane first only when the laptop is half-open", () => {
    expect(orderedPanes(["a", "b"], 1, hinge)).toEqual(["a", "b"]);
    expect(orderedPanes(["a", "b"], 1, laptop)).toEqual(["b", "a"]);
    expect(orderedPanes(["a", "b"], 0, laptop)).toEqual(["a", "b"]);
  });
});

describe("crossesHinge", () => {
  it("is false without a hinge, because a one-pane layout can never be creased", () => {
    expect(crossesHinge({ x: 0, width: 1000 }, null)).toBe(false);
  });

  it("is false for anything wholly on one side", () => {
    expect(crossesHinge({ x: 0, width: 380 }, hinge)).toBe(false);
    expect(crossesHinge({ x: 420, width: 380 }, hinge)).toBe(false);
  });

  it("is true for anything with pixels on the crease, including the full width", () => {
    expect(crossesHinge({ x: 0, width: 800 }, hinge)).toBe(true);
    expect(crossesHinge({ x: 399, width: 2 }, hinge)).toBe(true);
    expect(crossesHinge({ x: 380, width: 40 }, hinge)).toBe(true);
  });
});
