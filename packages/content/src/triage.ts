import { z } from "zod";

import { Escalation, Source } from "./schema";

/**
 * The triage tree is the safety spine of the product.
 *
 * A parent who is worried does not want a week card. They want to know
 * whether to call someone, and who. This is a decision tree, written as
 * content so a clinician can review and change it without a deploy, and
 * walked by a pure function so it can be tested exhaustively.
 *
 * Three outcomes, and no fourth. There is deliberately no "you are fine":
 * a tree that can tell a worried parent nothing is wrong will eventually
 * tell the wrong parent nothing is wrong. The quietest outcome still says
 * what to watch and who to call if it changes.
 */

export const TRIAGE_KINDS = ["emergency", "urgent", "watch"] as const;
export const TriageKind = z.enum(TRIAGE_KINDS);
export type TriageKind = z.infer<typeof TriageKind>;

/**
 * An emergency outcome must escalate to something you can reach in the next
 * minute. An urgent outcome must not be 911 — if it were, it would be an
 * emergency. A watch outcome must reach a person, not an emergency line.
 */
export const EMERGENCY_ESCALATIONS: Escalation[] = [
  "call-911",
  "go-to-er",
  "call-988",
  "call-poison-control",
];

export const WATCH_ESCALATIONS: Escalation[] = [
  "call-ob-triage",
  "call-pediatrician",
  "call-psi",
  "call-dv-hotline",
];

/** Two characters, because "yes" and "no" are the right answer ids. */
const Id = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "ids are kebab-case, at least two characters");

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

export const TriageAnswer = z.object({
  id: Id,
  /** The answer as the parent would say it. Under 80 characters. */
  label: z.string().min(1).max(80),
  /** A node id or a result id. The schema checks it resolves. */
  next: Id,
});
export type TriageAnswer = z.infer<typeof TriageAnswer>;

export const TriageNode = z.object({
  id: Id,
  /** One question. No compound questions — a parent cannot answer two at once. */
  question: z.string().min(1).max(120),
  /** Optional context, one sentence. Never advice. */
  detail: z.string().max(240).optional(),
  answers: z.array(TriageAnswer).min(2).max(6),
});
export type TriageNode = z.infer<typeof TriageNode>;

export const TriageResult = z.object({
  id: Id,
  kind: TriageKind,
  /** What to do, in the imperative. Under 80 characters. */
  headline: z.string().min(1).max(80),
  /** Why, and what happens next. Under 400 characters. */
  body: z.string().min(1).max(400),
  escalation: Escalation,
  /** Required for a watch outcome, and useful on the others. */
  watchFor: z.array(z.string().min(1).max(120)).min(1).max(5).optional(),
  sources: z.array(Source).min(1),
  reviewedBy: z.string().min(1).max(80),
  reviewedAt: IsoDate,
});
export type TriageResult = z.infer<typeof TriageResult>;

export const TriageTree = z
  .object({
    id: Id,
    title: z.string().min(1).max(80),
    /** The node a parent lands on. */
    root: Id,
    nodes: z.array(TriageNode).min(1),
    results: z.array(TriageResult).min(1),
  })
  .superRefine((tree, ctx) => {
    for (const issue of treeIssues(tree)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue, path: ["nodes"] });
    }
  });
export type TriageTree = z.infer<typeof TriageTree>;

/**
 * Everything wrong with a tree, as sentences. Exported so the CLI can print
 * all of them at once instead of the first one Zod found.
 */
export function treeIssues(tree: {
  root: string;
  nodes: TriageNode[];
  results: TriageResult[];
}): string[] {
  const issues: string[] = [];
  const nodeIds = new Set<string>();
  const resultIds = new Set<string>();

  for (const node of tree.nodes) {
    if (nodeIds.has(node.id)) issues.push(`two questions share the id "${node.id}"`);
    nodeIds.add(node.id);
    const answerIds = new Set<string>();
    for (const answer of node.answers) {
      if (answerIds.has(answer.id)) {
        issues.push(`"${node.id}" has two answers with the id "${answer.id}"`);
      }
      answerIds.add(answer.id);
    }
  }

  for (const result of tree.results) {
    if (resultIds.has(result.id)) issues.push(`two outcomes share the id "${result.id}"`);
    resultIds.add(result.id);
    if (nodeIds.has(result.id)) {
      issues.push(`"${result.id}" is both a question and an outcome`);
    }
    if (result.kind === "emergency" && !EMERGENCY_ESCALATIONS.includes(result.escalation)) {
      issues.push(
        `"${result.id}" is an emergency but escalates to "${result.escalation}", which is not a number you can call in the next minute`,
      );
    }
    if (result.kind === "urgent" && result.escalation === "call-911") {
      issues.push(`"${result.id}" is urgent but escalates to 911 — that makes it an emergency`);
    }
    if (result.kind === "watch" && !WATCH_ESCALATIONS.includes(result.escalation)) {
      issues.push(
        `"${result.id}" is a watch outcome but escalates to "${result.escalation}", which is not a person to call if it changes`,
      );
    }
    if (result.kind === "watch" && !result.watchFor) {
      issues.push(`"${result.id}" is a watch outcome with nothing to watch for`);
    }
  }

  if (!nodeIds.has(tree.root)) issues.push(`the root "${tree.root}" is not a question`);

  for (const node of tree.nodes) {
    for (const answer of node.answers) {
      if (!nodeIds.has(answer.next) && !resultIds.has(answer.next)) {
        issues.push(
          `"${node.id}" answer "${answer.id}" points at "${answer.next}", which does not exist`,
        );
      }
    }
  }

  const reached = new Set<string>();
  const queue = [tree.root];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    if (reached.has(id)) continue;
    reached.add(id);
    const node = tree.nodes.find((candidate) => candidate.id === id);
    if (!node) continue;
    for (const answer of node.answers) queue.push(answer.next);
  }

  for (const node of tree.nodes) {
    if (!reached.has(node.id)) issues.push(`"${node.id}" cannot be reached from the root`);
  }
  for (const result of tree.results) {
    if (!reached.has(result.id)) issues.push(`"${result.id}" cannot be reached from the root`);
  }

  return issues;
}

