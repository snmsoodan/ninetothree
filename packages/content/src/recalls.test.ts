import { describe, expect, it } from "vitest";

import { findAction } from "./loader";
import { PACKS } from "./registry";
import type { Source } from "./schema";
import {
  RECALL_BECAUSES,
  RECALL_CATEGORIES,
  RECALL_SEVERITIES,
  Recall,
  ageWindowLabel,
  assertValidRecalls,
  isForAge,
  loadRecalls,
  matchRecalls,
  mergeRecalls,
  recallIssues,
  recallKey,
  recallsForAge,
  sameRecall,
  type RecallMatch,
  type RecallSubject,
} from "./recalls";
import { RECALLS, getRecall, loadRecallFeed } from "./recall-registry";

const TODAY = "2026-10-20";

function source(id = "s1"): Source {
  return {
    id,
    title: "A recall notice",
    publisher: "US Consumer Product Safety Commission",
    url: "https://www.cpsc.gov/Recalls/2026/a-recall",
    kind: "government",
    accessed: TODAY,
  };
}

type RecallOver = Partial<Omit<Recall, "matches">> & {
  id: string;
  matches?: Partial<Recall["matches"]>;
};

/**
 * A recall with every field filled in, so a test only writes the part it is
 * about. The three match arrays are always present because the schema defaults
 * them, and a test that names one of them should not have to name the other two.
 *
 * A test that names `matches` replaces the default outright. Merging would mean
 * a fixture about a keyword still carried the default step, and the step is the
 * stronger reason, so the test would silently assert the wrong thing.
 */
function recall(over: RecallOver): Recall {
  const { matches, ...rest } = over;
  return {
    title: "A thing was recalled",
    product: "The thing",
    hazard: "It can break.",
    action: "Stop using it and ask for a refund.",
    severity: "stop-use",
    category: "sleep",
    ages: { fromMonths: 0, toMonths: 12 },
    publishedAt: "2026-01-01",
    source: source(),
    matches: matches
      ? { optionIds: [], actionIds: [], keywords: [], ...matches }
      : { optionIds: [], actionIds: ["a-step"], keywords: [] },
    ...rest,
  } as Recall;
}

/** A second source, so two fixtures do not collide on the URL alone. */
function otherSource(id = "s2"): Source {
  return {
    ...source(id),
    url: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts/b",
  };
}

function subject(over: Partial<RecallSubject> = {}): RecallSubject {
  return { choices: {}, pins: [], ...over };
}

describe("the shipped feed", () => {
  it("holds the recalls we wrote", () => {
    expect(RECALLS).toHaveLength(9);
  });

  it("has no structural problems", () => {
    expect(recallIssues(RECALLS, TODAY)).toEqual([]);
  });

  it("names a step that exists in the guide, every time", () => {
    for (const entry of RECALLS) {
      for (const actionId of entry.matches.actionIds ?? []) {
        expect(findAction(PACKS, actionId), `${entry.id} names ${actionId}`).toBeDefined();
      }
    }
  });

  it("is all stop-use, because a seed feed should not carry anything softer", () => {
    expect(RECALLS.every((r) => r.severity === "stop-use")).toBe(true);
  });

  it("cites the agency, not a blog", () => {
    for (const entry of RECALLS) {
      expect(entry.source.kind).toBe("government");
      expect(entry.source.url).toMatch(
        /^https:\/\/(www\.cpsc\.gov\/Recalls\/|www\.fda\.gov\/safety\/|api\.nhtsa\.gov\/recalls\/)/,
      );
    }
  });

  it("covers more than the cot and the car", () => {
    const categories = new Set(RECALLS.map((r) => r.category));
    for (const wanted of ["sleep", "feeding", "food", "travel"]) {
      expect(categories.has(wanted as never), `no recall about ${wanted}`).toBe(true);
    }
  });

  it("gives every recall an age window a parent can read", () => {
    for (const entry of RECALLS) {
      expect(entry.ages.fromMonths).toBeLessThanOrEqual(entry.ages.toMonths);
      expect(ageWindowLabel(entry.ages)).toMatch(/^(Before birth|[A-Z0-9].* to .*)$/);
    }
  });

  it("is reachable by id", () => {
    expect(getRecall("cpsc-26290")?.product).toContain("Bicystar");
    expect(getRecall("nope")).toBeUndefined();
  });

  it("loads through the same gate as everything else", () => {
    expect(loadRecallFeed(TODAY)).toHaveLength(9);
  });
});

