/**
 * How the words are shown.
 *
 * Three settings, and none of them is text size. A browser already zooms, and
 * zoom is better than anything we could build: it scales the whole page, it
 * remembers per site, and it is the same gesture the parent already knows.
 * These three are the things zoom cannot do.
 *
 * The values are written to `<html>` as data attributes, and the design tokens
 * in `packages/ui/src/tokens.css` already answer all three. Until this module
 * existed, those rules were dead: the CSS honoured `data-contrast` and
 * `data-motion`, and nothing ever set them.
 */

export const CONTRASTS = ["default", "more"] as const;
export type Contrast = (typeof CONTRASTS)[number];

export const MOTIONS = ["default", "reduced"] as const;
export type Motion = (typeof MOTIONS)[number];

export const LETTERS = ["default", "hyperlegible"] as const;
export type Letters = (typeof LETTERS)[number];

export interface ReadingPrefs {
  contrast: Contrast;
  motion: Motion;
  letters: Letters;
}

/**
 * The defaults are the operating system's answer, not ours.
 *
 * `default` means "do what the device says", so a parent who has already told
 * their phone they want more contrast or less motion gets it without touching
 * this page. Choosing `more` or `reduced` here is an override for the case
 * where the device setting is not available or not enough.
 */
export const DEFAULT_READING: ReadingPrefs = {
  contrast: "default",
  motion: "default",
  letters: "default",
};

/** The attribute name and value for each preference. */
export const READING_ATTRIBUTES: Record<keyof ReadingPrefs, string> = {
  contrast: "data-contrast",
  motion: "data-motion",
  letters: "data-font",
};

/**
 * The attributes to put on `<html>`, with the defaults omitted.
 *
 * Omitting `default` rather than writing `data-contrast="default"` matters:
 * the CSS keys off the presence of the attribute, so writing the default value
 * would switch the override on and quietly cancel the device setting.
 */
export function readingAttributes(prefs: ReadingPrefs): Record<string, string> {
  const attributes: Record<string, string> = {};
  if (prefs.contrast !== "default") attributes["data-contrast"] = prefs.contrast;
  if (prefs.motion !== "default") attributes["data-motion"] = prefs.motion;
  if (prefs.letters !== "default") attributes["data-font"] = prefs.letters;
  return attributes;
}

/** The storage key the store uses. Kept here so the bootstrap script can read it. */
export const READING_STORAGE_KEY = "ninetothree.v1";

/**
 * The script that runs before the first paint.
 *
 * Without it, a parent who needs high contrast gets a frame of the low-contrast
 * page on every cold load, because a React effect runs after paint. The script
 * is deliberately tiny and swallows every error: if storage is blocked or the
 * JSON is corrupt, the page renders with the device's settings, which is the
 * same thing that happens when the script is not there at all.
 */
export function readingBootstrapScript(): string {
  return `(function(){try{var s=window.localStorage.getItem(${JSON.stringify(
    READING_STORAGE_KEY,
  )});if(!s)return;var r=JSON.parse(s).reading;if(!r)return;var h=document.documentElement;if(r.contrast&&r.contrast!=="default")h.setAttribute("data-contrast",r.contrast);if(r.motion&&r.motion!=="default")h.setAttribute("data-motion",r.motion);if(r.letters&&r.letters!=="default")h.setAttribute("data-font",r.letters)}catch(e){}})();`;
}

/** Applies the attributes to a document element, removing the ones that are off. */
export function applyReading(
  prefs: ReadingPrefs,
  root: { setAttribute(name: string, value: string): void; removeAttribute(name: string): void },
): void {
  const wanted = readingAttributes(prefs);
  for (const name of Object.values(READING_ATTRIBUTES)) {
    if (wanted[name] === undefined) root.removeAttribute(name);
    else root.setAttribute(name, wanted[name]);
  }
}

/** Reads whatever was stored, and keeps only values this version understands. */
export function migrateReading(raw: unknown): ReadingPrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_READING;
  const value = raw as Partial<ReadingPrefs>;
  return {
    contrast: CONTRASTS.includes(value.contrast as Contrast)
      ? (value.contrast as Contrast)
      : DEFAULT_READING.contrast,
    motion: MOTIONS.includes(value.motion as Motion)
      ? (value.motion as Motion)
      : DEFAULT_READING.motion,
    letters: LETTERS.includes(value.letters as Letters)
      ? (value.letters as Letters)
      : DEFAULT_READING.letters,
  };
}
