import {
  DEFAULT_LOCALE,
  dirFor,
  intlFor,
  localeData,
  type Locale,
} from "@ninetothree/content/core";

/**
 * Which language this build speaks, and the formatting that follows from it.
 *
 * One locale for now, and no URL routing: a parent in Ohio and a parent in
 * Leeds read the same English, and inventing `/en-US/...` paths to say so
 * would put a segment in every link, every test and every saved bookmark in
 * exchange for nothing. When a second *language* ships, the locale moves into
 * the URL and this module is where that decision gets made.
 *
 * The point of the module is the other direction: every call site asks here
 * instead of typing `"en-US"`. A literal tag in a component is a component
 * that cannot be translated, and there were seven of them.
 */
export const LOCALE: Locale = DEFAULT_LOCALE;

/** For `<html lang>`. */
export const LANG = intlFor(LOCALE);

/** For `<html dir>`. */
export const DIR = dirFor(LOCALE);

/** The locale's own name, for a language picker that does not exist yet. */
export const LOCALE_LABEL = localeData(LOCALE).label;

/*
 * `Intl` formatters are not cheap to construct and these run inside render
 * loops — a shelf of twenty reminders built twenty formatters before this
 * cache existed. Options are the key, and there are only a handful.
 */
const cache = new Map<string, Intl.DateTimeFormat>();

/** A date formatter for this locale. Options are the cache key. */
export function dateFormat(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(LANG, options);
    cache.set(key, formatter);
  }
  return formatter;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A date, formatted for this locale.
 *
 * A date-only string ("2026-11-20") is read at local noon, because `new Date`
 * would read it at UTC midnight and a parent west of UTC would be shown the
 * day before. A full timestamp is left alone: it names an instant, and the
 * instant is what the caller meant.
 */
export function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions): string {
  const date =
    typeof value === "string"
      ? new Date(DATE_ONLY.test(value) ? `${value}T12:00:00` : value)
      : value;
  return dateFormat(options).format(date);
}
