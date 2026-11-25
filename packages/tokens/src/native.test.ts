import { measureWidth, parseMs, parsePx, parseRem, themeFor } from "./native.ts";
import { dark, light, shadows, text, type Palette } from "./tokens.ts";

const NAMES = Object.keys(light) as (keyof Palette)[];

describe("themeFor", () => {
  it("has every colour name in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      expect(Object.keys(themeFor(mode).color).sort()).toEqual([...NAMES].sort());
    }
  });

  it("is the light palette by default, and the dark one when asked", () => {
    expect(themeFor().color).toBe(light);
    expect(themeFor("light").color.paper).toBe("#fbf9f6");
    expect(themeFor("dark").color).toEqual(dark);
  });

  it("gives every named type size a number, in points at the web's root size", () => {
    const { fontSize } = themeFor();

    expect(Object.keys(fontSize).sort()).toEqual(Object.keys(text).sort());
    // 0.9375rem × 16 = 15, which is the size the label on the web is.
    expect(fontSize.sm).toBe(15);
    expect(fontSize.base).toBe(17);
    expect(Object.values(fontSize).every((value) => typeof value === "number")).toBe(true);
  });

  it("turns leading into a line height, because RN has no unitless line-height", () => {
    const { lineHeight, fontSize } = themeFor();

    expect(lineHeight.base).toBe(Math.round(fontSize.base! * 1.6 * 100) / 100);
    expect(Object.keys(lineHeight).sort()).toEqual(Object.keys(fontSize).sort());
  });

  it("gives spacing and radius as numbers rather than CSS strings", () => {
    const theme = themeFor();

    expect(Object.values(theme.space).every((value) => typeof value === "number")).toBe(true);
    expect(theme.space[4]).toBe(16);
    expect(theme.radius.md).toBe(10);
    expect(theme.radius.full).toBe(999);
  });

  it("gives durations as milliseconds, because animations count milliseconds", () => {
    expect(themeFor().duration).toEqual({ fast: 80, base: 160, slow: 240 });
  });

  it("keeps shadows as strings, which RN's boxShadow accepts unchanged", () => {
    expect(themeFor("light").shadow).toBe(shadows.light);
    expect(themeFor("dark").shadow).toEqual(shadows.dark);
    expect(themeFor("dark").shadow.sm).toBe("0 1px 2px rgb(0 0 0 / 0.3)");
  });

  it("asks for one font family and names a fallback, because RN takes one family", () => {
    expect(themeFor().fontFamily).toEqual({ display: "Newsreader", sans: "Inter" });
    expect(themeFor().fontFallback).toEqual({ display: "Georgia", sans: "System" });
  });

  it("carries the measure as a character count", () => {
    expect(themeFor().measureCh).toBe(66);
  });
});

describe("the unit parsers", () => {
  it("read the three units the token source actually uses", () => {
    expect(parseRem("1.0625rem")).toBe(17);
    expect(parsePx("0.25px")).toBe(0.25);
    expect(parseMs("160ms")).toBe(160);
  });

  it("refuse anything else, so a token written in the wrong unit fails the build", () => {
    // A token authored in `em` or `s` would otherwise arrive on the phone as
    // NaN, which is a layout that silently collapses rather than an error.
    expect(() => parseRem("1.0625em")).toThrow("not a rem value: 1.0625em");
    expect(() => parsePx("1rem")).toThrow("not a px value: 1rem");
    expect(() => parseMs("0.16s")).toThrow("not a ms value: 0.16s");
  });
});

describe("measureWidth", () => {
  it("is the same number of characters at the same size as the web's 66ch", () => {
    // 66 × 17 × 0.5 — a body paragraph, wide enough for the measure and no wider.
    expect(measureWidth(17)).toBe(561);
  });

  it("scales with the size it is given", () => {
    expect(measureWidth(13)).toBeLessThan(measureWidth(17));
    expect(measureWidth(17, 40)).toBe(340);
  });
});
