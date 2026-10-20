import { describe, expect, it } from "vitest";
import { choose, chooserIssues, type Chooser } from "./chooser";
import { PACKS } from "./registry";
import { ActionWithChooser, StagePack } from "./schema";

const chooser: Chooser = {
  questions: [
    {
      id: "space",
      question: "Where will it live?",
      answers: [
        { id: "small", label: "A small kitchen" },
        { id: "own", label: "Its own corner" },
      ],
    },
    {
      id: "budget",
      question: "What do you want to spend?",
      answers: [
        { id: "low", label: "Under $50" },
        { id: "high", label: "Over $200" },
      ],
    },
    {
      id: "years",
      question: "Do you want it to last past three?",
      answers: [
        { id: "no", label: "No" },
        { id: "yes", label: "Yes" },
      ],
    },
  ],
  recommendations: [
    {
      optionId: "cheap",
      when: { space: ["small"], budget: ["low"] },
      reason: "It is small and it is cheap.",
    },
    {
      optionId: "fancy",
      when: { budget: ["high"], years: ["yes"] },
      reason: "It lasts and it costs.",
    },
    {
      optionId: "middle",
      when: { budget: ["low"], years: ["yes"] },
      reason: "It is cheap and it lasts.",
    },
  ],
};

describe("choose", () => {
  it("returns the recommendation whose answers all match", () => {
    const result = choose(chooser, { space: "small", budget: "low", years: "no" });
    expect(result?.optionId).toBe("cheap");
    expect(result?.reason).toBe("It is small and it is cheap.");
    expect(result?.matched).toBe(2);
  });

  it("prefers the recommendation that matches more answers", () => {
    // "low" + "yes" matches both `cheap` (1 clause) and `middle` (2 clauses).
    const result = choose(chooser, { space: "own", budget: "low", years: "yes" });
    expect(result?.optionId).toBe("middle");
    expect(result?.matched).toBe(2);
  });

  it("breaks a tie on declaration order", () => {
    const tied: Chooser = {
      ...chooser,
      recommendations: [
        { optionId: "first", when: { budget: ["low"] }, reason: "First." },
        { optionId: "second", when: { budget: ["low"] }, reason: "Second." },
      ],
    };
    expect(choose(tied, { budget: "low" })?.optionId).toBe("first");
  });

  it("names the runner-up when there is a real alternative", () => {
    const result = choose(chooser, { space: "own", budget: "low", years: "yes" });
    expect(result?.runnerUp?.optionId).toBe("cheap");
  });

  it("has no runner-up when only one recommendation matches", () => {
    // Only `fancy` matches at all: `middle` needs a low budget, `cheap` a small room.
    const result = choose(chooser, { space: "own", budget: "high", years: "no" });
    expect(result?.optionId).toBe("fancy");
    expect(result?.runnerUp).toBeUndefined();
  });

  it("returns nothing when no recommendation matches", () => {
    expect(choose(chooser, { space: "own", budget: "mid", years: "no" })).toBeUndefined();
  });

  it("ignores an answer to a question the recommendation does not use", () => {
    const result = choose(chooser, { space: "own", budget: "high", years: "yes", extra: "x" });
    expect(result?.optionId).toBe("fancy");
  });

  it("ignores a recommendation whose question was not answered", () => {
    // No `space` answer, so `cheap` cannot match; `middle` still can.
    expect(choose(chooser, { budget: "low", years: "yes" })?.optionId).toBe("middle");
  });
});

describe("chooserIssues", () => {
  const optionIds = ["cheap", "fancy", "middle"];

  it("passes a chooser that names real options, questions and answers", () => {
    expect(chooserIssues(chooser, optionIds)).toEqual([]);
  });

  it("catches a recommendation for an option the step does not have", () => {
    const broken: Chooser = {
      ...chooser,
      recommendations: [{ optionId: "nope", when: { budget: ["low"] }, reason: "x" }],
    };
    expect(chooserIssues(broken, optionIds)).toEqual([
      'recommends "nope", which is not an option on this step',
    ]);
  });

  it("catches a recommendation that names a question that does not exist", () => {
    const broken: Chooser = {
      ...chooser,
      recommendations: [{ optionId: "cheap", when: { colour: ["red"] }, reason: "x" }],
    };
    expect(chooserIssues(broken, optionIds)).toEqual([
      'recommendation for "cheap" names question "colour", which does not exist',
    ]);
  });

  it("catches a recommendation that names an answer that is not on the question", () => {
    const broken: Chooser = {
      ...chooser,
      recommendations: [{ optionId: "cheap", when: { budget: ["enormous"] }, reason: "x" }],
    };
    expect(chooserIssues(broken, optionIds)).toEqual([
      'recommendation for "cheap" names answer "enormous", which is not on "budget"',
    ]);
  });

  it("catches two answers with the same id on one question", () => {
    const broken: Chooser = {
      ...chooser,
      questions: [
        {
          id: "space",
          question: "Where?",
          answers: [
            { id: "small", label: "Small" },
            { id: "small", label: "Also small" },
          ],
        },
        ...chooser.questions.slice(1),
      ],
    };
    expect(chooserIssues(broken, optionIds)).toContain(
      'question "space" has two answers with the same id',
    );
  });
});

