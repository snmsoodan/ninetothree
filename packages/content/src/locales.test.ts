import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  ENABLED_LOCALES,
  LOCALES,
  dirFor,
  intlFor,
  localeData,
  type Locale,
} from "./locales";
import { SCHEDULES } from "./schedule";

const CODES = Object.keys(LOCALES) as Locale[];

describe("the locale table", () => {
  it("is the only place a locale is declared", () => {
    /* `Locale` is `keyof typeof LOCALES`, so a code that is not a row here
       cannot be passed to anything that takes a Locale. This asserts the other
       half: every row is a well-formed BCP 47 tag, so nothing silently formats
       dates in a language nobody speaks. */
    for (const code of CODES) {
      expect(code).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(localeData(code).intl).toBe(code);
    }
  });

  it("names itself in its own language", () => {
    for (const code of CODES) {
      expect(localeData(code).label.length).toBeGreaterThan(0);
    }
  });

  it("says which direction its text runs", () => {
    /* The reason an RTL row exists at all: a `dir` field with no RTL value is
       a field nobody has ever exercised. */
    expect(dirFor("en-US")).toBe("ltr");
    expect(dirFor("ar-EG")).toBe("rtl");
    expect(CODES.map(dirFor)).toContain("rtl");
  });

  it("keeps a locale out of reach until a clinician has read it", () => {
    for (const code of ENABLED_LOCALES) {
      expect(localeData(code).clinical).toBe("reviewed");
    }
    /* And the converse, which is the one that would hurt: nothing is shipping
       that nobody reviewed. */
    for (const code of CODES) {
      if (localeData(code).clinical !== "reviewed") expect(localeData(code).enabled).toBe(false);
    }
  });

  it("refuses to enable a locale with no reviewed schedule", () => {
    for (const code of ENABLED_LOCALES) {
      expect(SCHEDULES[code]).toBeDefined();
      expect(SCHEDULES[code]!.locale).toBe(code);
    }
  });

  it("has a default that is actually reachable", () => {
    expect(ENABLED_LOCALES).toContain(DEFAULT_LOCALE);
    expect(localeData(DEFAULT_LOCALE).enabled).toBe(true);
  });

  it("formats with the locale's own tag", () => {
    expect(intlFor("en-US")).toBe("en-US");
    expect(intlFor("en-GB")).toBe("en-GB");
    /* The difference a tag makes, in one assertion: the same date, two
       markets, and no call site had to know. */
    const date = new Date("2026-11-20T12:00:00Z");
    const options = { day: "numeric", month: "long", year: "numeric" } as const;
    expect(new Intl.DateTimeFormat(intlFor("en-US"), options).format(date)).toBe(
      "November 20, 2026",
    );
    expect(new Intl.DateTimeFormat(intlFor("en-GB"), options).format(date)).toBe(
      "20 November 2026",
    );
  });

  it("adds a locale without touching code", () => {
    /* The acceptance criterion, stated as a test. Every question the app asks
       of a locale is answered by these four fields, and all four are data. */
    const questions = (code: Locale) => [
      typeof localeData(code).label,
      dirFor(code),
      intlFor(code),
      typeof localeData(code).enabled,
    ];
    for (const code of CODES) {
      expect(questions(code)).toEqual(["string", dirFor(code), code, "boolean"]);
    }
  });
});
