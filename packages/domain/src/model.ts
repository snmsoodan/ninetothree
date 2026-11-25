import type { Profile } from "@ninetothree/rules";
import type { Persona, RecallBecause } from "@ninetothree/content/core";
import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from "./notifications";
import { DEFAULT_READING, type ReadingPrefs } from "./reading";
import { DEFAULT_HUMOUR, DEFAULT_PERSONA } from "./persona";

/**
 * What the product remembers about a parent.
 *
 * The shape is the contract, and it is the same shape on all three platforms:
 * one JSON object under one key. That is deliberate — a web parent who signs
 * in on a phone is carrying this object, and a version-2 migration written
 * once has to be right for all of them.
 */

export const STORAGE_KEY = "ninetothree.v1";

/**
 * The onboarding draft lives under its own key, not inside `AppState`.
 *
 * A half-finished onboarding is not the parent's state — it is a form they
 * walked away from. Keeping it out of `AppState` means it never reaches the
 * history export, the dashboard, or a sync target.
 */
export const DRAFT_KEY = "ninetothree.onboarding.v1";

/** A draft older than this is a different pregnancy. Start again. */
export const DRAFT_TTL_DAYS = 7;

export type OnboardingStep =
  "persona" | "status" | "date" | "country" | "feeding" | "first" | "ready";

/**
 * The steps, per reader.
 *
 * Feeding and first-baby are the parent's business: a grandparent has no
 * feeding method to choose, and asking would be a question they cannot answer
 * truthfully. The persona step is first because the next question — "I am
 * pregnant / my baby is here" — is only correct for the parent.
 */
export function stepsFor(persona: Persona): OnboardingStep[] {
  return persona === "parent"
    ? ["persona", "status", "date", "country", "feeding", "first", "ready"]
    : ["persona", "status", "date", "country", "ready"];
}

/** The parent's flow. Used where no persona is known yet — the server render. */
export const ONBOARDING_STEPS: OnboardingStep[] = stepsFor("parent");

/**
 * The draft is the form's own state, nothing more. `""` means "not answered
 * yet", which is different from an answer of "undecided".
 */
export interface OnboardingDraft {
  step: OnboardingStep;
  persona: Persona;
  status: "pregnant" | "parent";
  date: string;
  country: string;
  feeding: string;
  firstBaby: string;
  /** ISO timestamp of the last change, used for the TTL. */
  at: string;
}

export type ProgressStatus = "done" | "skipped";

/**
 * What a parent did, and what it was called when they did it.
 *
 * History is a snapshot for the same reason a pin is: content is versioned,
 * and an action can be renamed or retired between releases. If a progress
 * entry were a bare id, a rename would rewrite a parent's history and a
 * retirement would erase it. The snapshot is what the history falls back to
 * when the action is no longer in the registry; when it still is, the live
 * content wins.
 */
export interface ProgressEntry {
  status: ProgressStatus;
  /** ISO timestamp. Used for the weekly email and for nothing else. */
  at: string;
  /** Why it was skipped. Optional, and never required. */
  reason?: string;
  /** The action's title at the moment it was marked. */
  title?: string;
  packId?: string;
  packTitle?: string;
}

/** The minimum a caller must know to record progress honestly. */
export interface ProgressSnapshot {
  id: string;
  title: string;
  packId: string;
  packTitle: string;
}

/**
 * A pin is a snapshot, not a pointer.
 *
 * Content is versioned and an action can be renamed or retired between
 * releases. If a pin were a bare id, a rename would silently delete it from a
 * parent's shelf. The snapshot is what the shelf falls back to when the action
 * is no longer in the registry; when it still is, the live content wins.
 */
export interface Pin {
  /** The action id. */
  id: string;
  /** The action's title at the moment it was pinned. */
  title: string;
  packId: string;
  packTitle: string;
  /** ISO timestamp. The tiebreak when order is not explicit. */
  at: string;
  /** ISO date, YYYY-MM-DD. The day the parent asked to be reminded. */
  remindOn?: string;
}

