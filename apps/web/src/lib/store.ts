"use client";

import { useSyncExternalStore } from "react";
import type { Profile } from "@ninetothree/rules";

/**
 * Local-first state.
 *
 * The product has to work at 3am with no signal, so the source of truth
 * on the device is localStorage and the server is a sync target, not a
 * gate. This module is the only place that touches storage, so swapping
 * in a Postgres-backed adapter later is a one-file change.
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

export type OnboardingStep = "status" | "date" | "country" | "feeding" | "first" | "ready";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "status",
  "date",
  "country",
  "feeding",
  "first",
  "ready",
];

/**
 * The draft is the form's own state, nothing more. `""` means "not answered
 * yet", which is different from an answer of "undecided".
 */
export interface OnboardingDraft {
  step: OnboardingStep;
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
};

let state: AppState = EMPTY_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked. The app keeps working in memory;
    // losing a pin is not worth an error dialog.
  }
}

/**
 * v1 stored pins as bare ids. They are upgraded in place with an empty
 * snapshot, which the shelf resolves from the live registry; a legacy pin whose
 * action is gone is dropped rather than shown as a blank row.
 */
function migratePins(raw: unknown): Pin[] {
  if (!Array.isArray(raw)) return [];
  const pins: Pin[] = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      pins.push({ id: entry, title: "", packId: "", packTitle: "", at: "" });
    } else if (entry && typeof entry === "object" && typeof (entry as Pin).id === "string") {
      const pin = entry as Partial<Pin>;
      pins.push({
        id: pin.id as string,
        title: pin.title ?? "",
        packId: pin.packId ?? "",
        packTitle: pin.packTitle ?? "",
        at: pin.at ?? "",
      });
    }
  }
  return pins;
}

function migrateAppointments(raw: unknown): CustomAppointment[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is CustomAppointment =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof (entry as CustomAppointment).id === "string" &&
      typeof (entry as CustomAppointment).label === "string" &&
      typeof (entry as CustomAppointment).date === "string",
  );
}

function migrateSnoozed(raw: unknown): Record<string, SnoozedEntry> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const snoozed: Record<string, SnoozedEntry> = {};
  for (const [id, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const value = entry as Partial<SnoozedEntry>;
    if (typeof value.until !== "string") continue;
    snoozed[id] = {
      id,
      title: value.title ?? "",
      packId: value.packId ?? "",
      packTitle: value.packTitle ?? "",
      until: value.until,
      at: value.at ?? "",
    };
  }
  return snoozed;
}

function migrateCompleted(raw: unknown): Record<string, WeekCompletion> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const completed: Record<string, WeekCompletion> = {};
  for (const [packId, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const value = entry as Partial<WeekCompletion>;
    if (typeof value.at !== "string") continue;
    completed[packId] = { at: value.at, forced: value.forced === true };
  }
  return completed;
}

function migrateChoices(raw: unknown): Record<string, Choice> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const choices: Record<string, Choice> = {};
  for (const [actionId, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const value = entry as Partial<Choice>;
    if (typeof value.optionId !== "string" || typeof value.label !== "string") continue;
    choices[actionId] = { optionId: value.optionId, label: value.label, at: value.at ?? "" };
  }
  return choices;
}

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.version !== 1) return;
    state = {
      ...EMPTY_STATE,
      ...parsed,
      profile: parsed.profile ?? {},
      pins: migratePins(parsed.pins),
      appointments: migrateAppointments(parsed.appointments),
      snoozed: migrateSnoozed(parsed.snoozed),
      completed: migrateCompleted(parsed.completed),
      choices: migrateChoices(parsed.choices),
    };
    emit();
  } catch {
    // Corrupt state is discarded rather than repaired. A parent should
    // never see a parse error.
  }
}

if (typeof window !== "undefined") hydrate();

export function subscribe(listener: () => void): () => void {
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * True once localStorage has been read. Redirects must wait for this, or a
 * reload bounces a parent back to onboarding before their state loads.
 */
export function isHydrated(): boolean {
  return hydrated;
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, isHydrated, () => false);
}

export function getSnapshot(): AppState {
  return state;
}

export function getServerSnapshot(): AppState {
  return EMPTY_STATE;
}

function set(next: AppState): void {
  state = next;
  persist();
  emit();
}