describe("recallIssues", () => {
  it("says nothing about a clean feed", () => {
    expect(recallIssues([recall({ id: "one" }), recall({ id: "two" })], TODAY)).toEqual([]);
  });

  it("catches two recalls with the same id", () => {
    const issues = recallIssues([recall({ id: "same" }), recall({ id: "same" })], TODAY);
    expect(issues).toEqual([
      { recallId: "same", path: "id", message: "two recalls share this id" },
    ]);
  });

  it("catches a publish date in the future", () => {
    const issues = recallIssues([recall({ id: "later", publishedAt: "2027-01-01" })], TODAY);
    expect(issues).toEqual([
      {
        recallId: "later",
        path: "publishedAt",
        message: "published 2027-01-01, which is in the future",
      },
    ]);
  });

  it("allows a recall published today", () => {
    expect(recallIssues([recall({ id: "now", publishedAt: TODAY })], TODAY)).toEqual([]);
  });
});

describe("loadRecalls", () => {
  it("keeps the good ones and reports the bad ones", () => {
    const { recalls, issues } = loadRecalls([recall({ id: "good" }), { id: "bad" }]);
    expect(recalls.map((r) => r.id)).toEqual(["good"]);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((i) => i.recallId === "bad")).toBe(true);
  });

  it("names an entry that has no id at all by its position", () => {
    const { issues } = loadRecalls([{ title: "no id" }]);
    expect(issues[0]?.recallId).toBe("(recall 0)");
  });

  it("names a null entry by its position", () => {
    const { issues } = loadRecalls([null]);
    expect(issues[0]?.recallId).toBe("(recall 0)");
  });

  it("reports a root-level problem as (root)", () => {
    const { issues } = loadRecalls(["not a recall"]);
    expect(issues[0]?.path).toBe("(root)");
  });

  it("refuses a severity we do not have", () => {
    const { issues } = loadRecalls([{ ...recall({ id: "odd" }), severity: "panic" }]);
    expect(issues.some((i) => i.path === "severity")).toBe(true);
  });

  it("accepts a recall that matches nothing", () => {
    // The age window is a legitimate way to reach a parent, and every recall
    // that comes off a live register has no curated matches at all. An empty
    // `matches` is not a mistake, it is the normal shape of a live record.
    const { issues } = loadRecalls([{ ...recall({ id: "empty" }), matches: {} }]);
    expect(issues).toEqual([]);
  });

  it("defaults a missing matches to empty", () => {
    const bare = recall({ id: "bare" });
    delete (bare as { matches?: unknown }).matches;
    const { recalls, issues } = loadRecalls([bare]);
    expect(issues).toEqual([]);
    expect(recalls[0]?.matches).toEqual({ optionIds: [], actionIds: [], keywords: [] });
  });

  it("refuses an id that is not kebab-case", () => {
    const { issues } = loadRecalls([recall({ id: "Not Kebab" })]);
    expect(issues.some((i) => i.path === "id")).toBe(true);
  });
});

describe("assertValidRecalls", () => {
  it("returns the feed when it is sound", () => {
    expect(assertValidRecalls([recall({ id: "fine" })], TODAY)).toHaveLength(1);
  });

  it("throws with the id and the path when it is not", () => {
    expect(() => assertValidRecalls([{ id: "broken" }], TODAY)).toThrow(/broken → /);
  });

  it("throws on a duplicate id", () => {
    expect(() =>
      assertValidRecalls([recall({ id: "twice" }), recall({ id: "twice" })], TODAY),
    ).toThrow(/two recalls share this id/);
  });
});

