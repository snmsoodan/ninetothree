import { describe, expect, it, vi } from "vitest";
import { TRIAGE, paths } from "@ninetothree/content";
import { triageQuestionLabel } from "@ninetothree/domain";
import { dial, triageModel, truncateTo, type Dialer } from "./triage";

/**
 * The triage model, before it is drawn.
 *
 * The domain tests already prove the walk matches the tree. These prove the
 * phone's shape of that walk: one question at a time, an outcome that always
 * knows who to call, and a breadcrumb you can go back through — plus the one
 * platform branch on the screen, which is asking whether a dialler exists.
 */

const ROOT = TRIAGE.nodes.find((node) => node.id === TRIAGE.root)!;
const FIRST_ANSWER = ROOT.answers[0]!;

/** The shortest walk to an outcome, so a test can name one path and mean it. */
const OUTCOME_PATH = paths(TRIAGE)[0]!;
const OUTCOME_ANSWERS = OUTCOME_PATH.steps.map((step) => step.answer.id);

function fakeDialer(
  answers: boolean,
  throws = false,
): Dialer & {
  canOpenURL: ReturnType<typeof vi.fn>;
  openURL: ReturnType<typeof vi.fn>;
} {
  return {
    canOpenURL: vi.fn(async () => answers),
    openURL: vi.fn(async () => {
      if (throws) throw new Error("no dialler");
      return true;
    }),
  };
}

