import { describe, expect, it } from "vitest";

import { findAction } from "./loader";
import { PACKS } from "./registry";
import type { Source } from "./schema";
import {
  RECALL_BECAUSES,
  RECALL_SEVERITIES,
  Recall,
  assertValidRecalls,
  loadRecalls,
  matchRecalls,
  recallIssues,
  recallKey,
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
    publishedAt: "2026-01-01",
    source: source(),
    matches: matches
      ? { optionIds: [], actionIds: [], keywords: [], ...matches }
      : { optionIds: [], actionIds: ["a-step"], keywords: [] },
    ...rest,
  } as Recall;
}

function subject(over: Partial<RecallSubject> = {}): RecallSubject {
  return { choices: {}, pins: [], ...over };
}

describe("the shipped feed", () => {
  it("holds the recalls we wrote", () => {
    expect(RECALLS).toHaveLength(5);
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
      expect(entry.source.url).toMatch(/^https:\/\/www\.cpsc\.gov\/Recalls\//);
    }
  });

  it("is reachable by id", () => {
    expect(getRecall("cpsc-26290")?.product).toContain("Bicystar");
    expect(getRecall("nope")).toBeUndefined();
  });

  it("loads through the same gate as everything else", () => {
    expect(loadRecallFeed(TODAY)).toHaveLength(5);
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

  it("refuses a recall that matches nothing", () => {
    const { issues } = loadRecalls([{ ...recall({ id: "empty" }), matches: {} }]);
    expect(issues.some((i) => i.message.includes("can never reach a parent"))).toBe(true);
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