describe("matchRecalls", () => {
  it("says nothing when the parent has nothing", () => {
    expect(matchRecalls([recall({ id: "one" })], subject())).toEqual([]);
  });

  it("matches a step the parent pinned", () => {
    const matches = matchRecalls(
      [recall({ id: "one", matches: { actionIds: ["a-step"] } })],
      subject({ pins: [{ id: "a-step", title: "A step" }] }),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]?.because).toBe("step");
    expect(matches[0]?.matchedOn).toBe("a-step");
  });

  it("matches an option the parent chose", () => {
    const matches = matchRecalls(
      [recall({ id: "one", matches: { optionIds: ["a-chair"] } })],
      subject({ choices: { "a-step": { optionId: "a-chair" } } }),
    );
    expect(matches[0]?.because).toBe("option");
    expect(matches[0]?.matchedOn).toBe("a-chair");
  });

  it("matches a word in the title of a pinned step, whatever the case", () => {
    const matches = matchRecalls(
      [recall({ id: "one", matches: { keywords: ["High Chair"] } })],
      subject({ pins: [{ id: "a-step", title: "Get a high chair" }] }),
    );
    expect(matches[0]?.because).toBe("keyword");
    expect(matches[0]?.matchedOn).toBe("High Chair");
  });

  it("does not match a keyword that is not in any pinned title", () => {
    expect(
      matchRecalls(
        [recall({ id: "one", matches: { keywords: ["stroller"] } })],
        subject({ pins: [{ id: "a-step", title: "Get a high chair" }] }),
      ),
    ).toEqual([]);
  });

  it("reports one match per recall, with the strongest reason", () => {
    const matches = matchRecalls(
      [
        recall({
          id: "one",
          matches: { optionIds: ["a-chair"], actionIds: ["a-step"], keywords: ["chair"] },
        }),
      ],
      subject({
        choices: { "a-step": { optionId: "a-chair" } },
        pins: [{ id: "a-step", title: "Get a chair" }],
      }),
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]?.because).toBe("option");
  });

  it("prefers a step over a keyword", () => {
    const matches = matchRecalls(
      [recall({ id: "one", matches: { actionIds: ["a-step"], keywords: ["chair"] } })],
      subject({ pins: [{ id: "a-step", title: "Get a chair" }] }),
    );
    expect(matches[0]?.because).toBe("step");
  });

  it("puts the newest recall first", () => {
    const matches = matchRecalls(
      [
        recall({ id: "older", publishedAt: "2025-01-01" }),
        recall({ id: "newer", publishedAt: "2026-01-01" }),
      ],
      subject({ pins: [{ id: "a-step", title: "A step" }] }),
    );
    expect(matches.map((m) => m.recall.id)).toEqual(["newer", "older"]);
  });

  it("matches every recall that is about something the parent has", () => {
    const matches = matchRecalls(
      [recall({ id: "one" }), recall({ id: "two" }), recall({ id: "three" })],
      subject({ pins: [{ id: "a-step", title: "A step" }] }),
    );
    expect(matches).toHaveLength(3);
  });
});

describe("recallKey", () => {
  it("carries the reason as well as the recall", () => {
    const match: RecallMatch = {
      recall: recall({ id: "one" }),
      because: "step",
      matchedOn: "a-step",
    };
    expect(recallKey(match)).toBe("one:a-step");
  });

  it("gives two reasons for the same recall two keys", () => {
    const base = recall({ id: "one" });
    const step: RecallMatch = { recall: base, because: "step", matchedOn: "a-step" };
    const option: RecallMatch = { recall: base, because: "option", matchedOn: "a-chair" };
    expect(recallKey(step)).not.toBe(recallKey(option));
  });
});

describe("the vocabulary", () => {
  it("has three severities and three reasons", () => {
    expect(RECALL_SEVERITIES).toEqual(["stop-use", "check", "info"]);
    expect(RECALL_BECAUSES).toEqual(["option", "step", "keyword"]);
  });

  it("parses a recall through the schema", () => {
    expect(Recall.parse(recall({ id: "parsed" })).id).toBe("parsed");
  });
});