describe("triageModel", () => {
  it("opens on the first question, numbered for a parent not a programmer", () => {
    const model = triageModel({ tree: TRIAGE, answerIds: [] });

    expect(model.kind).toBe("question");
    expect(model.step).toBe(triageQuestionLabel(1));
    expect(model.heading).toBe(ROOT.question);
    expect(model.answers.map((answer) => answer.id)).toEqual(ROOT.answers.map((a) => a.id));
    expect(model.answers[0]!.label).toBe(ROOT.answers[0]!.label);
    expect(model.call).toBeNull();
    expect(model.watch).toBeNull();
    expect(model.sources).toBeNull();
  });

  it("offers every answer the tree has, and nothing else", () => {
    const model = triageModel({ tree: TRIAGE, answerIds: [] });
    expect(model.answers).toHaveLength(ROOT.answers.length);
  });

  it("writes the privacy line under a question and not under an outcome", () => {
    const question = triageModel({ tree: TRIAGE, answerIds: [] });
    expect(question.privacy).not.toBeNull();

    const outcome = triageModel({ tree: TRIAGE, answerIds: OUTCOME_ANSWERS });
    expect(outcome.privacy).toBeNull();
  });

  it("lands every root-to-outcome path on that outcome's own words", () => {
    const all = paths(TRIAGE);
    expect(all.length).toBeGreaterThan(0);

    for (const path of all) {
      const model = triageModel({
        tree: TRIAGE,
        answerIds: path.steps.map((step) => step.answer.id),
      });
      expect(model.kind, path.steps.map((step) => step.answer.id).join(" → ")).toBe("outcome");
      expect(model.heading).toBe(path.result.headline);
      expect(model.body).toBe(path.result.body);
      expect(model.answers).toEqual([]);
      expect(model.step).toBe("");
    }
  });

  it("gives every outcome someone to call, with a number to dial when there is one", () => {
    for (const path of paths(TRIAGE)) {
      const model = triageModel({
        tree: TRIAGE,
        answerIds: path.steps.map((step) => step.answer.id),
      });
      expect(model.call, path.result.id).not.toBeNull();
      expect(model.call!.label.length).toBeGreaterThan(0);
      expect(model.call!.instruction.length).toBeGreaterThan(0);
      // Either a number you can dial, or a person to call — never a blank card.
      if (model.call!.phone === null) {
        expect(model.call!.tel).toBeNull();
      } else {
        expect(model.call!.tel).toMatch(/^tel:[0-9+]+$/);
      }
    }
  });

  it("keeps a number that has no dialler scheme as plain text", () => {
    const path = paths(TRIAGE).find(
      (candidate) => candidate.result.escalation === "call-ob-triage",
    );
    expect(path, "the tree should still have a person-to-call outcome").toBeDefined();
    const model = triageModel({
      tree: TRIAGE,
      answerIds: path!.steps.map((step) => step.answer.id),
    });
    expect(model.call!.phone).toBeNull();
    expect(model.call!.tel).toBeNull();
    expect(model.call!.label).toBe("Call your OB triage line");
  });

  it("lists watch-fors when the outcome has them, and hides the heading when not", () => {
    const withWatch = paths(TRIAGE).find((candidate) => candidate.result.watchFor?.length);
    expect(withWatch).toBeDefined();
    const model = triageModel({
      tree: TRIAGE,
      answerIds: withWatch!.steps.map((step) => step.answer.id),
    });
    expect(model.watch!.lines).toEqual(withWatch!.result.watchFor);
    expect(model.watch!.heading.length).toBeGreaterThan(0);

    const withoutWatch = paths(TRIAGE).find((candidate) => !candidate.result.watchFor?.length);
    if (withoutWatch) {
      const bare = triageModel({
        tree: TRIAGE,
        answerIds: withoutWatch.steps.map((step) => step.answer.id),
      });
      expect(bare.watch).toBeNull();
    }
  });

  it("shows sources with a publisher and a long review date, as the website does", () => {
    const model = triageModel({ tree: TRIAGE, answerIds: OUTCOME_ANSWERS });
    expect(model.sources!.items.length).toBeGreaterThan(0);
    expect(model.sources!.items[0]!.url).toMatch(/^https?:\/\//);
    expect(model.sources!.items[0]!.detail.length).toBeGreaterThan(0);
    expect(model.sources!.reviewed).toMatch(/\b\d{4}\b/);
  });

  it("keeps the breadcrumb in the order the answers were given", () => {
    const second = paths(TRIAGE).find((candidate) => candidate.steps.length > 1);
    expect(second).toBeDefined();
    const answerIds = second!.steps.map((step) => step.answer.id);
    const model = triageModel({ tree: TRIAGE, answerIds });

    expect(model.kind).toBe("outcome");
    expect(model.trail.map((step) => step.answerId)).toEqual(answerIds);
    expect(model.trail.map((step) => step.label)).toEqual(
      second!.steps.map((step) => step.answer.label),
    );
    expect(model.trailLabel.length).toBeGreaterThan(0);
  });

  it("refuses an answer that is not on this question", () => {
    const deeper = paths(TRIAGE).find((candidate) => candidate.steps.length > 1);
    const notHere = deeper!.steps[1]!.answer.id;
    const model = triageModel({ tree: TRIAGE, answerIds: [notHere] });

    expect(model.kind).toBe("broken");
    expect(model.answers).toEqual([]);
    expect(model.call).toBeNull();
    expect(model.body.length).toBeGreaterThan(0);
  });

  it("refuses answers that continue past an outcome", () => {
    const model = triageModel({ tree: TRIAGE, answerIds: [...OUTCOME_ANSWERS, FIRST_ANSWER.id] });
    expect(model.kind).toBe("broken");
  });

  it("always offers a way back to the start and to the whole list", () => {
    for (const answers of [[], [FIRST_ANSWER.id], OUTCOME_ANSWERS, ["not-an-answer"]]) {
      const model = triageModel({ tree: TRIAGE, answerIds: answers });
      expect(model.actions.startOver.length).toBeGreaterThan(0);
      expect(model.actions.allFlags.length).toBeGreaterThan(0);
    }
  });
});

describe("truncateTo", () => {
  it("keeps the answers up to and including the tapped crumb", () => {
    const trail = paths(TRIAGE)
      .find((candidate) => candidate.steps.length > 1)!
      .steps.map((step) => ({ answerId: step.answer.id, label: step.answer.label }));
    expect(truncateTo(trail, 0)).toEqual([trail[0]!.answerId]);
    expect(truncateTo(trail, 1)).toEqual([trail[0]!.answerId, trail[1]!.answerId]);
  });
});

describe("dial", () => {
  it("asks the platform before trying, and dials when it says yes", async () => {
    const dialer = fakeDialer(true);
    await expect(dial(dialer, "tel:911")).resolves.toBe(true);
    expect(dialer.canOpenURL).toHaveBeenCalledWith("tel:911");
    expect(dialer.openURL).toHaveBeenCalledWith("tel:911");
  });

  it("does not try when the device has no dialler", async () => {
    const dialer = fakeDialer(false);
    await expect(dial(dialer, "tel:911")).resolves.toBe(false);
    expect(dialer.openURL).not.toHaveBeenCalled();
  });

  it("survives a failed open, which is what a simulator does", async () => {
    const dialer = fakeDialer(true, true);
    await expect(dial(dialer, "tel:988")).resolves.toBe(true);
  });

  it("survives a platform that throws when asked", async () => {
    const dialer: Dialer = {
      canOpenURL: async () => {
        throw new Error("no such scheme");
      },
      openURL: async () => true,
    };
    await expect(dial(dialer, "tel:911")).resolves.toBe(false);
  });

  it("refuses anything that is not a phone number, so a stray href cannot open a URL", async () => {
    const dialer = fakeDialer(true);
    await expect(dial(dialer, "https://example.com")).resolves.toBe(false);
    expect(dialer.canOpenURL).not.toHaveBeenCalled();
  });
});
