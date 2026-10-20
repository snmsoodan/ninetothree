import { z } from "zod";

/**
 * A chooser is content, not code. Three questions a parent actually has, and a
 * small table saying which answer points at which option. The table is scored,
 * not walked as a tree: a recommendation can match on two of three answers, so
 * a question added later does not invalidate every leaf.
 */

export const ChooserAnswer = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(60),
  /** One line of help under the label. Optional. */
  hint: z.string().max(120).optional(),
});
export type ChooserAnswer = z.infer<typeof ChooserAnswer>;

export const ChooserQuestion = z.object({
  id: z.string().min(1),
  /** The question, in the parent's words. Under 120 characters. */
  question: z.string().min(1).max(120),
  /** Why we are asking. Shown small, under the question. */
  why: z.string().max(160).optional(),
  answers: z.array(ChooserAnswer).min(2).max(4),
});
export type ChooserQuestion = z.infer<typeof ChooserQuestion>;

export const ChooserRecommendation = z.object({
  /** Must be an option id on the action this chooser belongs to. */
  optionId: z.string().min(1),
  /**
   * The answers that point here, keyed by question id. Every key must be a real
   * question, and every value a real answer on that question.
   */
  when: z.record(z.string(), z.array(z.string().min(1)).min(1)),
  /** Why this one, in the parent's words. A recommendation with no reason is an advert. */
  reason: z.string().min(1).max(240),
});
export type ChooserRecommendation = z.infer<typeof ChooserRecommendation>;

export const Chooser = z.object({
  /** Exactly three questions. Two is a quiz; four is a form. */
  questions: z.array(ChooserQuestion).length(3),
  recommendations: z.array(ChooserRecommendation).min(1).max(4),
});
export type Chooser = z.infer<typeof Chooser>;

/** The answers a parent has given so far, keyed by question id. */
export type ChooserAnswers = Record<string, string>;

export interface ChooserResult {
  optionId: string;
  reason: string;
  /** How many of the recommendation's clauses matched. Higher is more specific. */
  matched: number;
  /** The next-best option, when it is a real alternative. */
  runnerUp?: { optionId: string; reason: string };
}

/**
 * Score every recommendation against the answers and return the best one.
 *
 * Ties break on the number of clauses, so a recommendation that matches all
 * three answers beats one that matches two. A remaining tie breaks on
 * declaration order, which is the order the content author wrote them in.
 *
 * Returns `undefined` when no recommendation matches at all — the caller must
 * handle that rather than being handed a default that was never chosen.
 */
export function choose(chooser: Chooser, answers: ChooserAnswers): ChooserResult | undefined {
  const scored = chooser.recommendations
    .map((recommendation, index) => {
      let matched = 0;
      for (const [questionId, answerIds] of Object.entries(recommendation.when)) {
        const given = answers[questionId];
        if (given !== undefined && answerIds.includes(given)) matched += 1;
      }
      return { recommendation, matched, index };
    })
    .filter((entry) => entry.matched > 0)
    .sort((a, b) => b.matched - a.matched || a.index - b.index);

  const best = scored[0];
  if (best === undefined) return undefined;

  const next = scored[1];
  return {
    optionId: best.recommendation.optionId,
    reason: best.recommendation.reason,
    matched: best.matched,
    ...(next === undefined
      ? {}
      : {
          runnerUp: { optionId: next.recommendation.optionId, reason: next.recommendation.reason },
        }),
  };
}

/**
 * Every problem with a chooser, given the option ids it is allowed to name.
 * Used by the schema refine and by the content tests, so the message a content
 * author sees is the same one the test asserts on.
 */
export function chooserIssues(chooser: Chooser, optionIds: string[]): string[] {
  const issues: string[] = [];
  const questionIds = new Set(chooser.questions.map((q) => q.id));

  for (const question of chooser.questions) {
    const answerIds = new Set(question.answers.map((a) => a.id));
    if (answerIds.size !== question.answers.length) {
      issues.push(`question "${question.id}" has two answers with the same id`);
    }
  }

  for (const recommendation of chooser.recommendations) {
    if (!optionIds.includes(recommendation.optionId)) {
      issues.push(`recommends "${recommendation.optionId}", which is not an option on this step`);
    }
    for (const [questionId, answerIds] of Object.entries(recommendation.when)) {
      if (!questionIds.has(questionId)) {
        issues.push(
          `recommendation for "${recommendation.optionId}" names question "${questionId}", which does not exist`,
        );
        continue;
      }
      // The `continue` above guarantees the question exists.
      const question = chooser.questions.find((q) => q.id === questionId) as ChooserQuestion;
      const real = new Set(question.answers.map((a) => a.id));
      for (const answerId of answerIds) {
        if (!real.has(answerId)) {
          issues.push(
            `recommendation for "${recommendation.optionId}" names answer "${answerId}", which is not on "${questionId}"`,
          );
        }
      }
    }
  }

  return issues;
}
