"use client";

import { useSyncExternalStore } from "react";
import { createStore, type AppState, type StoreIO } from "@ninetothree/domain";
import { ONBOARDED_COOKIE, ONBOARDED_COOKIE_MAX_AGE } from "./onboarded-cookie";

/**
 * The web binding for `@ninetothree/domain`.
 *
 * Everything a parent's state *is* — the shape, the actions, the selectors,
 * the migrations — lives in the package, because the iOS and Android apps run
 * the same machine. What is left here is the only genuinely web-specific part:
 * that "storage" means localStorage and that "has this parent onboarded?"
 * means a cookie `/` can read on the server.
 *
 * The exports below are unchanged, so every existing import and the whole of
 * `store.test.ts` keep working. That test suite is the acceptance test for the
 * move: it drives every action through this file and asserts on localStorage,
 * which is exactly the seam that changed.
 */

export * from "@ninetothree/domain";

/**
 * Three reads and writes, and one cookie.
 *
 * The `typeof window` guard is here and only here: on a server render there is
 * no storage, and the machine's in-memory default is the correct behaviour.
 */
const io: StoreIO = {
  load(key) {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  save(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  remove(key) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
  /**
   * Kept independent of the write above so a storage failure still updates the
   * cookie: a parent whose localStorage is full should not also be stranded on
   * the wrong door at `/`.
   */
  onOnboarded(onboarded) {
    document.cookie = `${ONBOARDED_COOKIE}=${onboarded ? "1" : "0"}; Path=/; Max-Age=${ONBOARDED_COOKIE_MAX_AGE}; SameSite=Lax`;
  },
};

const store = createStore(io);

// A redirect has to know the answer before the first paint, so the web reads
// storage once at module load. A native app does the same in its boot path.
if (typeof window !== "undefined") store.hydrate();

export const subscribe = store.subscribe;
export const isHydrated = store.isHydrated;
export const getSnapshot = store.getSnapshot;
export const getServerSnapshot = store.getServerSnapshot;
export const __resetForTests = store.__resetForTests;

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, isHydrated, () => false);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const completeOnboarding = store.completeOnboarding;
export const readDraft = store.readDraft;
export const saveDraft = store.saveDraft;
export const clearDraft = store.clearDraft;
export const markDone = store.markDone;
export const markSkipped = store.markSkipped;
export const clearProgress = store.clearProgress;
export const snooze = store.snooze;
export const unsnooze = store.unsnooze;
export const togglePin = store.togglePin;
export const removePin = store.removePin;
export const movePin = store.movePin;
export const setPinReminder = store.setPinReminder;
export const markReminded = store.markReminded;
export const updateProfile = store.updateProfile;
export const setProfile = store.setProfile;
export const setNotifications = store.setNotifications;
export const setReading = store.setReading;
export const setPersona = store.setPersona;
export const setHumour = store.setHumour;
export const updateDates = store.updateDates;
export const completeWeek = store.completeWeek;
export const reopenWeek = store.reopenWeek;
export const chooseOption = store.chooseOption;
export const clearChoice = store.clearChoice;
export const recordNotices = store.recordNotices;
export const dismissNotice = store.dismissNotice;
export const addAppointment = store.addAppointment;
export const updateAppointment = store.updateAppointment;
export const removeAppointment = store.removeAppointment;
export const resetAll = store.resetAll;
