import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

import { DIR, LANG, LOCALE, LOCALE_LABEL, dateFormat, formatDate } from "./i18n";

describe("the app's locale", () => {
  it("is the one the content package calls the default", () => {
    expect(LOCALE).toBe("en-US");
    expect(LANG).toBe("en-US");
    expect(DIR).toBe("ltr");
    expect(LOCALE_LABEL).toBe("English (United States)");
  });
});

describe("formatDate", () => {
  const cases: Intl.DateTimeFormatOptions[] = [
    { weekday: "short", month: "short", day: "numeric" },
    { month: "long", day: "numeric" },
    { day: "numeric", month: "long", year: "numeric" },
    { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" },
  ];

  it("prints exactly what the hard-coded tags printed", () => {
    /* The refactor's whole claim: seven components now ask a helper instead of
       typing "en-US", and a parent sees the same characters. Compared against
       the literal rather than against a string, so this holds in any timezone
       the test machine happens to be in. */
    for (const options of cases) {
      for (const iso of ["2026-11-20T12:00:00Z", "2027-01-01T00:30:00Z"]) {
        expect(formatDate(iso, options)).toBe(new Date(iso).toLocaleDateString("en-US", options));
      }
    }
  });

  it("reads a date-only string at noon, not at UTC midnight", () => {
    /* The reason the helper exists beyond naming. `new Date("2026-11-20")` is
       midnight UTC; a parent in California reading it would be told the 19th. */
    expect(formatDate("2026-11-20", { month: "short", day: "numeric" })).toBe("Nov 20");
    expect(formatDate("2026-11-20", { day: "numeric", month: "long", year: "numeric" })).toBe(
      "November 20, 2026",
    );
  });

  it("leaves a timestamp as an instant", () => {
    const date = new Date("2026-11-20T18:00:00Z");
    expect(formatDate(date, { month: "short", day: "numeric" })).toBe(
      new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date),
    );
  });

  it("reuses a formatter for the same options", () => {
    /* A shelf of twenty reminders used to build twenty formatters. */
    const options = { month: "short", day: "numeric" } as const;
    expect(dateFormat(options)).toBe(dateFormat({ ...options }));
    expect(dateFormat(options)).not.toBe(dateFormat({ month: "long" }));
  });
});

describe("locale literals", () => {
  const ALLOWED = new Set([
    /* Arithmetic on a clock: `Number()` would read Arabic-Indic digits as NaN. */
    join("lib", "email.ts"),
    /* The definition itself, and the doc comment above it. */
    join("lib", "i18n.ts"),
    /* Fixtures name a market on purpose: they are content, not presentation. */
    "test-fixtures.ts",
    join("components", "LinkCard.stories.tsx"),
    join("components", "WeekView.stories.tsx"),
  ]);

  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) return walk(path);
      return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry) ? [path] : [];
    });
  }

  it("only appear where they are meant to", () => {
    /* Adding a locale is a data change — but only if nothing has quietly
       hard-coded the old one back in. This is the test that keeps it true. */
    const offenders = walk(join(process.cwd(), "src"))
      .filter((path) => !ALLOWED.has(relative(join(process.cwd(), "src"), path)))
      .filter((path) => readFileSync(path, "utf8").includes('"en-US"'));
    expect(offenders).toEqual([]);
  });
});