/** Test-only. Resets the module between cases. */
export function __resetForTests(): void {
  state = EMPTY_STATE;
  hydrated = false;
  listeners.clear();
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---- Actions -------------------------------------------------------------

export function completeOnboarding(input: {
  status: "pregnant" | "parent";
  dueDate?: string;
  birthDate?: string;
  profile: Profile;
}): void {
  set({
    ...state,
    onboarded: true,
    status: input.status,
    dueDate: input.dueDate,
    birthDate: input.birthDate,
    profile: input.profile,
  });
  clearDraft();
}

/**
 * Reads a half-finished onboarding, or nothing.
 *
 * Every field is checked, because this is the one place a parent's own
 * storage can hand us a shape we did not write. A draft that fails any check
 * is treated as absent rather than repaired — a repaired form is a form that
 * silently answers a question the parent did not.
 */
export function readDraft(now = new Date()): OnboardingDraft | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const draft = parsed as Partial<OnboardingDraft>;
  if (typeof draft.step !== "string" || !ONBOARDING_STEPS.includes(draft.step as OnboardingStep)) {
    return null;
  }
  if (draft.status !== "pregnant" && draft.status !== "parent") return null;
  if (typeof draft.date !== "string" || draft.date === "" || typeof draft.at !== "string") {
    return null;
  }

  const age = now.getTime() - Date.parse(draft.at);
  if (!Number.isFinite(age) || age > DRAFT_TTL_DAYS * 86_400_000) return null;

  return {
    step: draft.step as OnboardingStep,
    status: draft.status,
    date: draft.date,
    country: typeof draft.country === "string" ? draft.country : "",
    feeding: typeof draft.feeding === "string" ? draft.feeding : "",
    firstBaby: typeof draft.firstBaby === "string" ? draft.firstBaby : "",
    at: draft.at,
  };
}

/**
 * No `typeof window` guard: on the server the access throws a ReferenceError,
 * which is exactly what the catch is for. A guard would be a branch that can
 * never be taken in a browser and can never be tested.
 */
export function saveDraft(draft: OnboardingDraft): void {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // A draft is a convenience. Losing it costs the parent one screen.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to do.
  }
}

/**
 * Idempotent on purpose. A double tap on a phone is one intention, not two,
 * and the second one must not move the timestamp or re-announce the change.
 */
export function markDone(input: ProgressSnapshot, at = new Date().toISOString()): void {
  if (state.progress[input.id]?.status === "done") return;
  set({
    ...state,
    progress: {
      ...state.progress,
      [input.id]: {
        status: "done",
        at,
        title: input.title,
        packId: input.packId,
        packTitle: input.packTitle,
      },
    },
  });
}

export function markSkipped(
  input: ProgressSnapshot,
  reason?: string,
  at = new Date().toISOString(),
): void {
  if (state.progress[input.id]?.status === "skipped") return;
  const entry: ProgressEntry = {
    status: "skipped",
    at,
    title: input.title,
    packId: input.packId,
    packTitle: input.packTitle,
  };
  if (reason) entry.reason = reason;
  set({ ...state, progress: { ...state.progress, [input.id]: entry } });
}

/** Undo. A parent who taps the wrong thing should not have to live with it. */
export function clearProgress(actionId: string): void {
  const next = { ...state.progress };
  delete next[actionId];
  set({ ...state, progress: next });
}

/**
 * Snooze until a date. The step leaves the week and comes back on its own,
 * which is the difference between "not today" and "not for me".
 */
export function snooze(
  input: ProgressSnapshot,
  until: string,
  at = new Date().toISOString(),
): void {
  set({
    ...state,
    snoozed: { ...state.snoozed, [input.id]: { ...input, until, at } },
  });
}

export function unsnooze(actionId: string): void {
  const next = { ...state.snoozed };
  delete next[actionId];
  set({ ...state, snoozed: next });
}

export function togglePin(
  input: { id: string; title: string; packId: string; packTitle: string },
  at = new Date().toISOString(),
): void {
  const pinned = state.pins.some((pin) => pin.id === input.id);
  set({
    ...state,
    pins: pinned
      ? state.pins.filter((pin) => pin.id !== input.id)
      : [...state.pins, { ...input, at }],
  });
}

export function removePin(actionId: string): void {
  set({ ...state, pins: state.pins.filter((pin) => pin.id !== actionId) });
}

/**
 * Reorder by one place. Buttons, not drag: a drag handle is unusable with a
 * screen reader and unreliable with one hand holding a baby.
 */
export function movePin(actionId: string, direction: "up" | "down"): void {
  const index = state.pins.findIndex((pin) => pin.id === actionId);
  if (index === -1) return;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= state.pins.length) return;
  const pins = [...state.pins];
  // `index` came from findIndex and is >= 0, so the splice always yields one.
  const [moved] = pins.splice(index, 1) as [Pin];
  pins.splice(target, 0, moved);
  set({ ...state, pins });
}

