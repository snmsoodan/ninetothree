/**
 * Triage, as the phone needs it.
 *
 * The questions, the branching and the three answers all come from the shared
 * domain module and the content tree; this file only arranges them into one
 * flat model, so the screen draws strings and the tests can read the same
 * strings without a simulator.
 *
 * There is also the dialler, which is the one place on this screen where the
 * platforms differ — and they differ less than people expect: `tel:` is the
 * scheme on both, so the branch is a single `canOpenURL` call rather than a
 * per-platform file.
 */
import type { TriageTree } from "@ninetothree/content";
import {
  TRIAGE_ALL_FLAGS,
  TRIAGE_BROKEN_BODY,
  TRIAGE_BROKEN_HEADING,
  TRIAGE_PRIVACY,
  TRIAGE_SOURCES_HEADING,
  TRIAGE_START_OVER,
  TRIAGE_TRAIL_LABEL,
  TRIAGE_WATCH_HEADING,
  reviewedLine,
  triageCall,
  triageQuestionLabel,
  triageView,
  type TriageTrailStep,
} from "@ninetothree/domain";

export interface TriageChoice {
  readonly id: string;
  readonly label: string;
}

export interface TriageSource {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly url: string;
}

export interface TriageModel {
  readonly kind: "question" | "outcome" | "broken";
  /** "Question 2", or empty when there is nothing to count. */
  readonly step: string;
  readonly heading: string;
  readonly detail: string | null;
  readonly body: string;
  readonly answers: readonly TriageChoice[];
  readonly trail: readonly TriageTrailStep[];
  readonly trailLabel: string;
  readonly call: {
    readonly label: string;
    readonly phone: string | null;
    readonly instruction: string;
    /** `tel:` for the number, or `null` when the answer is a person, not a line. */
    readonly tel: string | null;
  } | null;
  readonly watch: { readonly heading: string; readonly lines: readonly string[] } | null;
  readonly sources: {
    readonly heading: string;
    readonly items: readonly TriageSource[];
    readonly reviewed: string;
  } | null;
  readonly privacy: string | null;
  readonly actions: { readonly startOver: string; readonly allFlags: string };
}

export interface TriageInput {
  readonly tree: TriageTree;
  readonly answerIds: readonly string[];
}

export function triageModel({ tree, answerIds }: TriageInput): TriageModel {
  const view = triageView(tree, answerIds);

  const base = {
    trail: view.trail,
    trailLabel: TRIAGE_TRAIL_LABEL,
    actions: { startOver: TRIAGE_START_OVER, allFlags: TRIAGE_ALL_FLAGS },
  } as const;

  if (view.kind === "question") {
    return {
      ...base,
      kind: "question",
      step: triageQuestionLabel(view.trail.length + 1),
      heading: view.node.question,
      detail: view.node.detail ?? null,
      body: "",
      answers: view.node.answers.map((answer) => ({ id: answer.id, label: answer.label })),
      call: null,
      watch: null,
      sources: null,
      privacy: TRIAGE_PRIVACY,
    };
  }

  if (view.kind === "outcome") {
    const call = triageCall(view.result.escalation);
    return {
      ...base,
      kind: "outcome",
      step: "",
      heading: view.result.headline,
      detail: null,
      body: view.result.body,
      answers: [],
      call: {
        label: call.label,
        phone: call.phone,
        instruction: call.instruction,
        tel: call.tel,
      },
      watch: view.result.watchFor?.length
        ? { heading: TRIAGE_WATCH_HEADING, lines: [...view.result.watchFor] }
        : null,
      sources: {
        heading: TRIAGE_SOURCES_HEADING,
        items: view.result.sources.map((source) => ({
          id: source.id,
          title: source.title,
          detail: source.publisher,
          url: source.url,
        })),
        reviewed: reviewedLine(view.result.reviewedBy, view.result.reviewedAt),
      },
      privacy: null,
    };
  }

  return {
    ...base,
    kind: "broken",
    step: "",
    heading: TRIAGE_BROKEN_HEADING,
    detail: null,
    body: TRIAGE_BROKEN_BODY,
    answers: [],
    call: null,
    watch: null,
    sources: null,
    privacy: null,
  };
}

/* ------------------------------------------------------------- dialling --- */

export interface Dialer {
  canOpenURL(url: string): Promise<boolean>;
  openURL(url: string): Promise<unknown>;
}

/**
 * Dial a number, or report that this device cannot.
 *
 * `canOpenURL` is the whole platform branch. Asking first is what keeps a
 * simulator — which has no dialler — from throwing into a press handler, and
 * the two `tel:` URLs above are the only strings this is ever called with.
 * Returns `false` rather than throwing, because the parent is in a hurry and
 * an unhandled promise is not a way to tell them there is no phone.
 */
export async function dial(dialer: Dialer, tel: string): Promise<boolean> {
  if (!tel.startsWith("tel:")) return false;
  const reachable = await dialer.canOpenURL(tel).catch(() => false);
  if (!reachable) return false;
  await dialer.openURL(tel).catch(() => undefined);
  return true;
}

/** The answers to keep when a parent taps a crumb: everything up to that one. */
export function truncateTo(trail: readonly TriageTrailStep[], index: number): string[] {
  return trail.slice(0, index + 1).map((step) => step.answerId);
}
