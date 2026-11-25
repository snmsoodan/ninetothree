import {
  dark,
  fonts,
  leading,
  light,
  measure,
  motion,
  radius,
  shadows,
  spacing,
  text,
  type Palette,
  type ThemeMode,
} from "./tokens.ts";

/**
 * The same tokens, shaped for React Native.
 *
 * React Native has no CSS custom properties, no `rem`, no `ch`, and no
 * stylesheet cascade, so a phone cannot read `tokens.css` at all. What it can
 * do is read this module, which is derived from the same object the stylesheet
 * is generated from — so `colors.paper` and `--color-paper` cannot disagree,
 * because neither is authored anywhere.
 *
 * The conversions are deliberate and few:
 *
 * - `rem` becomes points at the root size the web uses (16px), so `0.9375rem`
 *   and `15` are the same size on both clients.
 * - `px` becomes a number, because that is what RN expects.
 * - `ms` becomes a number, because `Animated` and `LayoutAnimation` count
 *   milliseconds.
 * - shadows stay strings. React Native's new architecture accepts `boxShadow`
 *   with the same syntax CSS does, so there is nothing to parse and nothing to
 *   get wrong.
 */

/** The web's root font size. `1rem` is 16px, so it is 16 points here. */
const ROOT_POINTS = 16;

/** `ch` is ~0.5em for both Inter and the system fallbacks at body sizes. */
const CH_TO_EM = 0.5;

export function parseRem(value: string): number {
  const match = /^(-?[\d.]+)rem$/.exec(value);
  if (!match) throw new Error(`not a rem value: ${value}`);
  return Math.round(Number(match[1]) * ROOT_POINTS * 100) / 100;
}

export function parsePx(value: string): number {
  const match = /^(-?[\d.]+)px$/.exec(value);
  if (!match) throw new Error(`not a px value: ${value}`);
  return Number(match[1]);
}

export function parseMs(value: string): number {
  const match = /^(-?[\d.]+)ms$/.exec(value);
  if (!match) throw new Error(`not a ms value: ${value}`);
  return Number(match[1]);
}

/**
 * The first family in a CSS stack — `"Inter", ui-sans-serif, ...` → `Inter`.
 *
 * Written as two replacements rather than a split and an index, because the
 * stack is never empty and an index would need a "this cannot happen" branch
 * that no test could honestly reach.
 */
function familyName(stack: string): string {
  return stack
    .replace(/,.*$/s, "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

/** What to ask for when the webfont is not installed, per platform. */
const FALLBACK: Record<"display" | "sans", string> = {
  display: "Georgia",
  sans: "System",
};

export interface NativeTheme {
  color: Palette;
  fontFamily: Record<"display" | "sans", string>;
  /** Only used when `fontFamily` is unavailable; RN wants one family, not a stack. */
  fontFallback: Record<"display" | "sans", string>;
  fontSize: Record<string, number>;
  /** Body leading applied to each size, because RN has no unitless `line-height`. */
  lineHeight: Record<string, number>;
  space: Record<string, number>;
  radius: Record<string, number>;
  shadow: { sm: string; md: string; lg: string };
  duration: { fast: number; base: number; slow: number };
  /** `ch`, because the measure is about characters and has no pixel value. */
  measureCh: number;
}

export function themeFor(mode: ThemeMode = "light"): NativeTheme {
  const palette = mode === "dark" ? dark : light;
  const bodyLeading = Number(leading.normal);

  const fontSize: Record<string, number> = {};
  const lineHeight: Record<string, number> = {};
  for (const [key, value] of Object.entries(text)) {
    const size = parseRem(value);
    fontSize[key] = size;
    lineHeight[key] = Math.round(size * bodyLeading * 100) / 100;
  }

  const space: Record<string, number> = {};
  for (const [key, value] of Object.entries(spacing)) space[key] = parseRem(value);

  const radii: Record<string, number> = {};
  for (const [key, value] of Object.entries(radius)) radii[key] = parsePx(value);

  return {
    color: palette,
    fontFamily: { display: familyName(fonts.display), sans: familyName(fonts.sans) },
    fontFallback: FALLBACK,
    fontSize,
    lineHeight,
    space,
    radius: radii,
    shadow: mode === "dark" ? shadows.dark : shadows.light,
    duration: {
      fast: parseMs(motion.durationFast),
      base: parseMs(motion.durationBase),
      slow: parseMs(motion.durationSlow),
    },
    measureCh: Number(measure.replace("ch", "")),
  };
}

/**
 * A paragraph width for a given font size.
 *
 * The web asks for `66ch` and the browser measures the character. Native has
 * no such unit, so this multiplies instead — the same number of characters at
 * the same size, which is what the measure is actually about.
 */
export function measureWidth(
  fontSize: number,
  ch: number = Number(measure.replace("ch", "")),
): number {
  return Math.round(ch * fontSize * CH_TO_EM);
}
