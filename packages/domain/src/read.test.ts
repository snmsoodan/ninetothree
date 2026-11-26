import { describe, expect, it } from "vitest";
import type { Article } from "@ninetothree/content";
import {
  articleBlocks,
  articleView,
  formatReviewDate,
  plainInline,
  readIndex,
  relatedActions,
  reviewLine,
  sourceLine,
} from "./read";

const article = {
  id: "the-glucose-test",
  title: "The glucose test",
  summary: "What it measures, and what happens if you fail it.",
  domain: "body",
  stages: { from: "pregnancy-w24", to: "pregnancy-w28" },
  relatedActions: ["w24-glucose", "retired-step"],
  sources: [
    {
      id: "acog",
      title: "Screening for gestational diabetes",
      publisher: "ACOG",
      url: "https://example.com/acog",
      kind: "clinical",
      accessedAt: "2026-09-01",
    },
  ],
  reviewedBy: "A midwife",
  reviewedAt: "2026-09-15",
  updatedAt: "2026-10-01",
  body: "## What it measures\n\nIt measures **how your body handles sugar**.\n\n- One hour\n- One blood draw\n\n1. Fast\n2. Drink\n",
} as unknown as Article;

const find = (id: string) =>
  id === "w24-glucose"
    ? {
        pack: { id: "pregnancy-w24", title: "Week 24" },
        action: { id: "w24-glucose", title: "Book your glucose screening" },
      }
    : undefined;

describe("plainInline", () => {
  it("keeps the words and drops the emphasis", () => {
    expect(plainInline("It measures **how your body** handles sugar.")).toBe(
      "It measures how your body handles sugar.",
    );
  });

  it("unwraps a link to its label", () => {
    expect(plainInline("Read [the guidance](https://example.com) first.")).toBe(
      "Read the guidance first.",
    );
  });

  it("leaves single underscores inside words alone", () => {
    expect(plainInline("a snake_case name")).toBe("a snake_case name");
  });
});

describe("articleBlocks", () => {
  it("splits headings, paragraphs and both kinds of list", () => {
    expect(articleBlocks(article.body)).toEqual([
      { kind: "heading", level: 2, text: "What it measures" },
      { kind: "paragraph", text: "It measures how your body handles sugar." },
      { kind: "list", ordered: false, items: ["One hour", "One blood draw"] },
      { kind: "list", ordered: true, items: ["Fast", "Drink"] },
    ]);
  });

  it("joins a wrapped paragraph into one block", () => {
    expect(articleBlocks("A sentence\nthat wraps.")).toEqual([
      { kind: "paragraph", text: "A sentence that wraps." },
    ]);
  });

  it("treats a level-three heading as a heading", () => {
    expect(articleBlocks("### A smaller heading")).toEqual([
      { kind: "heading", level: 3, text: "A smaller heading" },
    ]);
  });

  it("does not treat a single hash as a heading", () => {
    expect(articleBlocks("# Not a body heading")).toEqual([
      { kind: "paragraph", text: "# Not a body heading" },
    ]);
  });

  it("is empty for an empty body", () => {
    expect(articleBlocks("\n\n")).toEqual([]);
  });
});

describe("formatReviewDate", () => {
  it("carries the year", () => {
    expect(formatReviewDate("2026-09-15")).toBe("September 15, 2026");
  });

  it("falls back to the raw month when it cannot parse one", () => {
    expect(formatReviewDate("2026-13-01")).toBe("13 1, 2026");
  });
});

describe("sourceLine", () => {
  it("says one source, not one sources", () => {
    expect(sourceLine(1)).toBe("1 source");
    expect(sourceLine(4)).toBe("4 sources");
    expect(sourceLine(0)).toBe("0 sources");
  });
});

describe("reviewLine", () => {
  it("states who, when it was reviewed and when it changed", () => {
    expect(reviewLine("A midwife", "2026-09-15", "2026-10-01")).toBe(
      "Reviewed by A midwife on September 15, 2026. Last changed October 1, 2026.",
    );
  });
});

describe("relatedActions", () => {
  it("keeps a live action and drops an id that no longer exists", () => {
    expect(relatedActions(article, find)).toEqual([
      {
        id: "w24-glucose",
        title: "Book your glucose screening",
        packTitle: "Week 24",
        href: "/week/pregnancy-w24#w24-glucose-title",
      },
    ]);
  });

  it("is empty when an article has no related steps", () => {
    expect(relatedActions({ ...article, relatedActions: undefined }, find)).toEqual([]);
  });
});

describe("readIndex", () => {
  it("gives each article its href and source count", () => {
    expect(readIndex([article])).toEqual([
      {
        id: "the-glucose-test",
        title: "The glucose test",
        summary: "What it measures, and what happens if you fail it.",
        href: "/read/the-glucose-test",
        sourceLine: "1 source",
      },
    ]);
  });
});

describe("articleView", () => {
  it("carries the body as blocks, the related step and the review facts", () => {
    const view = articleView(article, find);
    expect(view.blocks).toHaveLength(4);
    expect(view.related.map((action) => action.id)).toEqual(["w24-glucose"]);
    expect(view.sourceMeta).toEqual(["ACOG, Clinical"]);
    expect(view.reviewLine).toContain("A midwife");
    expect(view.crisis).toBe(false);
  });

  it("carries the crisis numbers on a page about how a parent feels", () => {
    expect(articleView({ ...article, domain: "mind" }, find).crisis).toBe(true);
  });
});
