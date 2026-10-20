import { describe, expect, it } from "vitest";

import type { Source } from "./schema";
import {
  EMERGENCY_ESCALATIONS,
  REASSURANCE,
  TRIAGE_KINDS,
  TriageTree,
  WATCH_ESCALATIONS,
  decodePath,
  encodePath,
  nextNode,
  paths,
  reassuranceIn,
  treeIssues,
  walk,
  walkAnswers,
  type TriageNode,
  type TriageResult,
} from "./triage";
import { TRIAGE, getTriage, loadTriage } from "./triage-registry";

function source(id = "s1"): Source {
  return {
    id,
    title: "A source",
    publisher: "ACOG",
    url: "https://example.com/a-source",
    kind: "clinical",
    accessed: "2026-10-20",
  };
}

function result(over: Partial<TriageResult> & { id: string }): TriageResult {
  return {
    kind: "urgent",
    headline: "Call your OB triage line now.",
    body: "They will tell you whether to come in.",
    escalation: "call-ob-triage",
    sources: [source()],
    reviewedBy: "Clinical review pending",
    reviewedAt: "2026-10-20",
    ...over,
  };
}

function node(over: Partial<TriageNode> & { id: string }): TriageNode {
  return {
    question: "What is happening?",
    answers: [
      { id: "one", label: "One", next: "urgent" },
      { id: "two", label: "Two", next: "watch" },
    ],
    ...over,
  };
}

/** A small, valid tree: three paths, one of each kind. */
function base() {
  return {
    id: "triage",
    title: "If something is wrong",
    root: "start",
    nodes: [
      node({
        id: "start",
        question: "Who is this about?",
        answers: [
          { id: "me", label: "Me", next: "what" },
          { id: "baby", label: "The baby", next: "emergency" },
        ],
      }),
      node({ id: "what" }),
    ],
    results: [
      result({
        id: "emergency",
        kind: "emergency",
        headline: "Call 911 now.",
        escalation: "call-911",
      }),
      result({ id: "urgent" }),
      result({
        id: "watch",
        kind: "watch",
        headline: "Call if it gets worse.",
        watchFor: ["More bleeding"],
      }),
    ],
  };
}

const tree = (): TriageTree => TriageTree.parse(base());

