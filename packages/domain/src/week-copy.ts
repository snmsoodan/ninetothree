import type { Priority } from "@ninetothree/content";

/**
 * The words a week page says, in one place.
 *
 * The web page and the phone screen are two implementations of one promise, so
 * the sentences around the buttons are not written twice: the clients pass
 * counts and states in, and get back the exact strings the other client shows.
 * A copied literal drifts the day someone edits one of them, and a parent who
 * reads "3 steps set aside" on a laptop must read the same on a phone.
 *
 * Nothing here knows about React, the store or a date. `SKIP_REASONS` and
 * `LATER_OPTIONS` are the answers a sheet offers; the caller decides what
 * pressing one does.
 */

/** One answer in a sheet: the value stored, and the two lines it shows. */
export interface StepReason {
  value: string;
  label: string;
  hint: string;
}

export const SKIP_REASONS: readonly StepReason[] = [
  { value: "not-now", label: "Not this week", hint: "It will not come back on its own." },
  { value: "already-done", label: "Already done", hint: "You did this before you got here." },
  { value: "not-for-me", label: "Not for me", hint: "We will stop showing this kind of thing." },
  { value: "no-reason", label: "Skip without saying why", hint: "That is allowed." },
];

/**
 * How long "later" is, in days, with the answer's own copy.
 *
 * `days` is on the object rather than parsed from `value`, because the value is
 * what a stored reason is keyed by and a future option need not be a number.
 */
export const LATER_OPTIONS: readonly (StepReason & { days: number })[] = [
  { value: "1", days: 1, label: "Tomorrow", hint: "Back on the list in the morning." },
  { value: "3", days: 3, label: "In a few days", hint: "Back before the week is out." },
  { value: "7", days: 7, label: "Next week", hint: "Back when the next week starts." },
];

/** Only the essential step is labelled, and it is labelled as an instruction. */
export const STEP_PRIORITY_LABEL: Record<Priority, string | null> = {
  essential: "Do this one",
  recommended: null,
  optional: null,
  "skip-if": null,
};

/** "About 5 minutes", or nothing when the content does not say. */
export function minutesLabel(minutes: number | undefined): string | null {
  if (!minutes) return null;
  return `About ${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

/**
 * The heading over the week's steps.
 *
 * One step is "the one thing" because that is what it is; three are "the three
 * things". A week with zero visible steps still says "The 0 things" rather than
 * inventing a sentence the layout would have to special-case.
 */
export function stepsHeading(count: number): string {
  return count === 1 ? "The one thing" : `The ${count} things`;
}

/** What follows the heading, before the steps themselves. */
export const STEPS_SUBTITLE = "That is the whole week. Everything else can wait.";

/** The set-aside line, and the words on the button that brings them back. */
export function setAsideNotice(count: number): { line: string; action: string } {
  const steps = count === 1 ? "1 step" : `${count} steps`;
  return {
    line: `${steps} set aside for now.`,
    action: count === 1 ? "Show it now" : "Show them now",
  };
}

/** The line about steps the profile rules removed. */
export function hiddenNotice(count: number): string {
  const steps = count === 1 ? "1 step" : `${count} steps`;
  return `${steps} hidden because of what you told us.`;
}

/** "Show the 3 things" / "Hide them", for the catch-up disclosure. */
export function catchUpToggle(count: number, open: boolean): string {
  if (open) return "Hide them";
  return `Show the ${count} thing${count === 1 ? "" : "s"}`;
}

/** The status word the step shows where its buttons used to be. */
export function stepStatusLabel(
  status: "open" | "done" | "skipped",
  snoozed: boolean,
): string | null {
  if (status === "done") return "Done";
  if (status === "skipped") return "Skipped";
  return snoozed ? "Set aside for now" : null;
}

/** The two sheets a step can open, word for word, for both clients. */
export const SKIP_DIALOG = {
  title: "Skip this one?",
  body: "Nothing bad happens. It will not nag you, and it will not count against you.",
  question: "Why are you skipping?",
  cancel: "Cancel",
  confirm: "Skip it",
} as const;

export const LATER_DIALOG = {
  title: "Come back to this later?",
  body: "It leaves this week and comes back on its own. Nothing is lost, and nothing counts against you.",
  question: "When should it come back?",
  cancel: "Cancel",
  confirm: "Set it aside",
} as const;
