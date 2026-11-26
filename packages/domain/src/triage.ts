/**
 * The safety spine, as a thing three platforms can draw.
 *
 * The questions themselves are content (`TRIAGE`), and walking them is a pure
 * function that already lives in `@ninetothree/content`. What is left — the
 * sentences around the tree, which answer is a question and which is an
 * outcome, and the number a parent is told to dial — is here, so the website
 * and the phone cannot drift apart about the one screen where drifting would
 * be dangerous.
 *
 * Two rules from the tree carry over unchanged: there is no fourth outcome and
 * no "you are fine", and the dial string is derived from the printed number so
 * the two can never disagree.
 */
import {
  ESCALATION_COPY,
  nextNode,
  walkAnswers,
  type Escalation,
  type RedFlag,
  type TriageNode,
  type TriageResult,
  type TriageTree,
} from "@ninetothree/content";

export interface TriageTrailStep {
  readonly answerId: string;
  readonly label: string;
}

export type TriageView =
  | { readonly kind: "question"; readonly node: TriageNode; readonly trail: TriageTrailStep[] }
  | { readonly kind: "outcome"; readonly result: TriageResult; readonly trail: TriageTrailStep[] }
  | { readonly kind: "broken"; readonly trail: TriageTrailStep[] };

/**
 * The trail, rebuilt from the answers rather than carried alongside them, so a
 * hand-edited URL cannot show a breadcrumb for a path that was never walked.
 */
export function triageTrail(tree: TriageTree, answerIds: readonly string[]): TriageTrailStep[] {
  const steps: TriageTrailStep[] = [];
  let node = tree.nodes.find((candidate) => candidate.id === tree.root);
  for (const answerId of answerIds) {
    const answer = node?.answers.find((candidate) => candidate.id === answerId);
    if (!answer) break;
    steps.push({ answerId: answer.id, label: answer.label });
    node = tree.nodes.find((candidate) => candidate.id === answer.next);
  }
  return steps;
}

/**
 * What the page shows for a list of answer ids. `broken` is a real state, not
 * an error: a link that was cut short has to say so and offer a way back,
 * because the alternative is a blank screen to a frightened parent.
 */
export function triageView(tree: TriageTree, answerIds: readonly string[]): TriageView {
  const outcome = walkAnswers(tree, [...answerIds]);
  if (outcome)
    return { kind: "outcome", result: outcome.result, trail: triageTrail(tree, answerIds) };

  const question = nextNode(tree, [...answerIds]);
  if (question) return { kind: "question", node: question, trail: triageTrail(tree, answerIds) };

  return { kind: "broken", trail: triageTrail(tree, answerIds) };
}

/**
 * What to do when a red flag fires, in the imperative. One sentence per
 * escalation, and every escalation has one — a missing key would render an
 * empty paragraph on the screen a parent reaches in a hurry.
 */
export const TRIAGE_INSTRUCTION: Record<Escalation, string> = {
  "call-911": "Call now. Do not drive yourself if you feel faint.",
  "call-ob-triage": "The number is on your discharge paperwork, or in your patient portal.",
  "call-pediatrician": "The number is on the card from your first visit, or in the portal.",
  "go-to-er": "Go now. Do not wait for a call back.",
  "call-poison-control": "Free, 24 hours, and they will tell you what to do.",
  "call-988": "Free, 24 hours. You can text instead of calling.",
  "call-psi": "Free, and they will find you someone local.",
  "call-dv-hotline": "Free, confidential, 24 hours.",
};

export interface TriageCall {
  /** "Call 911", "Go to the ER". */
  readonly label: string;
  /** The number as a parent reads it, or `null` when there is no fixed one. */
  readonly phone: string | null;
  /** `tel:` with nothing but digits, or `null` when there is nothing to dial. */
  readonly tel: string | null;
  readonly instruction: string;
}

/**
 * The escalation as something a phone can act on.
 *
 * `tel:` is the same scheme on iOS and Android, and it is spelled from the
 * number the parent can read rather than taken from a second field, so the
 * digits on screen and the digits dialled cannot part company.
 */
export function triageCall(escalation: Escalation): TriageCall {
  const copy = ESCALATION_COPY[escalation];
  const phone = copy.phone ?? null;
  const digits = phone === null ? "" : phone.replace(/[^0-9+]/g, "");
  return {
    label: copy.label,
    phone,
    tel: digits ? `tel:${digits}` : null,
    instruction: TRIAGE_INSTRUCTION[escalation],
  };
}