export function updateProfile(profile: Profile): void {
  set({ ...state, profile: { ...state.profile, ...profile } });
}

/**
 * Replaces the profile outright. `updateProfile` merges, which cannot express
 * a field being cleared: a key deleted from the new object is put back by the
 * spread of the old one. Anything that can clear a field must use this.
 */
export function setProfile(profile: Profile): void {
  set({ ...state, profile });
}

/**
 * Changing a date is not starting over. A parent who corrects a due date
 * keeps their pins, their progress, and their profile.
 */
export function updateDates(input: {
  status?: "pregnant" | "parent";
  dueDate?: string;
  birthDate?: string;
}): void {
  const next: AppState = { ...state };
  if (input.status) next.status = input.status;
  if (input.dueDate !== undefined) next.dueDate = input.dueDate;
  if (input.birthDate !== undefined) next.birthDate = input.birthDate;
  set(next);
}

/**
 * Marks a week finished. Idempotent: a second call keeps the first timestamp
 * and the first `forced` flag, so a retry can never move the date a parent
 * finished a week.
 */
export function completeWeek(packId: string, forced: boolean, at?: string): void {
  if (state.completed[packId]) return;
  set({
    ...state,
    completed: {
      ...state.completed,
      [packId]: { at: at ?? new Date().toISOString(), forced },
    },
  });
}

/** Takes a week back to unfinished. A no-op when it was never marked. */
export function reopenWeek(packId: string): void {
  if (!state.completed[packId]) return;
  const completed = { ...state.completed };
  delete completed[packId];
  set({ ...state, completed });
}

/**
 * Records the option a parent picked. Replaces an earlier choice, because
 * changing your mind is the normal case, not an error.
 */
export function chooseOption(actionId: string, optionId: string, label: string, at?: string): void {
  set({
    ...state,
    choices: {
      ...state.choices,
      [actionId]: { optionId, label, at: at ?? new Date().toISOString() },
    },
  });
}

/** Forgets a choice, so the step goes back to offering the chooser. */
export function clearChoice(actionId: string): void {
  if (!state.choices[actionId]) return;
  const choices = { ...state.choices };
  delete choices[actionId];
  set({ ...state, choices });
}

export function resetAll(): void {
  set({ ...EMPTY_STATE });
  clearDraft();
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to do. The in-memory reset already happened.
    }
  }
}

// ---- Selectors -----------------------------------------------------------

export function isDone(state: AppState, actionId: string): boolean {
  return state.progress[actionId]?.status === "done";
}

export function isSkipped(state: AppState, actionId: string): boolean {
  return state.progress[actionId]?.status === "skipped";
}

/**
 * True while the snooze is still in the future. `today` is passed in rather
 * than read from the clock so the answer is the same on the server and the
 * client, and so a test can move time without faking timers.
 */
export function isSnoozed(state: AppState, actionId: string, today: string): boolean {
  const entry = state.snoozed[actionId];
  return Boolean(entry && entry.until > today);
}

export function chosenOption(state: AppState, actionId: string): Choice | undefined {
  return state.choices[actionId];
}

export function isWeekComplete(state: AppState, packId: string): boolean {
  return Boolean(state.completed[packId]);
}

export function isPinned(state: AppState, actionId: string): boolean {
  return state.pins.some((pin) => pin.id === actionId);
}

export type StageInputValue =
  { status: "pregnant"; dueDate: string } | { status: "parent"; birthDate: string };

/** The date the product should treat as "today" for this parent. */
export function stageInput(state: AppState): StageInputValue | null {
  if (state.status === "pregnant" && state.dueDate) {
    return { status: "pregnant", dueDate: state.dueDate };
  }
  if (state.status === "parent" && state.birthDate) {
    return { status: "parent", birthDate: state.birthDate };
  }
  return null;
}

export function addAppointment(
  input: { label: string; date: string; who?: string; note?: string },
  at = new Date().toISOString(),
): void {
  const id = `own-${at}-${state.appointments.length}`;
  set({
    ...state,
    appointments: [...state.appointments, { id, ...input, at }],
  });
}

export function updateAppointment(
  id: string,
  patch: Partial<Pick<CustomAppointment, "label" | "date" | "who" | "note">>,
): void {
  set({
    ...state,
    appointments: state.appointments.map((appointment) =>
      appointment.id === id ? { ...appointment, ...patch } : appointment,
    ),
  });
}

export function removeAppointment(id: string): void {
  set({
    ...state,
    appointments: state.appointments.filter((appointment) => appointment.id !== id),
  });
}
