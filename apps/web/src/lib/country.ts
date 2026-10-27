import { ENABLED_LOCALES, localeData } from "@ninetothree/content";
import type { Country } from "@ninetothree/rules";

/**
 * Country is detected, not asked.
 *
 * A parent should not have to type something the device already knows, and a
 * wrong guess is one tap to fix. Detection is a guess, so it is always shown
 * as a guess and never written to the profile without the parent seeing it.
 *
 * The zone list is explicit rather than a `America/` prefix match, because
 * `America/Toronto` and `America/Mexico_City` are not the United States.
 */

const US_ZONES = new Set([
  "America/New_York",
  "America/Detroit",
  "America/Kentucky/Louisville",
  "America/Kentucky/Monticello",
  "America/Indiana/Indianapolis",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Vevay",
  "America/Indiana/Tell_City",
  "America/Indiana/Knox",
  "America/Chicago",
  "America/Menominee",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/North_Dakota/Beulah",
  "America/Denver",
  "America/Boise",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Juneau",
  "America/Sitka",
  "America/Metlakatla",
  "America/Yakutat",
  "America/Nome",
  "America/Adak",
  "America/Puerto_Rico",
  "America/St_Thomas",
  "Pacific/Honolulu",
  "Pacific/Guam",
  "Pacific/Saipan",
  "Pacific/Pago_Pago",
  "Pacific/Midway",
  "Pacific/Wake",
]);

const UK_ZONES = new Set([
  "Europe/London",
  "Europe/Belfast",
  "Europe/Guernsey",
  "Europe/Isle_of_Man",
  "Europe/Jersey",
]);

export function countryFromTimeZone(zone: string | undefined): Country | undefined {
  if (!zone) return undefined;
  if (UK_ZONES.has(zone)) return "UK";
  if (US_ZONES.has(zone)) return "US";
  return undefined;
}

export function countryFromLanguage(language: string | undefined): Country | undefined {
  if (!language) return undefined;
  const tag = language.toLowerCase();
  if (tag === "en-gb" || tag.startsWith("en-gb-")) return "UK";
  if (tag === "en-us" || tag.startsWith("en-us-")) return "US";
  return undefined;
}

/**
 * The time zone is the better signal — a parent in London with a US phone
 * still lives in London. The language is the fallback for a device that
 * reports no zone.
 */
export function detectCountry(): Country | undefined {
  if (typeof Intl === "undefined") return undefined;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fromZone = countryFromTimeZone(zone);
  if (fromZone) return fromZone;
  const language = typeof navigator === "undefined" ? undefined : navigator.language;
  return countryFromLanguage(language);
}

export function countryName(country: Country): string {
  return country === "US" ? "the United States" : "the United Kingdom";
}

/**
 * Whether we have a guide for this country. Reads the same list the
 * appointment schedule reads, so the two cannot drift apart.
 */
export function isCovered(country: Country | undefined): boolean {
  if (!country) return false;
  /* Read from the locale table rather than from a second hand-written map, so
     adding a market is one row in `LOCALES` and the country gate, the copy and
     the formatting all learn about it together. */
  return ENABLED_LOCALES.some((locale) => localeData(locale).market === country);
}