export interface TriageStep {
  node: TriageNode;
  answer: TriageAnswer;
}

export interface TriagePath {
  steps: TriageStep[];
  result: TriageResult;
}

/**
 * Walk the tree with a map of node id to answer id. Returns `undefined` when
 * the answers run out before an outcome, which is what the page uses to
 * decide whether to ask the next question.
 */
export function walk(tree: TriageTree, answers: Record<string, string>): TriagePath | undefined {
  const steps: TriageStep[] = [];
  const seen = new Set<string>();
  let node = tree.nodes.find((candidate) => candidate.id === tree.root);

  while (node) {
    if (seen.has(node.id)) return undefined;
    seen.add(node.id);

    const answerId = answers[node.id];
    if (answerId === undefined) return undefined;
    const answer = node.answers.find((candidate) => candidate.id === answerId);
    if (!answer) return undefined;
    steps.push({ node, answer });

    const result = tree.results.find((candidate) => candidate.id === answer.next);
    if (result) return { steps, result };

    node = tree.nodes.find((candidate) => candidate.id === answer.next);
  }

  return undefined;
}

/**
 * Every root-to-outcome path. Used by the tests to prove the count, and by
 * the no-JS document to render the whole tree in order.
 */
export function paths(tree: TriageTree): TriagePath[] {
  const found: TriagePath[] = [];

  const descend = (node: TriageNode, steps: TriageStep[], seen: Set<string>): void => {
    if (seen.has(node.id)) return;
    const nextSeen = new Set(seen).add(node.id);
    for (const answer of node.answers) {
      const nextSteps = [...steps, { node, answer }];
      const result = tree.results.find((candidate) => candidate.id === answer.next);
      if (result) {
        found.push({ steps: nextSteps, result });
        continue;
      }
      const child = tree.nodes.find((candidate) => candidate.id === answer.next);
      if (child) descend(child, nextSteps, nextSeen);
    }
  };

  const root = tree.nodes.find((candidate) => candidate.id === tree.root);
  if (root) descend(root, [], new Set());
  return found;
}

/**
 * The path a parent has walked so far, as a URL-safe string. Answer ids are
 * kebab-case, so a comma is unambiguous.
 */
export function encodePath(answerIds: string[]): string {
  return answerIds.join(",");
}

export function decodePath(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Walk the tree from a list of answer ids in order, ignoring which node each
 * one belongs to. This is what the URL carries, so a parent can go back one
 * answer by shortening the list.
 */
export function walkAnswers(tree: TriageTree, answerIds: string[]): TriagePath | undefined {
  const answers: Record<string, string> = {};
  let node = tree.nodes.find((candidate) => candidate.id === tree.root);
  let index = 0;

  while (node && index < answerIds.length) {
    const answerId = answerIds[index];
    const answer = node.answers.find((candidate) => candidate.id === answerId);
    if (!answer) return undefined;
    answers[node.id] = answer.id;
    index += 1;
    const result = tree.results.find((candidate) => candidate.id === answer.next);
    if (result) return index === answerIds.length ? walk(tree, answers) : undefined;
    node = tree.nodes.find((candidate) => candidate.id === answer.next);
  }

  return undefined;
}

/** The question to ask next, given the answers so far. */
export function nextNode(tree: TriageTree, answerIds: string[]): TriageNode | undefined {
  let node = tree.nodes.find((candidate) => candidate.id === tree.root);
  let index = 0;

  while (node && index < answerIds.length) {
    const answer = node.answers.find((candidate) => candidate.id === answerIds[index]);
    if (!answer) return undefined;
    index += 1;
    if (tree.results.some((candidate) => candidate.id === answer.next)) return undefined;
    node = tree.nodes.find((candidate) => candidate.id === answer.next);
  }

  return node;
}

/**
 * Phrases that reassure. A triage outcome may not contain one, because the
 * only thing this product is allowed to say about a symptom is what to do
 * next. "Normal" is fine in a week card and not fine here.
 */
export const REASSURANCE = [
  /\byou(?:'re| are) (?:fine|okay|ok|alright)\b/i,
  /\bnothing to worry about\b/i,
  /\bno (?:need|reason) to worry\b/i,
  /\bdon'?t worry\b/i,
  /\brest assured\b/i,
  /\b(?:it|this|that)(?:'s| is) (?:normal|nothing|fine)\b/i,
  /\bperfectly (?:safe|normal|fine)\b/i,
  /\bnothing (?:is|seems) wrong\b/i,
  /\bnot (?:a|an) (?:problem|concern|issue)\b/i,
];

/** Every reassurance phrase in a result's prose, as the matched text. */
export function reassuranceIn(result: TriageResult): string[] {
  const prose = [result.headline, result.body, ...(result.watchFor ?? [])].join(" ");
  return REASSURANCE.flatMap((pattern) => {
    const match = prose.match(pattern);
    return match ? [match[0]] : [];
  });
}
