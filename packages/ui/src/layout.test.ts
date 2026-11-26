import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BREAKPOINTS, LAYOUT_MODES, columnsFor, layoutClass, layoutModeFor } from "./layout";

const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "layout.css"), "utf8");

describe("layout", () => {
  it("uses the same thresholds as the phone", () => {
    expect(BREAKPOINTS).toEqual({ regular: 360, medium: 600, expanded: 840 });
  });

  it("names a mode the way both clients do", () => {
    expect(layoutModeFor(320)).toBe("compact");
    expect(layoutModeFor(390)).toBe("regular");
    expect(layoutModeFor(700)).toBe("medium");
    expect(layoutModeFor(900)).toBe("expanded");
    expect(layoutModeFor(1100)).toBe("expanded");
    expect(layoutModeFor(Number.NaN)).toBe("compact");
  });

  it("gives the same columns as the native grid", () => {
    expect(LAYOUT_MODES.map(columnsFor)).toEqual([1, 1, 2, 2]);
  });

  it("carries every mode name in the stylesheet", () => {
    for (const mode of LAYOUT_MODES) {
      expect(layoutClass(mode)).toBe(`layout-${mode}`);
      expect(CSS).toContain(`.layout-${mode}`);
    }
    expect(CSS).toContain("container-type: inline-size");
    expect(CSS).toContain("layout-half-open");
  });
});