/** A review date is a fact about the page, so it carries the year. */
export function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const name = MONTHS[Number(month) - 1] ?? month;
  return `${name} ${Number(day)}, ${year}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function reviewedLine(reviewedBy: string, reviewedAt: string): string {
  return `Reviewed by ${reviewedBy} on ${formatLongDate(reviewedAt)}.`;
}

/* ---------------------------------------------------------------- copy ---
 *
 * Every sentence either platform puts on the safety screens. The website's
 * markup and the phone's cards read these, so a reworded line lands in both
 * places in one commit.
 */

export const TRIAGE_TRAIL_LABEL = "Your answers";
export const TRIAGE_PRIVACY =
  "Nothing you answer here is stored. If it is an emergency, call 911 now.";
export const TRIAGE_WATCH_HEADING = "Call back if";
export const TRIAGE_SOURCES_HEADING = "Where this comes from";
export const TRIAGE_START_OVER = "Start over";
export const TRIAGE_ALL_FLAGS = "Every warning sign";
export const TRIAGE_EXTERNAL_HINT = "Opens in your browser";

export const TRIAGE_BROKEN_HEADING = "That path is not one of ours.";
export const TRIAGE_BROKEN_BODY =
  "The link may have been cut short. Start again, or call 911 if this is an emergency.";
export const TRIAGE_BROKEN_ACTION = "Start again";

/** "Question 2". One-based, because the parent is not a programmer. */
export function triageQuestionLabel(index: number): string {
  return `Question ${index}`;
}

/**
 * The five numbers, in the order a parent is most likely to need them.
 *
 * One list, read by the safety page and by the help drawer on both platforms,
 * so the two cannot disagree about what to call. The label and the number come
 * from `ESCALATION_COPY`; only the sentence under each one lives here.
 */
export interface HelpNumber {
  readonly key: Escalation;
  readonly detail: string;
}

export const HELP_NUMBERS: readonly HelpNumber[] = [
  { key: "call-911", detail: "Anything that feels like an emergency. Trust that." },
  { key: "call-poison-control", detail: "Swallowed something, or a question about a dose." },
  { key: "call-988", detail: "If you are thinking about hurting yourself." },
  { key: "call-psi", detail: "Someone to talk to about how you feel." },
  { key: "call-dv-hotline", detail: "Free, confidential, 24 hours." },
];

export const SAFETY_HEADING = "If something is wrong";
export const SAFETY_INTRO = "This page is always here, always free, and never behind a sign-in.";
export const SAFETY_CTA = "Help me work out who to call";
export const SAFETY_CTA_NOTE =
  "A few questions, and one answer. It works without a signal, and nothing you answer is stored.";
export const SAFETY_NUMBERS_HEADING = "Who to call";
export const SAFETY_FLAGS_HEADING = "Every warning sign we know";
export const SAFETY_FLAGS_INTRO =
  "Collected from every week, in one place, so you never have to hunt for it.";
export const SAFETY_FOOTER = "We are a guide, not a doctor. If you are worried, call.";
export const SAFETY_MORE = "ACOG has more";
export const SAFETY_MORE_URL = "https://www.acog.org/womens-health";

export interface SafetyFlag {
  readonly id: string;
  readonly text: string;
  /** "Call 911", or the answer that has no fixed number. */
  readonly action: string;
  /** The number for this flag, falling back to the escalation's own, or `null`. */
  readonly phone: string | null;
  /** `tel:` for the number, when there is one to dial. */
  readonly tel: string | null;
  /** The week the flag came from, so a parent can go and read around it. */
  readonly packTitle: string;
  readonly packId: string;
}

/**
 * Every red flag in the guide, in pack order.
 *
 * A flag may carry its own number (a hospital's triage line, say); when it does
 * not, it borrows the number of the escalation it points at. That fallback is
 * here rather than in either renderer, because a flag that shows a person to
 * call on the website and nothing on the phone is a parity bug that no test of
 * the tree would catch.
 */
export function safetyFlags(
  packs: readonly {
    readonly id: string;
    readonly title: string;
    readonly redFlags: readonly RedFlag[];
  }[],
): SafetyFlag[] {
  return packs.flatMap((pack) =>
    pack.redFlags.map((flag) => {
      const call = triageCall(flag.escalation);
      const phone = flag.phone ?? call.phone;
      return {
        id: `${pack.id}-${flag.id}`,
        text: flag.text,
        action: call.label,
        phone,
        tel: phone === null ? null : `tel:${phone.replace(/[^0-9+]/g, "")}`,
        packTitle: pack.title,
        packId: pack.id,
      };
    }),
  );
}
