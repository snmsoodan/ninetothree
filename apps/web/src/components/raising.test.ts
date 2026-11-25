import { describe, expect, it } from "vitest";
import { raiseProgress, raiseSpan, walkOffset } from "./raising";

describe("the walk", () => {
  it("spreads over a page and a half of scrolling", () => {
    expect(raiseSpan(800)).toBe(1200);
    expect(raiseSpan(600)).toBe(900);
  });

  it("has no span and no start when the viewport has no height", () => {
    expect(raiseSpan(0)).toBe(0);
    expect(raiseSpan(Number.NaN)).toBe(0);
    expect(raiseSpan(-10)).toBe(0);
  });

  it("moves from nothing to everything over that span, and clamps", () => {
    expect(raiseProgress(0, 1200)).toBe(0);
    expect(raiseProgress(600, 1200)).toBe(0.5);
    expect(raiseProgress(1200, 1200)).toBe(1);
    expect(raiseProgress(9999, 1200)).toBe(1);
    // Overscroll rubber-band goes negative; the group must not walk backwards.
    expect(raiseProgress(-300, 1200)).toBe(0);
    expect(raiseProgress(600, 0)).toBe(0);
  });

  it("treats a non-finite scroll position as the start", () => {
    expect(raiseProgress(Number.NaN, 1200)).toBe(0);
    expect(raiseProgress(Number.POSITIVE_INFINITY, 1200)).toBe(0);
  });
});

describe("walkOffset", () => {
  it("starts and finishes where the page starts, so nothing drifts away", () => {
    expect(walkOffset(0)).toEqual({ x: 0, y: 0 });
    expect(walkOffset(1)).toEqual({ x: 0, y: 0 });
  });

  it("steps out to the side and comes back", () => {
    const quarter = walkOffset(0.25);
    expect(quarter.x).toBeGreaterThan(10);
    const threeQuarters = walkOffset(0.75);
    expect(threeQuarters.x).toBeLessThan(-10);
  });

  it("never strays far enough to leave a narrow phone", () => {
    for (let t = 0; t <= 1; t += 0.02) {
      const offset = walkOffset(t);
      expect(Math.abs(offset.x)).toBeLessThanOrEqual(18);
      expect(Math.abs(offset.y)).toBeLessThanOrEqual(2);
    }
  });

  it("bobs twice per stride, the way a walk does", () => {
    const bobs = [0, 0.25, 0.5, 0.75, 1].map((t) => walkOffset(t).y);
    expect(bobs[0]).toBeCloseTo(bobs[2]!, 5);
    expect(bobs[1]).toBeCloseTo(bobs[3]!, 5);
    expect(bobs[1]).toBeLessThan(bobs[0]!);
  });

  it("clamps and survives a broken number", () => {
    expect(walkOffset(-2)).toEqual(walkOffset(0));
    expect(walkOffset(5)).toEqual(walkOffset(1));
    expect(walkOffset(Number.NaN)).toEqual(walkOffset(0));
  });
});
