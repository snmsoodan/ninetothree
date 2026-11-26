import { describe, expect, it } from "vitest";
import { hingeFor, isHalfOpen, usableWidth, type Hinge } from "./hinge.ts";
import { crossesHinge, panesFor } from "./layout.ts";
import { describeLayout } from "./use-layout-mode.ts";

const laptop: Hinge = { start: 400, end: 440, angle: 100, posture: "half-open" };

describe("hingeFor", () => {
  it("reports no hinge until expo-hinge is wired in", () => {
    expect(hingeFor()).toBeNull();
  });
});

describe("isHalfOpen", () => {
  it("is true only for the laptop posture", () => {
    expect(isHalfOpen(laptop)).toBe(true);
    expect(isHalfOpen({ ...laptop, posture: "open" })).toBe(false);
    expect(isHalfOpen(null)).toBe(false);
  });
});

describe("usableWidth", () => {
  it("is the window width when there is no crease", () => {
    expect(usableWidth(900, null)).toBe(900);
  });

  it("subtracts the crease, and never goes below zero", () => {
    expect(usableWidth(900, laptop)).toBe(860);
    expect(usableWidth(20, laptop)).toBe(0);
  });
});

describe("describeLayout", () => {
  it("describes a phone as one pane in one column", () => {
    const layout = describeLayout(390);
    expect(layout.mode).toBe("regular");
    expect(layout.columns).toBe(1);
    expect(layout.panesAcross).toBe(1);
    expect(layout.panes).toEqual([{ x: 0, width: 390 }]);
    expect(layout.posture).toBeNull();
  });

  it("treats a creased narrow window as two panes rather than one body across the gap", () => {
    const layout = describeLayout(700, laptop);
    expect(layout.mode).toBe("medium");
    expect(layout.panesAcross).toBe(2);
    expect(layout.panes).toHaveLength(2);
  });

  it("describes a book as two panes, and keeps each pane off the crease", () => {
    const layout = describeLayout(900, laptop);
    expect(layout.mode).toBe("expanded");
    expect(layout.panesAcross).toBe(2);
    expect(layout.posture).toBe("half-open");
    for (const pane of layout.panes) expect(crossesHinge(pane, laptop)).toBe(false);
  });

  it("puts the panes edge to edge across the whole window when there is no crease", () => {
    const layout = describeLayout(1000);
    expect(layout.panes).toEqual(panesFor(1000, null));
    const covered = layout.panes.reduce((total, pane) => total + pane.width, 0);
    expect(covered).toBe(1000);
  });
});
