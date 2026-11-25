import {
  contrast,
  dark,
  fontSansHyperlegible,
  fonts,
  forcedColors,
  leading,
  light,
  measure,
  motion,
  radius,
  shadows,
  spacing,
  text,
  type Hex,
  type Palette,
} from "./tokens.ts";

/**
 * Renders `packages/ui/src/tokens.css`.
 *
 * The stylesheet is generated rather than authored, and `pnpm tokens:check`
 * is what stops it from being hand-edited: if the file on disk and this
 * function disagree, the command fails and prints the diff rather than letting
 * the two copies drift.
 *
 * Everything below the `@theme` block exists because a value has to be answered
 * somewhere a media query or an attribute can reach it — dark mode, high
 * contrast, reduced motion, Hyperlegible, forced colours. Tailwind reads
 * `@theme`; the browser reads the rest.
 */

function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function colour(name: keyof Palette, value: Hex, indent: string): string {
  return `${indent}--color-${kebab(name)}: ${value};`;
}

/** The eight greys and surfaces every screen stands on. */
const GROUND: (keyof Palette)[] = [
  "paper",
  "paperRaised",
  "paperSunken",
  "ink",
  "inkMuted",
  "inkFaint",
  "line",
  "lineStrong",
];

/**
 * The eight hues, in pairs: the colour and its wash. Each pair is preceded by
 * the sentence that says what it may be used for, because a palette without
 * that sentence is how a "success" green ends up on a missed week.
 */
const ACCENTS: { comment: string[]; names: (keyof Palette)[] }[] = [
  {
    comment: [
      '  /* Sage is the only "positive" colour. It is used for done, never for',
      "     encouragement. A finished action is quiet, not celebratory. */",
    ],
    names: ["sage", "sageWash"],
  },
  {
    comment: [
      "  /* Clay is warmth: the accent for the current week, the pin, the thing",
      "     that is yours. Never used for warnings. */",
    ],
    names: ["clay", "clayWash"],
  },
  {
    comment: ['  /* Amber is "worth knowing", not "wrong". */'],
    names: ["amber", "amberWash"],
  },
  {
    comment: [
      "  /* Red is reserved. It appears only when something is actually wrong.",
      "     Never for validation, never for a missed week, never for a sale. */",
    ],
    names: ["red", "redWash"],
  },
];

function themeColours(): string {
  const ground = GROUND.map((name) => colour(name, light[name], "  ")).join("\n");
  const accents = ACCENTS.map(
    (group) =>
      `${group.comment.join("\n")}\n${group.names
        .map((name) => colour(name, light[name], "  "))
        .join("\n")}`,
  ).join("\n\n");
  return `${ground}\n\n${accents}`;
}

/** Dark mode restates the same sixteen names, in the same two groups. */
function darkColours(indent: string): string {
  const ground = GROUND.map((name) => colour(name, dark[name], indent)).join("\n");
  const accents = ACCENTS.flatMap((group) => group.names)
    .map((name) => colour(name, dark[name], indent))
    .join("\n");
  return `${ground}\n\n${accents}`;
}

function shadowBlock(values: { sm: string; md: string; lg: string }, indent: string): string {
  return (["sm", "md", "lg"] as const)
    .map((key) => `${indent}--shadow-${key}: ${values[key]};`)
    .join("\n");
}

const TEXT_NOTES = [
  "13px — labels, source lines",
  "15px — secondary",
  "17px — body. Not 16. 17 reads calmer.",
  "19px — lead paragraph",
  "22px — card title",
  "28px — section",
  "36px — page title",
  "48px — the week number",
];

const TYPE_SIZES = Object.entries(text)
  .map(([key, value], index) => `  --text-${key}: ${value}; /* ${TEXT_NOTES[index]} */`)
  .join("\n");

const LEADING = Object.entries(leading)
  .map(([key, value]) => `  --leading-${key}: ${value};`)
  .join("\n");

const SPACING = Object.entries(spacing)
  .map(([key, value]) => `  --spacing-${key}: ${value};`)
  .join("\n");

