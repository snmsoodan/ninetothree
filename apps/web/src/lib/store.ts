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

export type ProgressStatus = "done" | "skipped";

export interface ProgressEntry {
  status: ProgressStatus;
  /** ISO timestamp. Used for the weekly email and for nothing else. */
  at: string;
  /** Why it was skipped. Optional, and never required. */
  reason?: string;
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

export interface AppState {
  version: 1;
  onboarded: boolean;
  status: "pregnant" | "parent";
  dueDate?: string;
  birthDate?: string;
  profile: Profile;
  progress: Record<string, ProgressEntry>;
  pins: Pin[];
}

export const EMPTY_STATE: AppState = {
  version: 1,
  onboarded: false,
  status: "pregnant",
  profile: {},
  progress: {},
  pins: [],
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
}

export function markDone(actionId: string, at = new Date().toISOString()): void {
  set({
    ...state,
    progress: { ...state.progress, [actionId]: { status: "done", at } },
  });
}

export function markSkipped(
  actionId: string,
  reason?: string,
  at = new Date().toISOString(),
): void {
  set({
    ...state,
    progress: {
      ...state.progress,
      [actionId]: reason ? { status: "skipped", at, reason } : { status: "skipped", at },
    },
  });
}

/** Undo. A parent who taps the wrong thing should not have to live with it. */
export function clearProgress(actionId: string): void {
  const next = { ...state.progress };
  delete next[actionId];
  set({ ...state, progress: next });
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

export function resetAll(): void {
  set({ ...EMPTY_STATE });
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
