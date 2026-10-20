import { describe, expect, it } from "vitest";
import {
  articleHref,
  articleProse,
  articlesForAction,
  articlesForStage,
  assertValidArticles,
  loadArticles,
} from "./articles";
import { ARTICLES, ARTICLES_BY_ID, getArticle } from "./article-registry";
import { findAction } from "./loader";
import { PACKS } from "./registry";

const SOURCE = {
  id: "src-one",
  title: "A source",
  publisher: "A publisher",
  url: "https://example.com/a",
  kind: "clinical" as const,
  accessed: "2026-10-20",
};

function article(overrides: Record<string, unknown> = {}) {
  return {
    id: "a-test-article",
    title: "A test article",
    summary: "One sentence about the thing.",
    domain: "health-parent",
    stages: { from: { kind: "pregnancy", index: 28 }, to: { kind: "pregnancy", index: 28 } },
    sources: [SOURCE],
    reviewedBy: "Clinical review pending",
    reviewedAt: "2026-10-20",
    updatedAt: "2026-10-20",
    body: "## A heading\n\nA paragraph.",
    ...overrides,
  };
}

describe("the article schema", () => {
  it("accepts a complete article", () => {
    const { articles, issues } = loadArticles([article()]);
    expect(issues).toEqual([]);
    expect(articles).toHaveLength(1);
  });

  it("refuses an article with no source", () => {
    const { issues } = loadArticles([article({ sources: [] })]);
    expect(issues.map((i) => i.path)).toContain("sources");
  });

  it("refuses an article with no review date", () => {
    const { issues } = loadArticles([article({ reviewedAt: undefined })]);
    expect(issues.map((i) => i.path)).toContain("reviewedAt");
  });

  it("refuses a review date that is not a date", () => {
    const { issues } = loadArticles([article({ reviewedAt: "20 October" })]);
    expect(issues.map((i) => i.path)).toContain("reviewedAt");
  });

  it("refuses an id that is not kebab-case", () => {
    const { issues } = loadArticles([article({ id: "Not Kebab" })]);
    expect(issues.map((i) => i.path)).toContain("id");
  });

  it("refuses an id shorter than three characters", () => {
    const { issues } = loadArticles([article({ id: "ab" })]);
    expect(issues.map((i) => i.path)).toContain("id");
  });

  it("refuses a stage range that runs backwards", () => {
    const { issues } = loadArticles([
      article({
        stages: { from: { kind: "toddler", index: 30 }, to: { kind: "pregnancy", index: 8 } },
      }),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("stages");
    expect(issues[0]?.message).toBe("a stage range cannot run backwards");
  });

  it("refuses more than six related actions", () => {
    const { issues } = loadArticles([
      article({ relatedActions: ["a", "b", "c", "d", "e", "f", "g"] }),
    ]);
    expect(issues.map((i) => i.path)).toContain("relatedActions");
  });

  it("refuses an empty body", () => {
    const { issues } = loadArticles([article({ body: "" })]);
    expect(issues.map((i) => i.path)).toContain("body");
  });

  it("names the article it could not read, and says so when it has no id", () => {
    const { issues } = loadArticles([article({ id: "broken", title: "" }), { title: "no id" }]);
    expect([...new Set(issues.map((i) => i.articleId))]).toEqual(["broken", "(no id)"]);
  });

  it("names a root-level problem when the entry is not an object at all", () => {
    const { issues } = loadArticles(["not an article"]);
    expect(issues[0]?.articleId).toBe("(no id)");
    expect(issues[0]?.path).toBe("(root)");
  });

  it("refuses two articles with the same id, and keeps the first", () => {
    const { articles, issues } = loadArticles([article(), article({ title: "A second title" })]);
    expect(articles).toHaveLength(1);
    expect(articles[0]?.title).toBe("A test article");
    expect(issues).toEqual([
      { articleId: "a-test-article", path: "id", message: "two articles share this id" },
    ]);
  });

  it("throws with every problem listed, not just the first", () => {
    expect(() => assertValidArticles([article({ sources: [] }), article({ id: "x" })])).toThrow(
      /Invalid articles:[\s\S]*sources[\s\S]*id/,
    );
  });

  it("returns the articles when they are all valid", () => {
    expect(assertValidArticles([article()])).toHaveLength(1);
  });
});

describe("articleProse", () => {
  it("takes the heading markers out", () => {
    expect(articleProse("## A heading")).toBe("A heading");
  });

  it("keeps the words of a link and drops the URL", () => {
    expect(articleProse("See [the guidance](https://example.com/a-long-url) for more.")).toBe(
      "See the guidance for more.",
    );
  });

  it("drops an image entirely", () => {
    expect(articleProse("Before ![a chart](https://example.com/c.png) after")).toBe("Before after");
  });

  it("drops inline code and fenced code", () => {
    expect(articleProse("Run `npm test` now")).toBe("Run now");
    expect(articleProse("Text\n\n```js\nconst a = 1;\n```\n\nMore")).toBe("Text More");
  });

  it("drops HTML tags", () => {
    expect(articleProse("A <br/> line")).toBe("A line");
  });

  it("drops blockquote and list markers", () => {
    expect(articleProse("> A quote")).toBe("A quote");
    expect(articleProse("- one\n- two")).toBe("one two");
    expect(articleProse("1. one\n2. two")).toBe("one two");
  });

  it("keeps the words inside emphasis", () => {
    expect(articleProse("**bold** and *italic* and ***both***")).toBe("bold and italic and both");
  });

  it("collapses whitespace and trims", () => {
    expect(articleProse("\n\n  a   b  \n\n")).toBe("a b");
  });
});

describe("articlesForStage", () => {
  const wide = assertValidArticles([
    article({
      id: "wide",
      stages: { from: { kind: "pregnancy", index: 20 }, to: { kind: "infant", index: 6 } },
    }),
    article({
      id: "narrow",
      stages: { from: { kind: "pregnancy", index: 28 }, to: { kind: "pregnancy", index: 28 } },
    }),
  ]);

  it("includes an article at the start of its window", () => {
    expect(articlesForStage(wide, "pregnancy", 20).map((a) => a.id)).toEqual(["wide"]);
  });

  it("includes an article at the end of its window", () => {
    expect(articlesForStage(wide, "infant", 6).map((a) => a.id)).toEqual(["wide"]);
  });

  it("includes an article in the middle of its window", () => {
    expect(articlesForStage(wide, "pregnancy", 28).map((a) => a.id)).toEqual(["wide", "narrow"]);
  });

  it("excludes an article before its window", () => {
    expect(articlesForStage(wide, "pregnancy", 8)).toEqual([]);
  });

  it("excludes an article after its window", () => {
    expect(articlesForStage(wide, "infant", 7)).toEqual([]);
  });
});

describe("articlesForAction", () => {
  const withActions = assertValidArticles([
    article({ id: "one", relatedActions: ["w28-glucose"] }),
    article({ id: "two", relatedActions: ["w28-glucose", "w36-car-seat"] }),
    article({ id: "three" }),
  ]);

  it("finds every article that explains a step", () => {
    expect(articlesForAction(withActions, "w28-glucose").map((a) => a.id)).toEqual(["one", "two"]);
  });

  it("finds nothing for a step no article explains", () => {
    expect(articlesForAction(withActions, "w8-dental")).toEqual([]);
  });

  it("does not fall over on an article with no related actions", () => {
    expect(articlesForAction(withActions, "w36-car-seat").map((a) => a.id)).toEqual(["two"]);
  });
});

describe("articleHref", () => {
  it("is the read route for the id", () => {
    expect(articleHref(assertValidArticles([article({ id: "glucose-test" })])[0]!)).toBe(
      "/read/glucose-test",
    );
  });
});

describe("the shipped articles", () => {
  it("are all valid", () => {
    expect(ARTICLES.length).toBeGreaterThan(0);
    expect(ARTICLES_BY_ID.size).toBe(ARTICLES.length);
  });

  it("each have at least one source and a review date", () => {
    for (const a of ARTICLES) {
      expect(a.sources.length, a.id).toBeGreaterThan(0);
      expect(a.reviewedAt, a.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.updatedAt, a.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("each point at a step that exists in a pack", () => {
    const ids = ARTICLES.flatMap((a) => a.relatedActions ?? []);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(findAction(PACKS, id), `${id} is not a step in any pack`).toBeDefined();
    }
  });

  it("are found by id, and a miss is undefined", () => {
    expect(getArticle("glucose-test")?.id).toBe("glucose-test");
    expect(getArticle("no-such-article")).toBeUndefined();
  });
});
