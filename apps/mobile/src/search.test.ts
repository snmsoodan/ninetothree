import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LINKS } from "@ninetothree/content/link-registry";
import { PACKS } from "@ninetothree/content/registry";
import {
  SEARCH_HEADING,
  SEARCH_INTRO,
  SEARCH_KIND_LABEL,
  SEARCH_NOTHING,
  guideIndex,
} from "@ninetothree/domain";
import { SEARCH_LIMIT, searchModel } from "./search";

/**
 * Search, as data.
 *
 * The index this builds is the same index the web writes to
 * `apps/web/public/search-index.json`, so the first test compares the two id
 * lists. If the phone ever drifts from the web, that test is the alarm — and it
 * fails here rather than in a shop.
 */

const INDEX = guideIndex(PACKS, LINKS);

function model(query: string) {
  return searchModel({ docs: INDEX, query });
}

describe("the phone's index", () => {
  it("holds exactly what the web's generated index holds", () => {
    const generated: { id: string }[] = JSON.parse(
      readFileSync(resolve(process.cwd(), "../web/public/search-index.json"), "utf8"),
    );
    expect(INDEX.map((doc) => doc.id).sort()).toEqual(generated.map((doc) => doc.id).sort());
  });
});

describe("searchModel", () => {
  it("says what it is for before anything is typed", () => {
    const value = model("");
    expect(value.blank).toBe(true);
    expect(value.nothing).toBe(false);
    expect(value.rows).toEqual([]);
    expect(value.heading).toBe(SEARCH_HEADING);
    expect(value.intro).toBe(SEARCH_INTRO);
  });

  it("treats spaces as nothing typed", () => {
    expect(model("   ").blank).toBe(true);
  });

  it("finds a week by a word a parent would use", () => {
    const value = model("car seat");
    expect(value.blank).toBe(false);
    expect(value.nothing).toBe(false);
    expect(value.rows.length).toBeGreaterThan(0);
    expect(value.rows.length).toBeLessThanOrEqual(SEARCH_LIMIT);
    for (const row of value.rows) {
      expect(row.kindLabel).toBe(SEARCH_KIND_LABEL[row.kind as keyof typeof SEARCH_KIND_LABEL]);
      expect(row.line.length).toBeGreaterThan(0);
      expect(row.href.length).toBeGreaterThan(0);
    }
  });

  it("keeps every result a route the app can open", () => {
    const value = model("car seat");
    for (const row of value.rows) {
      expect(row.external).toBe(/^https?:\/\//.test(row.href));
      expect(row.href).not.toContain("#");
      expect(row.href.startsWith("/") || row.external).toBe(true);
    }
  });

  it("says nothing here rather than drawing an empty box", () => {
    const value = model("qzxqzxqzx");
    expect(value.nothing).toBe(true);
    expect(value.rows).toEqual([]);
    expect(value.nothingLine).toBe(SEARCH_NOTHING);
    expect(value.nothingHint.length).toBeGreaterThan(0);
  });

  it("keeps the query it was given, so the box does not reset", () => {
    expect(model("sleep").query).toBe("sleep");
  });
});