describe("the buy gate", () => {
  const base = {
    id: "a-buy",
    type: "buy" as const,
    priority: "recommended" as const,
    domain: "gear" as const,
    title: "Buy the thing",
    why: "Because it helps.",
    options: [
      { id: "cheap", label: "Cheap" },
      { id: "fancy", label: "Fancy" },
      { id: "middle", label: "Middle" },
    ],
  };

  it("refuses a buy action with neither a chooser nor a reason it needs none", () => {
    const result = ActionWithChooser.safeParse(base);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "a buy action needs a chooser, or a noChooser saying why it needs none",
    );
  });

  it("accepts a buy action with a reason it needs no chooser", () => {
    expect(ActionWithChooser.safeParse({ ...base, noChooser: "There is one." }).success).toBe(true);
  });

  it("accepts a buy action with a chooser", () => {
    expect(ActionWithChooser.safeParse({ ...base, chooser }).success).toBe(true);
  });

  it("refuses a buy action with both", () => {
    const result = ActionWithChooser.safeParse({ ...base, chooser, noChooser: "There is one." });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "a buy action has a chooser or a reason it needs none, not both",
    );
  });

  it("refuses a chooser that recommends an option the action does not have", () => {
    const result = ActionWithChooser.safeParse({
      ...base,
      chooser: {
        ...chooser,
        recommendations: [{ optionId: "three", when: { budget: ["low"] }, reason: "x" }],
      },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'recommends "three", which is not an option on this step',
    );
  });

  it("refuses a chooser on an action that is not a purchase", () => {
    const result = ActionWithChooser.safeParse({ ...base, type: "do", chooser });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("only a buy action can carry a chooser");
  });

  it("refuses a noChooser on an action that is not a purchase", () => {
    const result = ActionWithChooser.safeParse({ ...base, type: "do", noChooser: "x" });
    expect(result.success).toBe(false);
  });

  it("leaves a non-buy action with neither field alone", () => {
    expect(ActionWithChooser.safeParse({ ...base, type: "do" }).success).toBe(true);
  });

  it("refuses a chooser with two questions", () => {
    const result = ActionWithChooser.safeParse({
      ...base,
      chooser: { ...chooser, questions: chooser.questions.slice(0, 2) },
    });
    expect(result.success).toBe(false);
  });
});

describe("the shipped content", () => {
  const buys = PACKS.flatMap((pack) =>
    pack.coreActions.filter((action) => action.type === "buy").map((action) => ({ pack, action })),
  );

  it("has at least one purchase, so the gate is not vacuous", () => {
    expect(buys.length).toBeGreaterThan(0);
  });

  it("gives every purchase a chooser or a reason it needs none", () => {
    for (const { action } of buys) {
      expect(
        action.chooser !== undefined || action.noChooser !== undefined,
        `${action.id} has neither`,
      ).toBe(true);
    }
  });

  it("resolves every chooser to one option for every combination of answers", () => {
    for (const { action } of buys) {
      if (action.chooser === undefined) continue;
      const combinations = action.chooser.questions.reduce<Record<string, string>[]>(
        (acc, question) =>
          acc.flatMap((answers) =>
            question.answers.map((answer) => ({ ...answers, [question.id]: answer.id })),
          ),
        [{}],
      );
      for (const answers of combinations) {
        const result = choose(action.chooser, answers);
        expect(result, `${action.id} has no answer for ${JSON.stringify(answers)}`).toBeDefined();
        expect(action.options.map((option) => option.id)).toContain(result?.optionId);
      }
    }
  });

  it("gives every recommendation a reason a parent can read", () => {
    for (const { action } of buys) {
      for (const recommendation of action.chooser?.recommendations ?? []) {
        expect(recommendation.reason.length).toBeGreaterThan(20);
      }
    }
  });

  it("keeps the chooser inside the pack's own schema", () => {
    for (const pack of PACKS) {
      expect(StagePack.safeParse(pack).success).toBe(true);
    }
  });
});
