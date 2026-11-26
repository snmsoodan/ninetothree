/**
 * The safety spine has one job: whatever a parent answers, they get the same
 * answer on every platform. These tests walk the real tree, every path of it,
 * rather than a fixture, because a fixture would keep passing after the content
 * changed underneath it.
 */
import { describe, expect, it } from "vitest";
import { ESCALATIONS, TRIAGE, paths, type Escalation, type TriageTree } from "@ninetothree/content";
import {
  HELP_NUMBERS,
  TRIAGE_INSTRUCTION,
  TRIAGE_PRIVACY,
  formatLongDate,
  reviewedLine,
  safetyFlags,
  triageCall,
  triageQuestionLabel,
  triageTrail,
  triageView,
} from "./triage";

const answerIds = (steps: { answer: { id: string } }[]): string[] =>
  steps.map((step) => step.answer.id);

describe("triageView", () => {
  it("asks the root question when nothing has been answered", () => {
    const view = triageView(TRIAGE, []);
    expect(view.kind).toBe("question");
    if (view.kind !== "question") throw new Error("expected a question");
    expect(view.node.id).toBe(TRIAGE.root);
    expect(view.trail).toEqual([]);
  });

  it("walks every root-to-outcome path in the real tree to that outcome", () => {
    const all = paths(TRIAGE);
    expect(all.length).toBeGreaterThan(0);

    for (const path of all) {
      const view = triageView(TRIAGE, answerIds(path.steps));
      expect(view.kind).toBe("outcome");
      if (view.kind !== "outcome") throw new Error("expected an outcome");
      expect(view.result.id).toBe(path.result.id);
    }
  });

  it("asks the next question one answer at a time, never two", () => {
    const root = TRIAGE.nodes.find((node) => node.id === TRIAGE.root);
    if (!root) throw new Error("no root");
    const first = root.answers[0];
    if (!first) throw new Error("the root asks nothing");

    const view = triageView(TRIAGE, [first.id]);
    // Either the first answer is an outcome, or it lands on exactly one question.
    if (view.kind === "question") {
      expect(view.node.id).toBe(first.next);
      expect(view.trail).toEqual([{ answerId: first.id, label: first.label }]);
    } else {
      expect(view.kind).toBe("outcome");
    }
  });

  it("is broken, not blank, for an answer that is not on the question", () => {
    const view = triageView(TRIAGE, ["not-an-answer"]);
    expect(view.kind).toBe("broken");
    expect(view.trail).toEqual([]);
  });

  it("is broken for an answer that belongs to a question further down", () => {
    // A real answer id, in the wrong place. A hand-edited URL looks like this.
    const deeper = TRIAGE.nodes.find((node) => node.id !== TRIAGE.root);
    if (!deeper) throw new Error("only one question in the tree");
    const view = triageView(TRIAGE, [deeper.answers[0]?.id ?? "no-such-answer"]);
    expect(view.kind).toBe("broken");
  });

  it("keeps walking past an outcome, rather than treating extra answers as a path", () => {
    const path = paths(TRIAGE)[0];
    if (!path) throw new Error("the tree has no outcomes");
    const view = triageView(TRIAGE, [...answerIds(path.steps), "yes"]);
    expect(view.kind).toBe("broken");
  });
});

describe("triageTrail", () => {
  it("labels each step with the words the parent tapped", () => {
    const path = paths(TRIAGE).find((candidate) => candidate.steps.length > 1);
    if (!path) throw new Error("no multi-step path");

    const trail = triageTrail(TRIAGE, answerIds(path.steps));
    expect(trail.map((step) => step.answerId)).toEqual(answerIds(path.steps));
    expect(trail.map((step) => step.label)).toEqual(path.steps.map((step) => step.answer.label));
  });

  it("stops at the first answer that does not belong", () => {
    const root = TRIAGE.nodes.find((node) => node.id === TRIAGE.root);
    if (!root) throw new Error("no root");
    const trail = triageTrail(TRIAGE, [root.answers[0]?.id ?? "x", "not-an-answer"]);
    expect(trail).toHaveLength(1);
  });
});

