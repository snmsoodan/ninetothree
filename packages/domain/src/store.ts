import { recallKey, type Persona, type RecallMatch } from "@ninetothree/content/core";
import type { Profile } from "@ninetothree/rules";
import { memoryIO, type StoreIO } from "./io";
import { decodeDraft, decodeState } from "./migrate";
import {
  DRAFT_KEY,
  EMPTY_STATE,
  STORAGE_KEY,
  type AppState,
  type Choice,
  type CustomAppointment,
  type Notice,
  type OnboardingDraft,
  type Pin,
  type ProgressEntry,
  type ProgressSnapshot,
} from "./model";
import type { NotificationPrefs } from "./notifications";
import type { ReadingPrefs } from "./reading";
import { DEFAULT_PERSONA } from "./persona";

/**
 * The state machine, with storage as an argument.
 *
 * Every platform runs this same code. The web supplies an adapter over
 * localStorage, iOS and Android supply one over AsyncStorage or a synchronous
 * in-memory cache in front of it, and a server render supplies nothing — the
 * in-memory default — so the machine works and writes nowhere.
 *
 * Hydration is lazy and synchronous: the first `subscribe` (or `getState` on
 * a platform that hydrates at boot) reads storage once and never again. The
 * web binding calls `hydrate()` at module load because a redirect has to know
 * the answer before the first paint; an app calls it once at boot.
 */
