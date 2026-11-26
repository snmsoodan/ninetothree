import { describe, expect, it } from "vitest";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { readArticleView, readIndexView } from "./read";

const MIND = ARTICLES.find((article) => article.domain === "mind")!;
const ANY = ARTICLES[0]!;

describe("readIndexView", () => {
  it("lists every article with its href and source line", () => {
    const model = readIndexView();
    expect(model.rows.length).toBe(ARTICLES.length);
    expect(model.rows[0]!.href).toBe(`/read/${ARTICLES[0]!.id}`);
    expect(model.rows[0]!.sourceLine).toMatch(/source/);
  });
});

describe("readArticleView", () => {
  it("parses the body into blocks without markdown punctuation", () => {
    const model = readArticleView(ANY.id);
    expect(model.found).toBe(true);
    if (!model.found) return;
    expect(model.blocks.length).toBeGreaterThan(3);
    expect(model.blocks.some((block) => block.kind === "heading")).toBe(true);
    expect(JSON.stringify(model.blocks)).not.toContain("**");
  });

  it("keeps the review line and every source with a publisher", () => {
    const model = readArticleView(ANY.id);
    if (!model.found) throw new Error("article missing");
    expect(model.reviewLine).toBeTruthy();
    expect(model.sources.length).toBe(ANY.sources.length);
    expect(model.sources[0]!.url).toMatch(/^https:\/\//);
  });

  it("carries both numbers on a mind article and neither otherwise", () => {
    const mind = readArticleView(MIND.id);
    const other = readArticleView(
      ANY.domain === "mind" ? ARTICLES.find((a) => a.domain !== "mind")!.id : ANY.id,
    );
    if (!mind.found || !other.found) throw new Error("article missing");
    expect(mind.crisis).toBe(true);
    expect(mind.crisisNumber).toBe("988");
    expect(mind.supportNumber).toBeTruthy();
    expect(other.crisis).toBe(false);
  });

  it("links a related action back to its step", () => {
    const model = readArticleView(ANY.id);
    if (!model.found) throw new Error("article missing");
    for (const related of model.related) {
      expect(related.href).toMatch(/^\/week\/.+#/);
    }
  });

  it("says not found rather than inventing an article", () => {
    const model = readArticleView("no-such-article");
    expect(model.found).toBe(false);
    expect(model.title).toBe("Not found");
  });
});