/**
 * An appointment the parent added themselves. The generated schedule is
 * derived from the due date and never stored; only what a parent typed is.
 */
export interface CustomAppointment {
  id: string;
  label: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  who?: string;
  note?: string;
  /** ISO timestamp. */
  at: string;
}

/**
 * A snooze is a snapshot too, and it is not a skip.
 *
 * Skipping says "this is not for me". Snoozing says "not today" — the step
 * comes back on its own, without the parent having to remember it. It carries
 * the title and week for the same reason a pin does: the step has to be
 * nameable on the day it returns even if the content moved on.
 */
export interface SnoozedEntry {
  id: string;
  title: string;
  packId: string;
  packTitle: string;
  /** ISO date, YYYY-MM-DD. The step comes back on this date. */
  until: string;
  /** ISO timestamp. */
  at: string;
}

/**
 * A week is finished when its steps are, or when a parent says so.
 *
 * `forced` records which of the two happened, because they mean different
 * things: a settled week is finished because the work is, and a forced one is
 * finished because the parent decided to move on. Only a forced week can be
 * reopened — there is nothing to reopen in a week whose steps are all done or
 * skipped.
 */
export interface WeekCompletion {
  /** ISO timestamp of the first time it was marked. */
  at: string;
  /** True when steps were still open. */
  forced: boolean;
}

/**
 * The option a parent picked from a chooser.
 *
 * A choice is a snapshot for the same reason a pin is: the option may be
 * renamed or retired, and the step still has to say what was chosen. It is
 * separate from `progress` because choosing is not doing — a parent can pick
 * the chair and still not have bought it.
 */
export interface Choice {
  optionId: string;
  /** The option's label at the time it was chosen. */
  label: string;
  /** ISO timestamp. */
  at: string;
}

/**
 * A recall that reached this parent, and what it matched.
 *
 * The notice is the record of what an email would have said. There is no
 * transport yet, so the queue is the honest local-first version of "email if
 * matched": exactly one notice per (recall, reason) pair, and a dismissal that
 * survives a reload.
 */
export interface Notice {
  /** `${recallId}:${matchedOn}` — the same key `recallKey` builds. */
  id: string;
  recallId: string;
  /** The recall's title at the time it was recorded. */
  title: string;
  product: string;
  because: RecallBecause;
  matchedOn: string;
  /** ISO timestamp, when the notice was recorded. */
  at: string;
  /** ISO timestamp, when the parent put it away. */
  dismissedAt?: string;
}

export interface AppState {
  version: 1;
  onboarded: boolean;
  status: "pregnant" | "parent";
  dueDate?: string;
  birthDate?: string;
  profile: Profile;
  progress: Record<string, ProgressEntry>;
  pins: Pin[];
  appointments: CustomAppointment[];
  snoozed: Record<string, SnoozedEntry>;
  completed: Record<string, WeekCompletion>;
  choices: Record<string, Choice>;
  notices: Record<string, Notice>;
  notifications: NotificationPrefs;
  /** Reminder key → the ISO timestamp it was put away. */
  reminded: Record<string, string>;
  /** How the words are shown. Not a theme: three answers zoom cannot give. */
  reading: ReadingPrefs;
  /**
   * Who is reading. A view preference, not a fact about the baby, so it is
   * kept out of `profile` and out of the rules engine. See PERSONAS.md.
   */
  persona: Persona;
  /** Whether the light line is allowed to be funny. */
  humour: boolean;
}

export const EMPTY_STATE: AppState = {
  version: 1,
  onboarded: false,
  status: "pregnant",
  profile: {},
  progress: {},
  pins: [],
  appointments: [],
  snoozed: {},
  completed: {},
  choices: {},
  notices: {},
  notifications: DEFAULT_NOTIFICATIONS,
  reminded: {},
  reading: DEFAULT_READING,
  persona: DEFAULT_PERSONA,
  humour: DEFAULT_HUMOUR,
};
