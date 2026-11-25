import { describe, expect, it } from "vitest";
import { figureAt, raiseProgress, raiseSpan } from "./raising";

/**
 * A circle is drawn from its leftmost point, so its centre is that point plus
 * the radius, across.
 */
function circleCentre(d: string, radius: number): { x: number; y: number } {
  const match = /^M(-?[\d.]+) (-?[\d.]+)/.exec(d);
  if (!match) throw new Error(`not a circle: ${d}`);
  return { x: Number(match[1]) + radius, y: Number(match[2]) };
}

function centreY(d: string): number {
  return circleCentre(d, 15).y;
}

/** The last point of a path, which for a limb is the hand or the foot. */
function endPoint(d: string): { x: number; y: number } {
  const numbers = d.match(/-?[\d.]+/g) ?? [];
  return { x: Number(numbers.at(-2)), y: Number(numbers.at(-1)) };
}

function path(key: string, t: number): string {
  const shape = figureAt(t).find((candidate) => candidate.key === key);
  if (!shape) throw new Error(`no path named ${key}`);
  return shape.d;
}

describe("figureAt", () => {
  it("returns the same keys in the same order at every position", () => {
    const keys = figureAt(0).map((shape) => shape.key);
    for (const t of [0.2, 0.5, 0.8, 1]) {
      expect(figureAt(t).map((shape) => shape.key)).toEqual(keys);
    }
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("draws a mother and a child as separate strokes", () => {
    const keys = figureAt(0.5).map((shape) => shape.key);
    expect(keys).toContain("head");
    expect(keys).toContain("child-head");
    expect(keys).toContain("arm-left");
    expect(keys).toContain("child-leg-right");
  });

  it("raises the child as the number grows", () => {
    const held = centreY(path("child-head", 0));
    const up = centreY(path("child-head", 1));
    expect(held).toBeGreaterThan(150);
    expect(up).toBeLessThan(held);
    // Level with her own head, which is how high you hold someone at arm's
    // length without your shoulders going up with them.
    expect(up).toBeLessThan(98);
  });

  it("holds the child at her chest before anything moves", () => {
    // She stands facing right, so the child is carried beside her, not in
    // front of her: clear of her own head, and level with her chest.
    const head = circleCentre(path("child-head", 0), 15);
    expect(head.x).toBeGreaterThan(198);
    expect(head.y).toBeGreaterThan(150);
    expect(head.y).toBeLessThan(190);
  });

  it("never drops the child on the way up", () => {
    const heights = [0, 0.25, 0.5, 0.75, 1].map((t) => centreY(path("child-head", t)));
    for (let index = 1; index < heights.length; index += 1) {
      expect(heights[index]!).toBeLessThanOrEqual(heights[index - 1]!);
    }
  });

  it("lifts her hands above her shoulders as the child rises", () => {
    expect(endPoint(path("arm-left", 0)).y).toBeGreaterThan(160);
    expect(endPoint(path("arm-left", 1)).y).toBeLessThan(160);
    expect(endPoint(path("arm-right", 1)).x).toBeGreaterThan(endPoint(path("arm-left", 1)).x);
  });

  it("lifts the child up rather than out of her reach", () => {
    const feet = [path("child-leg-left", 1), path("child-leg-right", 1)].map(endPoint);
    // Clear of her body, which reaches x=234 at the hem.
    for (const foot of feet) expect(foot.x).toBeGreaterThan(234);
    // But still inside arm's length: the whole point is that she is holding
    // them, not passing them to someone off-frame.
    expect(Math.max(...feet.map((foot) => foot.x))).toBeLessThan(368);
    expect(feet[1]!.x).toBeGreaterThan(feet[0]!.x);
  });

  it("clamps values outside the range", () => {
    expect(figureAt(-4)).toEqual(figureAt(0));
    expect(figureAt(9)).toEqual(figureAt(1));
  });

  it("treats a non-finite position as the start", () => {
    expect(figureAt(Number.NaN)).toEqual(figureAt(0));
    expect(figureAt(Number.POSITIVE_INFINITY)).toEqual(figureAt(0));
  });

  it("never writes a broken number into a path", () => {
    for (let t = 0; t <= 1; t += 0.05) {
      for (const shape of figureAt(t)) {
        expect(shape.d).not.toMatch(/NaN|Infinity|undefined/);
        for (const raw of shape.d.match(/-?[\d.]+/g) ?? []) {
          expect(Number.isFinite(Number(raw))).toBe(true);
        }
      }
    }
  });
});

describe("raiseSpan", () => {
  it("asks for one and a half viewports", () => {
    expect(raiseSpan(800)).toBe(1200);
  });

  it("returns zero for anything that cannot be a viewport", () => {
    expect(raiseSpan(0)).toBe(0);
    expect(raiseSpan(-400)).toBe(0);
    expect(raiseSpan(Number.NaN)).toBe(0);
  });
});

describe("raiseProgress", () => {
  it("runs from nothing at the top to everything at the span", () => {
    expect(raiseProgress(0, 1000)).toBe(0);
    expect(raiseProgress(250, 1000)).toBe(0.25);
    expect(raiseProgress(1000, 1000)).toBe(1);
  });

  it("holds at the ends rather than wrapping", () => {
    expect(raiseProgress(-200, 1000)).toBe(0);
    expect(raiseProgress(4000, 1000)).toBe(1);
  });

  it("returns nothing when there is nowhere to scroll", () => {
    expect(raiseProgress(300, 0)).toBe(0);
    expect(raiseProgress(300, -1)).toBe(0);
    expect(raiseProgress(Number.NaN, 1000)).toBe(0);
    expect(raiseProgress(300, Number.NaN)).toBe(0);
  });
});