describe("the shipped tree", () => {
  it("has at least the twenty paths the issue asks for", () => {
    expect(paths(TRIAGE).length).toBeGreaterThanOrEqual(20);
  });

  it("gives every path an outcome with a review record", () => {
    for (const path of paths(TRIAGE)) {
      expect(path.result.reviewedBy.length).toBeGreaterThan(0);
      expect(path.result.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(path.result.sources.length).toBeGreaterThan(0);
    }
  });

  it("never tells a parent they are fine", () => {
    for (const path of paths(TRIAGE)) {
      expect(reassuranceIn(path.result)).toEqual([]);
    }
  });

  it("gives every watch outcome something to watch for", () => {
    for (const path of paths(TRIAGE)) {
      if (path.result.kind === "watch") {
        expect(path.result.watchFor?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it("escalates each kind to a number that matches it", () => {
    for (const path of paths(TRIAGE)) {
      const { kind, escalation } = path.result;
      if (kind === "emergency") expect(EMERGENCY_ESCALATIONS).toContain(escalation);
      if (kind === "urgent") expect(escalation).not.toBe("call-911");
      if (kind === "watch") expect(WATCH_ESCALATIONS).toContain(escalation);
    }
  });

  it("has no structural problems at all", () => {
    expect(treeIssues(TRIAGE)).toEqual([]);
  });

  it("reaches every node and every outcome", () => {
    const reached = new Set(paths(TRIAGE).flatMap((path) => path.steps.map((s) => s.node.id)));
    for (const candidate of TRIAGE.nodes) expect(reached).toContain(candidate.id);
    const outcomes = new Set(paths(TRIAGE).map((path) => path.result.id));
    for (const candidate of TRIAGE.results) expect(outcomes).toContain(candidate.id);
  });
});

describe("treeIssues", () => {
  it("says nothing about a tree that is sound", () => {
    expect(treeIssues(base())).toEqual([]);
  });

  it("catches two questions with the same id", () => {
    const bad = base();
    bad.nodes.push(node({ id: "what" }));
    expect(treeIssues(bad)).toContain('two questions share the id "what"');
  });

  it("catches two answers with the same id on one question", () => {
    const bad = base();
    bad.nodes[1] = node({
      id: "what",
      answers: [
        { id: "one", label: "One", next: "urgent" },
        { id: "one", label: "One again", next: "watch" },
      ],
    });
    expect(treeIssues(bad)).toContain('"what" has two answers with the id "one"');
  });

  it("catches two outcomes with the same id", () => {
    const bad = base();
    bad.results.push(result({ id: "urgent" }));
    expect(treeIssues(bad)).toContain('two outcomes share the id "urgent"');
  });

  it("catches an id that is both a question and an outcome", () => {
    const bad = base();
    bad.results.push(result({ id: "start" }));
    expect(treeIssues(bad)).toContain('"start" is both a question and an outcome');
  });

  it("catches an emergency that escalates to a person, not a line", () => {
    const bad = base();
    bad.results[0] = result({ id: "emergency", kind: "emergency", escalation: "call-ob-triage" });
    expect(treeIssues(bad).join(" ")).toContain("is an emergency but escalates to");
  });

  it("catches an urgent outcome that escalates to 911", () => {
    const bad = base();
    bad.results[1] = result({ id: "urgent", kind: "urgent", escalation: "call-911" });
    expect(treeIssues(bad)).toContain(
      '"urgent" is urgent but escalates to 911 — that makes it an emergency',
    );
  });

  it("catches a watch outcome that escalates to an emergency line", () => {
    const bad = base();
    bad.results[2] = result({
      id: "watch",
      kind: "watch",
      escalation: "call-911",
      watchFor: ["More bleeding"],
    });
    expect(treeIssues(bad).join(" ")).toContain("is a watch outcome but escalates to");
  });

  it("catches a watch outcome with nothing to watch for", () => {
    const bad = base();
    bad.results[2] = result({ id: "watch", kind: "watch" });
    expect(treeIssues(bad)).toContain('"watch" is a watch outcome with nothing to watch for');
  });

  it("catches a root that is not a question", () => {
    const bad = base();
    bad.root = "ghost";
    expect(treeIssues(bad)).toContain('the root "ghost" is not a question');
  });

  it("catches an answer that points at nothing", () => {
    const bad = base();
    bad.nodes[1] = node({
      id: "what",
      answers: [
        { id: "one", label: "One", next: "ghost" },
        { id: "two", label: "Two", next: "watch" },
      ],
    });
    expect(treeIssues(bad)).toContain(
      '"what" answer "one" points at "ghost", which does not exist',
    );
  });

  it("catches a question nobody can reach", () => {
    const bad = base();
    bad.nodes.push(node({ id: "orphan" }));
    expect(treeIssues(bad)).toContain('"orphan" cannot be reached from the root');
  });

  it("catches an outcome nobody can reach", () => {
    const bad = base();
    bad.results.push(result({ id: "orphan" }));
    expect(treeIssues(bad)).toContain('"orphan" cannot be reached from the root');
  });

  it("refuses a tree with a cycle, because a parent would never reach an outcome", () => {
    const bad = base();
    bad.nodes[1] = node({
      id: "what",
      answers: [
        { id: "one", label: "One", next: "start" },
        { id: "two", label: "Two", next: "watch" },
      ],
    });
    expect(treeIssues(bad)).toContain('"urgent" cannot be reached from the root');
  });
});

describe("walk", () => {
  it("follows a path to its outcome", () => {
    const found = walk(tree(), { start: "me", what: "one" });
    expect(found?.result.id).toBe("urgent");
    expect(found?.steps.map((step) => step.answer.id)).toEqual(["me", "one"]);
  });

  it("stops at the first outcome", () => {
    expect(walk(tree(), { start: "baby" })?.result.id).toBe("emergency");
  });

  it("returns nothing when the answers run out", () => {
    expect(walk(tree(), { start: "me" })).toBeUndefined();
  });

  it("returns nothing when an answer is not on the question", () => {
    expect(walk(tree(), { start: "me", what: "three" })).toBeUndefined();
  });

  it("returns nothing when the root is not a question", () => {
    const bad = { ...tree(), root: "ghost" } as TriageTree;
    expect(walk(bad, {})).toBeUndefined();
  });

  it("returns nothing rather than looping forever", () => {
    const bad = {
      ...tree(),
      nodes: [
        node({
          id: "start",
          answers: [
            { id: "me", label: "Me", next: "start" },
            { id: "baby", label: "The baby", next: "emergency" },
          ],
        }),
      ],
    } as TriageTree;
    expect(walk(bad, { start: "me" })).toBeUndefined();
  });
});

describe("paths", () => {
  it("finds every root-to-outcome path", () => {
    const found = paths(tree());
    // Depth-first, in the order the answers are written.
    expect(found.map((path) => path.result.id)).toEqual(["urgent", "watch", "emergency"]);
  });

  it("returns nothing when the root is not a question", () => {
    expect(paths({ ...tree(), root: "ghost" } as TriageTree)).toEqual([]);
  });

  it("does not follow a cycle", () => {
    const bad = {
      ...tree(),
      nodes: [
        node({
          id: "start",
          answers: [
            { id: "me", label: "Me", next: "start" },
            { id: "baby", label: "The baby", next: "emergency" },
          ],
        }),
      ],
    } as TriageTree;
    expect(paths(bad).map((path) => path.result.id)).toEqual(["emergency"]);
  });
});

describe("the path in the URL", () => {
  it("round-trips", () => {
    expect(decodePath(encodePath(["me", "one"]))).toEqual(["me", "one"]);
  });

  it("reads nothing from nothing", () => {
    expect(decodePath(undefined)).toEqual([]);
    expect(decodePath("")).toEqual([]);
  });

  it("ignores spaces and empty segments", () => {
    expect(decodePath(" me , ,baby ")).toEqual(["me", "baby"]);
  });
});

describe("walkAnswers", () => {
  it("walks by answer ids alone, without being told the questions", () => {
    expect(walkAnswers(tree(), ["me", "one"])?.result.id).toBe("urgent");
  });

  it("returns nothing when an answer is not on the question it lands on", () => {
    expect(walkAnswers(tree(), ["one"])).toBeUndefined();
  });

  it("returns nothing when there are answers after the outcome", () => {
    expect(walkAnswers(tree(), ["baby", "one"])).toBeUndefined();
  });

  it("returns nothing when there are no answers at all", () => {
    expect(walkAnswers(tree(), [])).toBeUndefined();
  });
});

describe("nextNode", () => {
  it("asks the root first", () => {
    expect(nextNode(tree(), [])?.id).toBe("start");
  });

  it("asks the next question after an answer", () => {
    expect(nextNode(tree(), ["me"])?.id).toBe("what");
  });

  it("asks nothing once an outcome is reached", () => {
    expect(nextNode(tree(), ["baby"])).toBeUndefined();
  });

  it("asks nothing when an answer is not on the question", () => {
    expect(nextNode(tree(), ["one"])).toBeUndefined();
  });
});

describe("reassuranceIn", () => {
  it("finds a phrase that reassures", () => {
    const found = reassuranceIn(result({ id: "r", body: "You're fine. Go back to bed." }));
    expect(found).toEqual(["You're fine"]);
  });

  it("finds one in the headline", () => {
    expect(reassuranceIn(result({ id: "r", headline: "Nothing to worry about." }))).toEqual([
      "Nothing to worry about",
    ]);
  });

  it("finds one in what to watch for", () => {
    expect(reassuranceIn(result({ id: "r", watchFor: ["It is normal"] }))).toEqual([
      "It is normal",
    ]);
  });

  it("finds nothing in an outcome that only says what to do", () => {
    expect(reassuranceIn(result({ id: "r" }))).toEqual([]);
  });

  it("bans every phrase it claims to ban", () => {
    const phrases = [
      "you are fine",
      "you're okay",
      "nothing to worry about",
      "no need to worry",
      "no reason to worry",
      "don't worry",
      "rest assured",
      "it's normal",
      "this is nothing",
      "that is fine",
      "perfectly safe",
      "nothing is wrong",
      "nothing seems wrong",
      "not a problem",
      "not an issue",
      "not a concern",
    ];
    for (const phrase of phrases) {
      const found = reassuranceIn(result({ id: "r", body: phrase }));
      expect(found.length, phrase).toBeGreaterThan(0);
    }
  });

  it("has a pattern for every kind of reassurance", () => {
    expect(REASSURANCE.length).toBeGreaterThan(0);
  });
});

describe("the kinds", () => {
  it("are exactly three, and none of them is 'fine'", () => {
    expect(TRIAGE_KINDS).toEqual(["emergency", "urgent", "watch"]);
  });
});

describe("the registry", () => {
  it("loads the shipped tree", () => {
    expect(getTriage(TRIAGE.id)).toBe(TRIAGE);
  });

  it("has nothing for an id it does not know", () => {
    expect(getTriage("nope")).toBeUndefined();
  });

  it("refuses a tree that would send a parent somewhere that does not exist", () => {
    const bad = base();
    bad.nodes[1] = node({
      id: "what",
      answers: [
        { id: "one", label: "One", next: "ghost" },
        { id: "two", label: "Two", next: "watch" },
      ],
    });
    expect(() => loadTriage(bad)).toThrow(/points at "ghost", which does not exist/);
  });

  it("refuses a tree that is not even the right shape", () => {
    expect(() => loadTriage({ id: "x" })).toThrow(/not valid/);
  });
});

describe("the schema", () => {
  it("refuses a tree with a structural problem, and says which", () => {
    const bad = base();
    bad.results[2] = result({ id: "watch", kind: "watch" });
    const parsed = TriageTree.safeParse(bad);
    expect(parsed.success).toBe(false);
    expect(JSON.stringify(parsed.error?.issues)).toContain("nothing to watch for");
  });
});

describe("a tree that is not a tree at all", () => {
  it("is refused without pretending to read it", () => {
    expect(() => loadTriage(null)).toThrow(/not valid/);
  });
});
