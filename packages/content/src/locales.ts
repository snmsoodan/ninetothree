/**
 * Every locale the product can speak, as data.
 *
 * Adding a language or a market is meant to be an edit to this table plus the
 * content files it names — not a code change. That is why `Locale` is derived
 * from the keys here rather than written out as a union somewhere: a new key
 * *is* the new type, and anything that must know about every locale (the
 * appointment schedules, the country gate) fails to compile until it has an
 * answer for the new one.
 *
 * Three fields carry the weight:
 *
 * `dir` is what `<html>` gets. It is per locale, not per language, because the
 * app cannot know better than the table.
 *
 * `intl` is the tag every date, number and currency in the app formats with.
 * A literal `"en-US"` at a call site is a locale that cannot be translated,
 * which is why none are left.
 *
 * `clinical` says whether a clinician has reviewed the guidance for that
 * market. It is deliberately not a boolean: "we have the words" and "a
 * midwife has read them" are different claims, and only the second one may
 * ever be shown to a pregnant person. A locale whose clinical content is not
 * reviewed is `enabled: false`, and `scheduleFor()` refuses it rather than
 * quietly handing a UK parent the American appointment schedule — a fallback
 * there would be a clinical claim nobody made.
 */

export interface LocaleData {
  /** The name of this locale, written in that locale. */
  label: string;
  /** Text direction for `<html dir>`. */
  dir: "ltr" | "rtl";
  /** The BCP 47 tag every `Intl` call uses. */
  intl: string;
  /** The market whose guidance and appointment schedule this locale carries. */
  market: "US" | "GB";
  /** Whether a clinician has reviewed the guidance for this market. */
  clinical: "reviewed" | "pending";
  /**
   * Whether a parent can reach it. A locale can be complete and still be off:
   * shipping is a decision, not a side effect of the table having a row.
   */
  enabled: boolean;
}

export const LOCALES = {
  "en-US": {
    label: "English (United States)",
    dir: "ltr",
    intl: "en-US",
    market: "US",
    clinical: "reviewed",
    enabled: true,
  },
  "en-GB": {
    label: "English (United Kingdom)",
    dir: "ltr",
    intl: "en-GB",
    market: "GB",
    clinical: "pending",
    enabled: false,
  },
  /**
   * Not shipped, and not a language we have written a word of. It is here for
   * one reason: an RTL locale has to exist in the table for the direction
   * plumbing to be real and testable rather than a field nobody has exercised.
   */
  "ar-EG": {
    label: "العربية (مصر)",
    dir: "rtl",
    intl: "ar-EG",
    market: "US",
    clinical: "pending",
    enabled: false,
  },
} as const satisfies Record<string, LocaleData>;

export type Locale = keyof typeof LOCALES;

/** The locale a first-time visitor gets. Change this line to change the app. */
export const DEFAULT_LOCALE: Locale = "en-US";

/** Everything a parent can actually reach today, derived from the table. */
export const ENABLED_LOCALES: Locale[] = (Object.keys(LOCALES) as Locale[]).filter(
  (locale) => LOCALES[locale].enabled,
);

export function localeData(locale: Locale): LocaleData {
  return LOCALES[locale];
}

/** Text direction, for `<html dir>`. */
export function dirFor(locale: Locale): LocaleData["dir"] {
  return LOCALES[locale].dir;
}

/** The tag every `Intl` call formats with. */
export function intlFor(locale: Locale): string {
  return LOCALES[locale].intl;
}
