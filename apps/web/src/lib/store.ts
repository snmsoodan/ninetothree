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

export interface AppState {
  version: 1;
  onboarded: boolean;
  status: "pregnant" | "parent";
  dueDate?: string;
  birthDate?: string;
  profile: Profile;
  progress: Record<string, ProgressEntry>;
  pins: string[];
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

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.version !== 1) return;
    state = { ...EMPTY_STATE, ...parsed, profile: parsed.profile ?? {} };
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

export function togglePin(actionId: string): void {
  const pinned = state.pins.includes(actionId);
  set({
    ...state,
    pins: pinned ? state.pins.filter((id) => id !== actionId) : [...state.pins, actionId],
  });
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
  return state.pins.includes(actionId);
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