describe("the age window", () => {
  it("covers both ends and nothing outside them", () => {
    const one = recall({ id: "window", ages: { fromMonths: 6, toMonths: 12 } });
    expect(isForAge(one, 5)).toBe(false);
    expect(isForAge(one, 6)).toBe(true);
    expect(isForAge(one, 12)).toBe(true);
    expect(isForAge(one, 13)).toBe(false);
  });

  it("treats negative months as before the birth", () => {
    const before = recall({ id: "before", ages: { fromMonths: -9, toMonths: 0 } });
    expect(isForAge(before, -3)).toBe(true);
    expect(isForAge(before, 1)).toBe(false);
  });

  it("puts the serious ones first, then the newest", () => {
    const feed = [
      recall({ id: "info-new", severity: "info", publishedAt: "2026-05-01" }),
      recall({ id: "stop-old", severity: "stop-use", publishedAt: "2025-01-01" }),
      recall({ id: "stop-new", severity: "stop-use", publishedAt: "2026-05-01" }),
    ];
    expect(recallsForAge(feed, 6).map((r) => r.id)).toEqual(["stop-new", "stop-old", "info-new"]);
  });

  it("drops what is not for this age", () => {
    const feed = [
      recall({ id: "tiny", ages: { fromMonths: 0, toMonths: 3 } }),
      recall({ id: "big", ages: { fromMonths: 24, toMonths: 36 } }),
    ];
    expect(recallsForAge(feed, 30).map((r) => r.id)).toEqual(["big"]);
  });

  it("writes the window in words a parent reads once", () => {
    expect(ageWindowLabel({ fromMonths: -9, toMonths: 0 })).toBe("Before birth");
    expect(ageWindowLabel({ fromMonths: -9, toMonths: 12 })).toBe("Birth to 12 months");
    expect(ageWindowLabel({ fromMonths: 6, toMonths: 36 })).toBe("6 months to 3 years");
    expect(ageWindowLabel({ fromMonths: 6, toMonths: 12 })).toBe("6 months to 12 months");
  });

  it("refuses a window that ends before it starts", () => {
    const parsed = Recall.safeParse(
      recall({ id: "backwards", ages: { fromMonths: 12, toMonths: 6 } }),
    );
    expect(parsed.success).toBe(false);
  });
});

describe("the vocabulary", () => {
  it("names every category the schema allows", () => {
    for (const category of RECALL_CATEGORIES) {
      expect(recall({ id: "cat", category }).category).toBe(category);
    }
  });
});

describe("sameRecall", () => {
  it("knows an entry by its id", () => {
    expect(sameRecall(recall({ id: "one" }), recall({ id: "one" }))).toBe(true);
  });

  it("knows an entry by the register page it points at", () => {
    // A curated entry and the record it was written from rarely share an id:
    // one was hand-written before the feed existed. The URL is the same.
    const curated = recall({ id: "hand-written" });
    const live = recall({
      id: "cpsc-26099",
      product: "Something else entirely",
      source: { ...source("s2"), url: curated.source.url },
    });
    expect(sameRecall(curated, live)).toBe(true);
  });

  it("knows an entry by the second address the curator listed", () => {
    // The FDA writes a recall notice and files the same event in its
    // enforcement database, which is a different URL for the same recall.
    const enforcement = "https://www.accessdata.fda.gov/enforcement?id=99448";
    const curated = recall({ id: "hand-written", alsoAt: [enforcement] });
    const live = recall({
      id: "fda-h-1223-2026",
      product: "Something else entirely",
      source: { ...source("s2"), url: enforcement },
    });
    expect(sameRecall(curated, live)).toBe(true);
    expect(sameRecall(live, curated)).toBe(true);
  });

  it("knows an entry by the product it names, whatever the wording", () => {
    const curated = recall({ id: "a", product: "The CooCooBaby lounger" });
    const live = recall({ id: "b", product: "CooCooBaby baby loungers" });
    expect(sameRecall(curated, live)).toBe(true);
  });

  it("does not merge two different products", () => {
    expect(
      sameRecall(
        recall({ id: "a", product: "Graco car seat" }),
        recall({ id: "b", product: "Graco stroller", source: otherSource() }),
      ),
    ).toBe(false);
  });

  it("does not merge two products that are both only filler words", () => {
    expect(
      sameRecall(
        recall({ id: "a", product: "Baby" }),
        recall({ id: "b", product: "The infant", source: otherSource() }),
      ),
    ).toBe(false);
  });
});

describe("mergeRecalls", () => {
  it("keeps the curated entry when the register publishes the same recall", () => {
    const curated = recall({ id: "cpsc-26099" });
    const live = recall({ id: "cpsc-26099", action: "Return it to the store." });
    const merged = mergeRecalls([curated], [live]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.action).toBe(curated.action);
  });

  it("adds what the curated list does not have", () => {
    const merged = mergeRecalls(
      [recall({ id: "curated" })],
      [recall({ id: "fresh", product: "A different product", source: otherSource() })],
    );
    expect(merged.map((r) => r.id)).toEqual(["curated", "fresh"]);
  });

  it("leaves the curated list alone when there is no feed", () => {
    const curated = [recall({ id: "one" }), recall({ id: "two" })];
    expect(mergeRecalls(curated, [])).toEqual(curated);
  });

  it("does not add the same live record twice", () => {
    const merged = mergeRecalls(
      [],
      [recall({ id: "same" }), recall({ id: "same", source: otherSource() })],
    );
    expect(merged).toHaveLength(1);
  });
});