export function createStore(io: StoreIO = memoryIO()) {
  let state: AppState = EMPTY_STATE;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function emit(): void {
    for (const listener of listeners) listener();
  }

  function persist(next: AppState): void {
    try {
      io.save(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be full or blocked. The app keeps working in memory;
      // losing a pin is not worth an error dialog.
    }
    try {
      io.onOnboarded?.(next.onboarded);
    } catch {
      // A blocked cookie jar means `/` falls back to asking on the client,
      // which is slower but still correct.
    }
  }

  function hydrate(): void {
    if (hydrated) return;
    hydrated = true;
    let raw: string | null = null;
    try {
      raw = io.load(STORAGE_KEY);
    } catch {
      return;
    }
    const stored = decodeState(raw);
    if (!stored) return;
    state = stored;
    emit();
  }

  function set(next: AppState): void {
    state = next;
    persist(next);
    emit();
  }

  function subscribe(listener: () => void): () => void {
    hydrate();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  /**
   * True once storage has been read. Redirects must wait for this, or a
   * reload bounces a parent back to onboarding before their state loads.
   */
  function isHydrated(): boolean {
    return hydrated;
  }

  function getSnapshot(): AppState {
    return state;
  }

  /** Test-only. Resets the instance between cases. */
  function __resetForTests(): void {
    state = EMPTY_STATE;
    hydrated = false;
    listeners.clear();
  }

  // ---- Draft ---------------------------------------------------------------

  /**
   * Reads a half-finished onboarding, or nothing.
   *
   * Storage is read through the port so a native draft is the same draft: a
   * parent who starts onboarding on the web and opens the app finds the form
   * where they left it, once the two share a backend.
   */
  function readDraft(now = new Date()): OnboardingDraft | null {
    let raw: string | null = null;
    try {
      raw = io.load(DRAFT_KEY);
    } catch {
      return null;
    }
    return decodeDraft(raw, now);
  }

  /**
   * No `typeof window` guard: the port is the guard. On a server render the
   * in-memory default absorbs the write, which is what "no storage" means.
   */
  function saveDraft(draft: OnboardingDraft): void {
    try {
      io.save(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // A draft is a convenience. Losing it costs the parent one screen.
    }
  }

  function clearDraft(): void {
    try {
      io.remove(DRAFT_KEY);
    } catch {
      // Nothing to do.
    }
  }

  // ---- Onboarding ----------------------------------------------------------

  function completeOnboarding(input: {
    status: "pregnant" | "parent";
    persona?: Persona;
    dueDate?: string;
    birthDate?: string;
    profile: Profile;
  }): void {
    set({
      ...state,
      onboarded: true,
      status: input.status,
      persona: input.persona ?? DEFAULT_PERSONA,
      dueDate: input.dueDate,
      birthDate: input.birthDate,
      profile: input.profile,
    });
    clearDraft();
  }

  // ---- Progress ------------------------------------------------------------

  /**
   * Idempotent on purpose. A double tap on a phone is one intention, not two,
   * and the second one must not move the timestamp or re-announce the change.
   */
  function markDone(input: ProgressSnapshot, at = new Date().toISOString()): void {
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

  function markSkipped(
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
  function clearProgress(actionId: string): void {
    const next = { ...state.progress };
    delete next[actionId];
    set({ ...state, progress: next });
  }

  /**
   * Snooze until a date. The step leaves the week and comes back on its own,
   * which is the difference between "not today" and "not for me".
   */
  function snooze(input: ProgressSnapshot, until: string, at = new Date().toISOString()): void {
    set({
      ...state,
      snoozed: { ...state.snoozed, [input.id]: { ...input, until, at } },
    });
  }

  function unsnooze(actionId: string): void {
    const next = { ...state.snoozed };
    delete next[actionId];
    set({ ...state, snoozed: next });
  }

  // ---- Pins ----------------------------------------------------------------

  function togglePin(
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

  function removePin(actionId: string): void {
    set({ ...state, pins: state.pins.filter((pin) => pin.id !== actionId) });
  }

  /**
   * Reorder by one place. Buttons, not drag: a drag handle is unusable with a
   * screen reader and unreliable with one hand holding a baby.
   */
  function movePin(actionId: string, direction: "up" | "down"): void {
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

  /**
   * Sets or clears the day a pin should be reminded on.
   *
   * A reminder is a property of the pin, not a separate object: unpinning
   * removes the reminder with it, and there is no second list to keep in step.
   */
  function setPinReminder(id: string, remindOn?: string): void {
    set({
      ...state,
      pins: state.pins.map((pin) => {
        if (pin.id !== id) return pin;
        const { remindOn: _previous, ...rest } = pin;
        return remindOn ? { ...rest, remindOn } : rest;
      }),
    });
  }

  /**
   * Records that a reminder was put away, so it does not come back today.
   *
   * Idempotent: the first timestamp wins, so a double click cannot move the
   * record of when a parent dismissed something.
   */
  function markReminded(keys: string[], at?: string): void {
    const fresh = keys.filter((key) => state.reminded[key] === undefined);
    if (fresh.length === 0) return;
    const stamp = at ?? new Date().toISOString();
    const reminded = { ...state.reminded };
    for (const key of fresh) reminded[key] = stamp;
    set({ ...state, reminded });
  }

  // ---- Preferences ---------------------------------------------------------

  function updateProfile(profile: Profile): void {
    set({ ...state, profile: { ...state.profile, ...profile } });
  }

  /**
   * Replaces the profile outright. `updateProfile` merges, which cannot express
   * a field being cleared: a key deleted from the new object is put back by the
   * spread of the old one. Anything that can clear a field must use this.
   */
  function setProfile(profile: Profile): void {
    set({ ...state, profile });
  }

  /**
   * Merges a patch into the notification preferences.
   *
   * A patch, not a replacement: the settings screen changes one toggle at a
   * time, and a replacement would silently reset the others to their defaults.
   */
  function setNotifications(patch: Partial<NotificationPrefs>): void {
    set({ ...state, notifications: { ...state.notifications, ...patch } });
  }

  /**
   * Reading preferences are merged, not replaced, so a caller can change one
   * without knowing the other two.
   */
  function setReading(patch: Partial<ReadingPrefs>): void {
    set({ ...state, reading: { ...state.reading, ...patch } });
  }

  /**
   * Reading as someone else is a view change, not a re-onboarding.
   *
   * It takes effect immediately, it keeps every pin and every completed step,
   * and it is reversible in one tap — which is the only reason it is safe to
   * offer at all.
   */
  function setPersona(persona: Persona): void {
    set({ ...state, persona });
  }

  function setHumour(humour: boolean): void {
    set({ ...state, humour });
  }

  /**
   * Changing a date is not starting over. A parent who corrects a due date
   * keeps their pins, their progress, and their profile.
   */
  function updateDates(input: {
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

  // ---- Weeks ---------------------------------------------------------------

  /**
   * Marks a week finished. Idempotent: a second call keeps the first timestamp
   * and the first `forced` flag, so a retry can never move the date a parent
   * finished a week.
   */
  function completeWeek(packId: string, forced: boolean, at?: string): void {
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
  function reopenWeek(packId: string): void {
    if (!state.completed[packId]) return;
    const completed = { ...state.completed };
    delete completed[packId];
    set({ ...state, completed });
  }

  // ---- Choices -------------------------------------------------------------

  /**
   * Records the option a parent picked. Replaces an earlier choice, because
   * changing your mind is the normal case, not an error.
   */
  function chooseOption(actionId: string, optionId: string, label: string, at?: string): void {
    const choice: Choice = { optionId, label, at: at ?? new Date().toISOString() };
    set({
      ...state,
      choices: { ...state.choices, [actionId]: choice },
    });
  }

  /** Forgets a choice, so the step goes back to offering the chooser. */
  function clearChoice(actionId: string): void {
    if (!state.choices[actionId]) return;
    const choices = { ...state.choices };
    delete choices[actionId];
    set({ ...state, choices });
  }

  // ---- Notices -------------------------------------------------------------

  /**
   * Records every match that has not been recorded before, and returns how many
   * were new.
   *
   * Idempotent on purpose: a parent who dismissed a notice must not see it again
   * on the next sync, and a sync that runs twice must not double the queue. The
   * key carries the reason as well as the recall, so a parent who put away a
   * notice about a pinned step still hears about it if they later choose the
   * exact product that was recalled.
   */
  function recordNotices(matches: RecallMatch[], at?: string): number {
    const stamp = at ?? new Date().toISOString();
    const fresh = matches.filter((match) => !state.notices[recallKey(match)]);
    if (fresh.length === 0) return 0;
    const notices: Record<string, Notice> = { ...state.notices };
    for (const match of fresh) {
      const id = recallKey(match);
      notices[id] = {
        id,
        recallId: match.recall.id,
        title: match.recall.title,
        product: match.recall.product,
        because: match.because,
        matchedOn: match.matchedOn,
        at: stamp,
      };
    }
    set({ ...state, notices });
    return fresh.length;
  }

  /** Puts a notice away. The record stays, so it cannot come back. */
  function dismissNotice(id: string, at?: string): void {
    const notice = state.notices[id];
    if (!notice || notice.dismissedAt) return;
    set({
      ...state,
      notices: {
        ...state.notices,
        [id]: { ...notice, dismissedAt: at ?? new Date().toISOString() },
      },
    });
  }

  // ---- Appointments --------------------------------------------------------

  function addAppointment(
    input: { label: string; date: string; who?: string; note?: string },
    at = new Date().toISOString(),
  ): void {
    const id = `own-${at}-${state.appointments.length}`;
    set({
      ...state,
      appointments: [...state.appointments, { id, ...input, at }],
    });
  }

  function updateAppointment(
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

  function removeAppointment(id: string): void {
    set({
      ...state,
      appointments: state.appointments.filter((appointment) => appointment.id !== id),
    });
  }

  // ---- Everything ----------------------------------------------------------

  function resetAll(): void {
    set({ ...EMPTY_STATE });
    clearDraft();
    try {
      io.remove(STORAGE_KEY);
    } catch {
      // Nothing to do. The in-memory reset already happened.
    }
  }

  return {
    getSnapshot,
    getServerSnapshot: (): AppState => EMPTY_STATE,
    getState: getSnapshot,
    isHydrated,
    hydrate,
    subscribe,
    __resetForTests,
    readDraft,
    saveDraft,
    clearDraft,
    completeOnboarding,
    markDone,
    markSkipped,
    clearProgress,
    snooze,
    unsnooze,
    togglePin,
    removePin,
    movePin,
    setPinReminder,
    markReminded,
    updateProfile,
    setProfile,
    setNotifications,
    setReading,
    setPersona,
    setHumour,
    updateDates,
    completeWeek,
    reopenWeek,
    chooseOption,
    clearChoice,
    recordNotices,
    dismissNotice,
    addAppointment,
    updateAppointment,
    removeAppointment,
    resetAll,
  };
}

export type Store = ReturnType<typeof createStore>;