describe("triageCall", () => {
  it("has an instruction for every escalation", () => {
    for (const escalation of ESCALATIONS) {
      expect(TRIAGE_INSTRUCTION[escalation]).toMatch(/\S/);
    }
  });

  it("spells the dial string from the number a parent reads", () => {
    const poison = triageCall("call-poison-control");
    expect(poison.phone).toBe("1-800-222-1222");
    expect(poison.tel).toBe("tel:18002221222");
  });

  it("keeps 911 and 988 three digits", () => {
    expect(triageCall("call-911").tel).toBe("tel:911");
    expect(triageCall("call-988").tel).toBe("tel:988");
  });

  it("has no number for an answer that depends on your own clinician", () => {
    expect(triageCall("call-ob-triage").tel).toBeNull();
    expect(triageCall("call-pediatrician").tel).toBeNull();
    expect(triageCall("go-to-er").tel).toBeNull();
  });

  it("uses the same scheme on both phones, and never invents a country code", () => {
    for (const escalation of ESCALATIONS) {
      const tel = triageCall(escalation).tel;
      if (tel === null) continue;
      expect(tel.startsWith("tel:")).toBe(true);
      expect(tel.slice(4)).toMatch(/^[0-9]+$/);
    }
  });
});

describe("dates", () => {
  it("writes a review date the way the webpage does", () => {
    expect(formatLongDate("2026-03-09")).toBe("March 9, 2026");
    expect(reviewedLine("Dr. Chen", "2026-03-09")).toBe("Reviewed by Dr. Chen on March 9, 2026.");
  });

  it("does not drop a leading zero into the month name", () => {
    expect(formatLongDate("2026-01-01")).toBe("January 1, 2026");
  });
});

describe("safetyFlags", () => {
  const packs = [
    {
      id: "week-24",
      title: "Week 24",
      redFlags: [
        { id: "bleeding", text: "Any bleeding", escalation: "call-911" as Escalation },
        {
          id: "no-move",
          text: "No movement",
          escalation: "call-ob-triage" as Escalation,
          phone: "555-0100",
        },
      ],
    },
  ];

  it("borrows the escalation's number when the flag does not name one", () => {
    const [bleeding] = safetyFlags(packs);
    expect(bleeding?.phone).toBe("911");
    expect(bleeding?.tel).toBe("tel:911");
    expect(bleeding?.action).toBe("Call 911");
  });

  it("prefers the flag's own number, because that is the one that answers", () => {
    const [, noMove] = safetyFlags(packs);
    expect(noMove?.phone).toBe("555-0100");
    expect(noMove?.tel).toBe("tel:5550100");
    expect(noMove?.action).toBe("Call your OB triage line");
  });

  it("carries the week, so a parent can go and read around the flag", () => {
    const [, noMove] = safetyFlags(packs);
    expect(noMove?.packTitle).toBe("Week 24");
    expect(noMove?.packId).toBe("week-24");
    expect(noMove?.id).toBe("week-24-no-move");
  });

  it("has nothing to dial for an answer that is a person, not a number", () => {
    const [flag] = safetyFlags([
      { id: "w", title: "W", redFlags: [{ id: "f", text: "T", escalation: "go-to-er" }] },
    ]);
    expect(flag?.phone).toBeNull();
    expect(flag?.tel).toBeNull();
  });

  it("reads the same list of numbers as the help drawer", () => {
    expect(HELP_NUMBERS.map((entry) => entry.key)).toEqual([
      "call-911",
      "call-poison-control",
      "call-988",
      "call-psi",
      "call-dv-hotline",
    ]);
    for (const entry of HELP_NUMBERS) expect(entry.detail).toMatch(/\S/);
  });
});

describe("triageQuestionLabel", () => {
  it("counts from one", () => {
    expect(triageQuestionLabel(1)).toBe("Question 1");
    expect(triageQuestionLabel(3)).toBe("Question 3");
  });
});

describe("the tree this module is built on", () => {
  it("has a privacy sentence that names 911, because that is the one number always right", () => {
    expect(TRIAGE_PRIVACY).toContain("911");
  });

  it("is the tree the website walks", () => {
    const tree: TriageTree = TRIAGE;
    expect(tree.results.length).toBeGreaterThan(0);
    expect(tree.nodes.length).toBeGreaterThan(1);
  });
});