const RADIUS = Object.entries(radius)
  .map(([key, value]) => `  --radius-${key}: ${value};`)
  .join("\n");

const CONTRAST = Object.entries(contrast)
  .map(([key, value]) => colour(key as keyof Palette, value, "    "))
  .join("\n");

function reducedDurations(indent: string): string {
  return ["fast", "base", "slow"]
    .map((name) => `${indent}--duration-${name}: ${motion.durationReduced};`)
    .join("\n");
}

export function renderTokensCss(): string {
  return `/*
 * Nine to Three — design tokens.
 *
 * These are the only colours, sizes, and timings allowed in the product.
 * If a value is not here, it does not exist. See UX_CRAFT.md.
 * GENERATED FILE — do not edit. The source is packages/tokens/src/tokens.ts,
 * and \`pnpm tokens:check\` fails when this file and that source disagree.
 *
 * Tailwind v4 reads @theme and generates utilities from it, so
 * \`bg-paper\`, \`text-ink-muted\`, \`border-line\` all work.
 */

@theme {
  /* ---- Colour: light (the default, and the one that matters) ---- */
${themeColours()}

  /* ---- Type ---- */
  --font-display: ${fonts.display};
  --font-sans: ${fonts.sans};

${TYPE_SIZES}

${LEADING}

  /* ---- Space: a 4px base, but only these steps ---- */
${SPACING}

  /* ---- Radius: soft, never pill-shaped except for badges ---- */
${RADIUS}

  /* ---- Shadow: barely there. Depth is not a design language here. ---- */
${shadowBlock(shadows.light, "  ")}

  /* ---- Motion: 80–240ms, ease-out, no bounce ---- */
  --ease-calm: ${motion.easeCalm};
  --duration-fast: ${motion.durationFast};
  --duration-base: ${motion.durationBase};
  --duration-slow: ${motion.durationSlow};

  /* ---- Measure: 62–68ch. Longer lines are harder to read at 3am. ---- */
  --measure: ${measure};
}

/* Dark mode is warm, not black. A cold dark mode at 3am is a screen in
   your face. This one is a lamp. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${darkColours("    ")}

${shadowBlock(shadows.dark, "    ")}
  }
}

:root[data-theme="dark"] {
${darkColours("  ")}

${shadowBlock(shadows.dark, "  ")}
}

/* High contrast: for anyone who needs it, not as a theme. */
@media (prefers-contrast: more) {
  :root {
${CONTRAST}
  }
}

:root[data-contrast="more"] {
${CONTRAST.replace(/^ {4}/gm, "  ")}
}

/*
 * Motion is opt-out, and the opt-out is honoured everywhere.
 *
 * Zeroing the durations is not enough on its own. The route settle moves the
 * page 4px and back; at 0ms that is not a transition, it is a flash, which is
 * worse than the movement it replaced. So the settle is removed outright.
 */
@media (prefers-reduced-motion: reduce) {
  :root {
${reducedDurations("    ")}
  }

  [data-settle] {
    transform: none !important;
  }
}

:root[data-motion="reduced"] {
${reducedDurations("  ")}
}

:root[data-motion="reduced"] [data-settle] {
  transform: none !important;
}

/*
 * Letters: a second typeface, not a bigger one.
 *
 * Atkinson Hyperlegible was drawn by the Braille Institute for low vision, and
 * it separates the characters that are easy to confuse (I l 1, O 0, rn m). It
 * is not a dyslexia font and we do not call it one — the evidence for
 * dyslexia-specific typefaces is thin, and the honest claim is that these
 * letters are easier to tell apart. Size is the browser's job.
 */
:root[data-font="hyperlegible"] {
  --font-sans: ${fontSansHyperlegible};
}

/*
 * Windows High Contrast Mode throws our colours away and keeps only the
 * structure. A card that is a card because of a background colour becomes an
 * invisible box, so every surface gets a border it did not need before.
 */
@media (forced-colors: active) {
  :root {
    --color-line: ${forcedColors.line};
    --color-line-strong: ${forcedColors.lineStrong};
  }

  [data-surface] {
    border-color: ${forcedColors.line};
  }
}
`;
}
