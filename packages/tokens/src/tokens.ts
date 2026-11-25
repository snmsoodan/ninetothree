/*
 * Nine to Three — design tokens, as data.
 *
 * These are the only colours, sizes, and timings allowed in the product. If a
 * value is not here, it does not exist. See UX_CRAFT.md.
 *
 * There is one source and two compilers, which is the whole point of this file
 * existing outside a stylesheet. `./css.ts` renders it into the `@theme` block
 * Tailwind reads, and `./native.ts` renders it into React Native style values.
 * A palette retyped by hand is a palette that drifts the first time somebody
 * changes a colour, so nothing downstream is allowed to restate a value.
 */

export type Hex = `#${string}`;

/**
 * The colours a surface, a mark, or a wash can be.
 *
 * Seventeen names, and each one means something. `sage` is done and never
 * encouragement; `clay` is warmth and never a warning; `red` is reserved for
 * something actually wrong. The comments in `./css.ts` carry the reasoning.
 */
export interface Palette {
  paper: Hex;
  paperRaised: Hex;
  paperSunken: Hex;
  ink: Hex;
  inkMuted: Hex;
  inkFaint: Hex;
  line: Hex;
  lineStrong: Hex;
  sage: Hex;
  sageWash: Hex;
  clay: Hex;
  clayWash: Hex;
  amber: Hex;
  amberWash: Hex;
  red: Hex;
  redWash: Hex;
}

/** The light palette is the product, and the only one that matters. */
export const light: Palette = {
  paper: "#fbf9f6",
  paperRaised: "#ffffff",
  paperSunken: "#f4f0ea",
  ink: "#1f1b18",
  inkMuted: "#5c534c",
  inkFaint: "#726860",
  line: "#e8e2da",
  lineStrong: "#d6cec4",
  sage: "#4f6b51",
  sageWash: "#eef2ee",
  clay: "#9a5238",
  clayWash: "#f7eeea",
  amber: "#8a6a1f",
  amberWash: "#f8f2e2",
  red: "#a32e2e",
  redWash: "#fbeded",
};

/**
 * Dark mode is warm, not black. A cold dark mode at 3am is a screen in your
 * face; this one is a lamp. Same seventeen names, so nothing in a component
 * knows which mode it is in.
 */
export const dark: Palette = {
  paper: "#17140f",
  paperRaised: "#201c16",
  paperSunken: "#100e0a",
  ink: "#f2ede6",
  inkMuted: "#b3a99f",
  inkFaint: "#8f857b",
  line: "#2e2822",
  lineStrong: "#3d362e",
  sage: "#8fae90",
  sageWash: "#1e2620",
  clay: "#c98a72",
  clayWash: "#2a1f1a",
  amber: "#c9a94e",
  amberWash: "#26200f",
  red: "#d98a8a",
  redWash: "#2a1616",
};

/**
 * Four values, not a fourth palette. High contrast is for anyone who needs
 * it, not a theme, so it changes only the three greys that carry text and
 * rules and leaves every hue alone.
 */
export const contrast: Pick<Palette, "inkMuted" | "inkFaint" | "line" | "lineStrong"> = {
  inkMuted: "#4a423c",
  inkFaint: "#5c534c",
  line: "#b8aea3",
  lineStrong: "#8f857a",
};

/**
 * A shadow, in the one form React Native's new architecture also accepts, so
 * the same string is a CSS value and a style value and there is nothing to
 * convert.
 */
export interface Shadows {
  sm: string;
  md: string;
  lg: string;
}

export const shadows: { light: Shadows; dark: Shadows } = {
  light: {
    sm: "0 1px 2px rgb(31 27 24 / 0.04)",
    md: "0 2px 8px rgb(31 27 24 / 0.06)",
    lg: "0 8px 24px rgb(31 27 24 / 0.08)",
  },
  dark: {
    sm: "0 1px 2px rgb(0 0 0 / 0.3)",
    md: "0 2px 8px rgb(0 0 0 / 0.35)",
    lg: "0 8px 24px rgb(0 0 0 / 0.45)",
  },
};

export interface FontStacks {
  display: string;
  sans: string;
}

/**
 * Newsreader for the words that should be read slowly, Inter for everything
 * else. The stacks end in real system fonts rather than in `sans-serif`, so a
 * machine without the webfont degrades to something chosen instead of to
 * whatever the browser defaults to.
 */
export const fonts: FontStacks = {
  display: '"Newsreader", ui-serif, Georgia, "Times New Roman", serif',
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
};

/**
 * Atkinson Hyperlegible is a second typeface, not a bigger one. Drawn by the
 * Braille Institute to separate the characters that are easy to confuse
 * (I l 1, O 0, rn m). It is not a dyslexia font and we do not call it one.
 */
export const fontSansHyperlegible =
  'var(--font-atkinson), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

/** rem, so the browser's own text size still decides how big 17px is. */
export interface TextSizes {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  "4xl": string;
}

export const text: TextSizes = {
  xs: "0.8125rem", // 13px — labels, source lines
  sm: "0.9375rem", // 15px — secondary
  base: "1.0625rem", // 17px — body. Not 16. 17 reads calmer.
  lg: "1.1875rem", // 19px — lead paragraph
  xl: "1.375rem", // 22px — card title
  "2xl": "1.75rem", // 28px — section
  "3xl": "2.25rem", // 36px — page title
  "4xl": "3rem", // 48px — the week number
};

export const leading = {
  tight: "1.2",
  snug: "1.4",
  normal: "1.6",
} as const;

/** A 4px base, but only these steps. No `space.7`, and no arbitrary values. */
export const spacing = {
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
} as const;

/** Soft, never pill-shaped except for badges. */
export const radius = {
  sm: "6px",
  md: "10px",
  lg: "14px",
  xl: "20px",
  full: "999px",
} as const;

/** 80–240ms, ease-out, no bounce. */
export const motion = {
  easeCalm: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  durationFast: "80ms",
  durationBase: "160ms",
  durationSlow: "240ms",
  /** What every duration becomes when motion is reduced to nothing. */
  durationReduced: "0ms",
} as const;

/**
 * 62–68ch. Longer lines are harder to read at 3am. The unit is characters
 * because the measure is about characters — it has no meaning in pixels.
 */
export const measure = "66ch";

/**
 * Windows High Contrast Mode throws the palette away and keeps the structure,
 * so a card that is a card because of a background colour becomes an invisible
 * box. These two names are the system colours that keep it visible.
 */
export const forcedColors = {
  line: "CanvasText",
  lineStrong: "CanvasText",
} as const;

/** How many custom properties this file is responsible for. */
export const tokenCount = 108;

export type ThemeMode = "light" | "dark";
