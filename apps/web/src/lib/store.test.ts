import { renderHook } from "@testing-library/react";
import { writeField } from "@ninetothree/rules";
import type { RecallMatch } from "@ninetothree/content";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DRAFT_KEY,
  EMPTY_STATE,
  STORAGE_KEY,
  __resetForTests,
  addAppointment,
  chooseOption,
  chosenOption,
  clearChoice,
  clearDraft,
  clearProgress,
  dismissNotice,
  recordNotices,
  visibleNotices,
  completeOnboarding,
  completeWeek,
  getServerSnapshot,
  getSnapshot,
  isHydrated,
  useHydrated,
  isDone,
  isPinned,
  movePin,
  removeAppointment,
  removePin,
  reopenWeek,
  isSkipped,
  isSnoozed,
  isWeekComplete,
  markDone,
  markSkipped,
  readDraft,
  saveDraft,
  resetAll,
  markReminded,
  setNotifications,
  setPinReminder,
  setProfile,
  snooze,
  stageInput,
  subscribe,
  togglePin,
  unsnooze,
  updateAppointment,
  updateDates,
  updateProfile,
} from "./store";

/** The minimum a caller must know to record progress honestly. */
function step(id: string) {
  return { id, title: `Step ${id}`, packId: "test-week", packTitle: "Week 28" };
}

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
});

describe("the initial state", () => {
  it("starts empty and not onboarded", () => {
    expect(getSnapshot()).toEqual(EMPTY_STATE);
    expect(getSnapshot().onboarded).toBe(false);
  });

  it("serves the empty state on the server so hydration matches", () => {
    expect(getServerSnapshot()).toBe(EMPTY_STATE);
  });
});

describe("completeOnboarding", () => {
  it("records a pregnancy and its due date", () => {
    completeOnboarding({ status: "pregnant", dueDate: "2026-12-01", profile: {} });
    const state = getSnapshot();
    expect(state.onboarded).toBe(true);
    expect(state.status).toBe("pregnant");
    expect(state.dueDate).toBe("2026-12-01");
    expect(state.birthDate).toBeUndefined();
  });

  it("records a birth date for a parent", () => {
    completeOnboarding({ status: "parent", birthDate: "2026-01-01", profile: {} });
    expect(getSnapshot().birthDate).toBe("2026-01-01");
    expect(getSnapshot().dueDate).toBeUndefined();
  });

  it("keeps the profile it was given", () => {
    completeOnboarding({
      status: "pregnant",
      dueDate: "2026-12-01",
      profile: { feeding: "formula", firstBaby: false },
    });
    expect(getSnapshot().profile).toEqual({ feeding: "formula", firstBaby: false });
  });
});

describe("progress", () => {
  it("marks an action done with a timestamp and a snapshot", () => {
    markDone(step("a1"), "2026-06-15T10:00:00.000Z");
    expect(getSnapshot().progress.a1).toEqual({
      status: "done",
      at: "2026-06-15T10:00:00.000Z",
      title: "Step a1",
      packId: "test-week",
      packTitle: "Week 28",
    });
    expect(isDone(getSnapshot(), "a1")).toBe(true);
  });

  it("marks an action skipped without a reason", () => {
    markSkipped(step("a1"), undefined, "2026-06-15T10:00:00.000Z");
    expect(getSnapshot().progress.a1).toEqual({
      status: "skipped",
      at: "2026-06-15T10:00:00.000Z",
      title: "Step a1",
      packId: "test-week",
      packTitle: "Week 28",
    });
    expect(isSkipped(getSnapshot(), "a1")).toBe(true);
  });

  it("marks an action skipped with a reason", () => {
    markSkipped(step("a1"), "not-now", "2026-06-15T10:00:00.000Z");
    expect(getSnapshot().progress.a1?.reason).toBe("not-now");
  });

  it("replaces a skip with a done", () => {
    markSkipped(step("a1"));
    markDone(step("a1"));
    expect(isDone(getSnapshot(), "a1")).toBe(true);
    expect(isSkipped(getSnapshot(), "a1")).toBe(false);
  });

  it("undoes a done", () => {
    markDone(step("a1"));
    clearProgress("a1");
    expect(getSnapshot().progress.a1).toBeUndefined();
    expect(isDone(getSnapshot(), "a1")).toBe(false);
  });

  it("undoes an action that was never touched without complaining", () => {
    expect(() => clearProgress("never")).not.toThrow();
    expect(getSnapshot().progress).toEqual({});
  });

  it("keeps other actions when one is undone", () => {
    markDone(step("a1"));
    markDone(step("a2"));
    clearProgress("a1");
    expect(Object.keys(getSnapshot().progress)).toEqual(["a2"]);
  });

  it("reports an unknown action as neither done nor skipped", () => {
    expect(isDone(getSnapshot(), "nope")).toBe(false);
    expect(isSkipped(getSnapshot(), "nope")).toBe(false);
  });

  it("is idempotent, so a double tap is one intention", () => {
    markDone(step("a1"), "2026-06-15T10:00:00.000Z");
    markDone(step("a1"), "2026-06-15T10:00:09.000Z");
    expect(getSnapshot().progress.a1?.at).toBe("2026-06-15T10:00:00.000Z");
  });

  it("is idempotent for a skip too, and keeps the first reason", () => {
    markSkipped(step("a1"), "not-now", "2026-06-15T10:00:00.000Z");
    markSkipped(step("a1"), "not-for-me", "2026-06-15T10:00:09.000Z");
    expect(getSnapshot().progress.a1?.reason).toBe("not-now");
    expect(getSnapshot().progress.a1?.at).toBe("2026-06-15T10:00:00.000Z");
  });
});

describe("snooze", () => {
  it("sets a step aside until a date, with a snapshot", () => {
    snooze(step("a1"), "2026-06-22", "2026-06-15T10:00:00.000Z");
    expect(getSnapshot().snoozed.a1).toEqual({
      id: "a1",
      title: "Step a1",
      packId: "test-week",
      packTitle: "Week 28",
      until: "2026-06-22",
      at: "2026-06-15T10:00:00.000Z",
    });
  });

  it("is snoozed only while the date is still ahead", () => {
    snooze(step("a1"), "2026-06-22");
    expect(isSnoozed(getSnapshot(), "a1", "2026-06-15")).toBe(true);
    expect(isSnoozed(getSnapshot(), "a1", "2026-06-21")).toBe(true);
    // The day it comes back, it is back.
    expect(isSnoozed(getSnapshot(), "a1", "2026-06-22")).toBe(false);
    expect(isSnoozed(getSnapshot(), "a1", "2026-06-30")).toBe(false);
  });

  it("reports an unknown action as not snoozed", () => {
    expect(isSnoozed(getSnapshot(), "nope", "2026-06-15")).toBe(false);
  });

  it("brings a step back early", () => {
    snooze(step("a1"), "2026-06-22");
    unsnooze("a1");
    expect(getSnapshot().snoozed.a1).toBeUndefined();
    expect(isSnoozed(getSnapshot(), "a1", "2026-06-15")).toBe(false);
  });

  it("brings back an action that was never snoozed without complaining", () => {
    expect(() => unsnooze("never")).not.toThrow();
    expect(getSnapshot().snoozed).toEqual({});
  });

  it("leaves other snoozes alone", () => {
    snooze(step("a1"), "2026-06-22");
    snooze(step("a2"), "2026-06-22");
    unsnooze("a1");
    expect(Object.keys(getSnapshot().snoozed)).toEqual(["a2"]);
  });

  it("is not a skip and not a done", () => {
    snooze(step("a1"), "2026-06-22");
    expect(isDone(getSnapshot(), "a1")).toBe(false);
    expect(isSkipped(getSnapshot(), "a1")).toBe(false);
  });

  it("survives a reload", () => {
    snooze(step("a1"), "2026-06-22", "2026-06-15T10:00:00.000Z");
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) as string);
    expect(stored.snoozed.a1.until).toBe("2026-06-22");
  });

  it("drops a stored snooze with no date, and fills in a missing snapshot", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        snoozed: { bad: { title: "No date" }, null: null, good: { until: "2026-06-22" } },
      }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().snoozed.bad).toBeUndefined();
    expect(getSnapshot().snoozed.null).toBeUndefined();
    expect(getSnapshot().snoozed.good).toEqual({
      id: "good",
      title: "",
      packId: "",
      packTitle: "",
      until: "2026-06-22",
      at: "",
    });
  });

  it("treats a non-object snoozed field as empty", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, snoozed: ["a1"] }));
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().snoozed).toEqual({});
  });
});

const pin = (id: string, title = `Step ${id}`) => ({
  id,
  title,
  packId: "pregnancy-w28",
  packTitle: "Week 28",
});

describe("pins", () => {
  it("pins and unpins", () => {
    togglePin(pin("a1"));
    expect(isPinned(getSnapshot(), "a1")).toBe(true);
    togglePin(pin("a1"));
    expect(isPinned(getSnapshot(), "a1")).toBe(false);
  });

  it("keeps several pins in the order they were added", () => {
    togglePin(pin("a1"));
    togglePin(pin("a2"));
    expect(getSnapshot().pins.map((p) => p.id)).toEqual(["a1", "a2"]);
  });

  it("unpins only the one asked for", () => {
    togglePin(pin("a1"));
    togglePin(pin("a2"));
    togglePin(pin("a1"));
    expect(getSnapshot().pins.map((p) => p.id)).toEqual(["a2"]);
  });

  it("stores a snapshot, so a pin survives the action being renamed", () => {
    togglePin(pin("a1", "Book your glucose test"), "2026-10-20T00:00:00.000Z");
    expect(getSnapshot().pins[0]).toEqual({
      id: "a1",
      title: "Book your glucose test",
      packId: "pregnancy-w28",
      packTitle: "Week 28",
      at: "2026-10-20T00:00:00.000Z",
    });
  });

  it("moves a pin up and down", () => {
    togglePin(pin("a1"));
    togglePin(pin("a2"));
    togglePin(pin("a3"));
    movePin("a3", "up");
    expect(getSnapshot().pins.map((p) => p.id)).toEqual(["a1", "a3", "a2"]);
    movePin("a1", "down");
    expect(getSnapshot().pins.map((p) => p.id)).toEqual(["a3", "a1", "a2"]);
  });

  it("refuses to move past either end", () => {
    togglePin(pin("a1"));
    togglePin(pin("a2"));
    movePin("a1", "up");
    movePin("a2", "down");
    expect(getSnapshot().pins.map((p) => p.id)).toEqual(["a1", "a2"]);
  });

  it("ignores a move for a pin that is not there", () => {
    togglePin(pin("a1"));
    movePin("nope", "up");
    expect(getSnapshot().pins.map((p) => p.id)).toEqual(["a1"]);
  });

  it("removes a pin without toggling it back on", () => {
    togglePin(pin("a1"));
    removePin("a1");
    expect(getSnapshot().pins).toEqual([]);
    removePin("a1");
    expect(getSnapshot().pins).toEqual([]);
  });
});

describe("updateProfile", () => {
  it("merges rather than replacing", () => {
    updateProfile({ feeding: "breast" });
    updateProfile({ firstBaby: false });
    expect(getSnapshot().profile).toEqual({ feeding: "breast", firstBaby: false });
  });

  it("overwrites a key that is set again", () => {
    updateProfile({ feeding: "breast" });
    updateProfile({ feeding: "formula" });
    expect(getSnapshot().profile.feeding).toBe("formula");
  });
});

describe("updateDates", () => {
  it("changes the due date without touching anything else", () => {
    completeOnboarding({
      status: "pregnant",
      dueDate: "2026-12-01",
      profile: { feeding: "breast" },
    });
    markDone(step("a1"));
    togglePin(pin("a1"));
    updateDates({ dueDate: "2026-12-08" });
    const state = getSnapshot();
    expect(state.dueDate).toBe("2026-12-08");
    expect(state.profile.feeding).toBe("breast");
    expect(state.progress.a1?.status).toBe("done");
    expect(state.pins).toHaveLength(1);
  });

  it("switches from pregnant to parent and sets the birth date", () => {
    completeOnboarding({ status: "pregnant", dueDate: "2026-12-01", profile: {} });
    updateDates({ status: "parent", birthDate: "2026-11-28" });
    const state = getSnapshot();
    expect(state.status).toBe("parent");
    expect(state.birthDate).toBe("2026-11-28");
  });

  it("leaves a date alone when it is not in the patch", () => {
    completeOnboarding({ status: "pregnant", dueDate: "2026-12-01", profile: {} });
    updateDates({ status: "pregnant" });
    expect(getSnapshot().dueDate).toBe("2026-12-01");
  });
});

describe("resetAll", () => {
  it("returns to the empty state", () => {
    completeOnboarding({ status: "pregnant", dueDate: "2026-12-01", profile: {} });
    markDone(step("a1"));
    togglePin(pin("a1"));
    resetAll();
    expect(getSnapshot()).toEqual(EMPTY_STATE);
  });

  it("keeps working in memory when storage refuses the write", () => {
    const setItem = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => markDone(step("a1"))).not.toThrow();
    expect(isDone(getSnapshot(), "a1")).toBe(true);
    setItem.mockRestore();
  });

  it("adds, edits, and removes an appointment of the parent's own", () => {
    addAppointment({ label: "Dentist", date: "2026-11-02" }, "2026-10-20T00:00:00.000Z");
    const [added] = getSnapshot().appointments;
    expect(added).toMatchObject({ label: "Dentist", date: "2026-11-02" });
    expect(added?.id).toMatch(/^own-/);

    updateAppointment(added!.id, { label: "Dentist, moved", note: "Bring the form." });
    expect(getSnapshot().appointments[0]).toMatchObject({
      label: "Dentist, moved",
      note: "Bring the form.",
      date: "2026-11-02",
    });

    removeAppointment(added!.id);
    expect(getSnapshot().appointments).toEqual([]);
  });

  it("leaves other appointments alone when one is edited", () => {
    addAppointment({ label: "A", date: "2026-11-02" }, "2026-10-20T00:00:00.000Z");
    addAppointment({ label: "B", date: "2026-11-03" }, "2026-10-20T00:00:01.000Z");
    const [first] = getSnapshot().appointments;
    updateAppointment(first!.id, { label: "A, edited" });
    expect(getSnapshot().appointments.map((a) => a.label)).toEqual(["A, edited", "B"]);
  });

  it("drops a stored appointment that is missing its date", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...EMPTY_STATE,
        appointments: [
          { id: "own-1", label: "No date" },
          { id: "own-2", label: "Fine", date: "2026-11-02" },
        ],
      }),
    );
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().appointments.map((a) => a.id)).toEqual(["own-2"]);
    unsubscribe();
  });

  it("treats a non-array appointments field as empty", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...EMPTY_STATE, appointments: 7 }));
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().appointments).toEqual([]);
    unsubscribe();
  });

  it("clears the stored copy too", () => {
    markDone(step("a1"));
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    resetAll();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("persistence", () => {
  it("writes to localStorage on every change", () => {
    markDone(step("a1"));
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).progress.a1.status).toBe("done");
  });

  it("rehydrates from localStorage on the first subscribe", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, onboarded: true, pins: ["a1"] }),
    );
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().onboarded).toBe(true);
    // A v1 pin was a bare id. It is upgraded with an empty snapshot, which the
    // shelf resolves from the live registry.
    expect(getSnapshot().pins).toEqual([
      { id: "a1", title: "", packId: "", packTitle: "", at: "" },
    ]);
    unsubscribe();
  });

  it("drops a stored pin that is neither a string nor an object with an id", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, pins: [42, null, { title: "no id" }, "a1"] }),
    );
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().pins.map((p) => p.id)).toEqual(["a1"]);
    unsubscribe();
  });

  it("fills in missing snapshot fields on a stored pin", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, pins: [{ id: "a1" }] }),
    );
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().pins[0]).toEqual({
      id: "a1",
      title: "",
      packId: "",
      packTitle: "",
      at: "",
    });
    unsubscribe();
  });

  it("treats a non-array pins field as an empty shelf", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...EMPTY_STATE, pins: "a1" }));
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().pins).toEqual([]);
    unsubscribe();
  });

  it("ignores a stored state from a different version", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, pins: ["a1"] }));
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot()).toEqual(EMPTY_STATE);
    unsubscribe();
  });

  it("discards corrupt state rather than showing a parse error", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot()).toEqual(EMPTY_STATE);
    unsubscribe();
  });

  it("fills in a missing profile", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, onboarded: true, pins: [], progress: {} }),
    );
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().profile).toEqual({});
    unsubscribe();
  });

  it("keeps working when storage throws on write", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => markDone(step("a1"))).not.toThrow();
    expect(isDone(getSnapshot(), "a1")).toBe(true);
    spy.mockRestore();
  });

  it("keeps working when storage throws on read", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot()).toEqual(EMPTY_STATE);
    unsubscribe();
    spy.mockRestore();
  });

  it("keeps working when storage throws on remove", () => {
    const spy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => resetAll()).not.toThrow();
    spy.mockRestore();
  });
});

describe("hydration", () => {
  it("reports not hydrated until storage has been read", () => {
    expect(isHydrated()).toBe(false);
    subscribe(() => {});
    expect(isHydrated()).toBe(true);
  });

  it("hydrates from storage on the first subscribe", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, onboarded: true, dueDate: "2027-01-12" }),
    );
    subscribe(() => {});
    expect(getSnapshot().onboarded).toBe(true);
    expect(getSnapshot().dueDate).toBe("2027-01-12");
  });

  it("exposes hydration to components so redirects can wait for it", () => {
    const { result } = renderHook(() => useHydrated());
    expect(result.current).toBe(true);
  });

  it("serves an empty snapshot on the server so hydration cannot mismatch", () => {
    expect(getServerSnapshot()).toEqual(EMPTY_STATE);
  });
});

describe("subscribe", () => {
  it("notifies every listener on a change", () => {
    const a = vi.fn();
    const b = vi.fn();
    const unsubA = subscribe(a);
    const unsubB = subscribe(b);
    markDone(step("a1"));
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    unsubA();
    unsubB();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    unsubscribe();
    markDone(step("a1"));
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("stageInput", () => {
  it("returns the due date for a pregnant parent", () => {
    completeOnboarding({ status: "pregnant", dueDate: "2026-12-01", profile: {} });
    expect(stageInput(getSnapshot())).toEqual({ status: "pregnant", dueDate: "2026-12-01" });
  });

  it("returns the birth date for a parent", () => {
    completeOnboarding({ status: "parent", birthDate: "2026-01-01", profile: {} });
    expect(stageInput(getSnapshot())).toEqual({ status: "parent", birthDate: "2026-01-01" });
  });

  it("returns null when the date is missing", () => {
    expect(stageInput(EMPTY_STATE)).toBeNull();
  });

  it("returns null when the status and the date disagree", () => {
    expect(stageInput({ ...EMPTY_STATE, status: "parent", dueDate: "2026-12-01" })).toBeNull();
    expect(stageInput({ ...EMPTY_STATE, status: "pregnant", birthDate: "2026-01-01" })).toBeNull();
  });
});

describe("week completion", () => {
  it("records when a week was finished, and whether it was forced", () => {
    completeWeek("test-week", true, "2026-06-15T10:00:00.000Z");
    expect(getSnapshot().completed["test-week"]).toEqual({
      at: "2026-06-15T10:00:00.000Z",
      forced: true,
    });
    expect(isWeekComplete(getSnapshot(), "test-week")).toBe(true);
  });

  it("is idempotent: a second call keeps the first timestamp and the first reason", () => {
    completeWeek("test-week", false, "2026-06-15T10:00:00.000Z");
    completeWeek("test-week", true, "2026-06-20T10:00:00.000Z");
    expect(getSnapshot().completed["test-week"]).toEqual({
      at: "2026-06-15T10:00:00.000Z",
      forced: false,
    });
  });

  it("stamps the current time when no time is given", () => {
    completeWeek("test-week", false);
    expect(getSnapshot().completed["test-week"]?.at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("reopens a week, and reopening twice is harmless", () => {
    completeWeek("test-week", true);
    reopenWeek("test-week");
    expect(isWeekComplete(getSnapshot(), "test-week")).toBe(false);
    reopenWeek("test-week");
    expect(getSnapshot().completed).toEqual({});
  });

  it("leaves other weeks alone", () => {
    completeWeek("test-week", true);
    completeWeek("other-week", false);
    reopenWeek("test-week");
    expect(isWeekComplete(getSnapshot(), "other-week")).toBe(true);
  });

  it("survives a reload", () => {
    completeWeek("test-week", true, "2026-06-15T10:00:00.000Z");
    __resetForTests();
    subscribe(() => {});
    expect(isWeekComplete(getSnapshot(), "test-week")).toBe(true);
  });

  it("drops a stored entry with no timestamp", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: { "test-week": { forced: true } } }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().completed).toEqual({});
  });

  it("treats a non-object entry and a non-object map as empty", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, completed: { "test-week": null } }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().completed).toEqual({});

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, completed: [] }));
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().completed).toEqual({});
  });

  it("defaults a missing forced flag to false rather than truthy", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completed: { "test-week": { at: "2026-06-15T10:00:00.000Z" } },
      }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().completed["test-week"]?.forced).toBe(false);
  });
});

describe("setProfile", () => {
  it("replaces the profile, so a cleared field stays cleared", () => {
    subscribe(() => {});
    updateProfile({ loss: "baby", hasCar: false });
    expect(getSnapshot().profile.loss).toBe("baby");

    setProfile(writeField(getSnapshot().profile, "loss", "none"));
    expect(getSnapshot().profile.loss).toBeUndefined();
    expect(getSnapshot().profile.hasCar).toBe(false);
  });
});

describe("choices", () => {
  it("records the option a parent picked, with its label", () => {
    chooseOption("m6-highchair", "m6-chair-ikea", "IKEA Antilop", "2026-10-20T10:00:00.000Z");
    expect(chosenOption(getSnapshot(), "m6-highchair")).toEqual({
      optionId: "m6-chair-ikea",
      label: "IKEA Antilop",
      at: "2026-10-20T10:00:00.000Z",
    });
  });

  it("replaces an earlier choice, because changing your mind is normal", () => {
    chooseOption("m6-highchair", "m6-chair-ikea", "IKEA Antilop");
    chooseOption("m6-highchair", "m6-chair-stokke", "Stokke Tripp Trapp");
    expect(chosenOption(getSnapshot(), "m6-highchair")?.optionId).toBe("m6-chair-stokke");
  });

  it("forgets a choice, so the step offers the chooser again", () => {
    chooseOption("m6-highchair", "m6-chair-ikea", "IKEA Antilop");
    clearChoice("m6-highchair");
    expect(chosenOption(getSnapshot(), "m6-highchair")).toBeUndefined();
  });

  it("does nothing when there is no choice to forget", () => {
    const before = getSnapshot();
    clearChoice("m6-highchair");
    expect(getSnapshot()).toBe(before);
  });

  it("keeps a choice across a reload", () => {
    chooseOption("m6-highchair", "m6-chair-ikea", "IKEA Antilop");
    __resetForTests();
    subscribe(() => {});
    expect(chosenOption(getSnapshot(), "m6-highchair")?.label).toBe("IKEA Antilop");
  });

  it("drops a stored choice with no option or no label", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        choices: {
          good: { optionId: "a", label: "A", at: "2026-10-20T10:00:00.000Z" },
          noOption: { label: "A" },
          noLabel: { optionId: "a" },
          noAt: { optionId: "a", label: "A" },
          notAnObject: "a",
        },
      }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(Object.keys(getSnapshot().choices)).toEqual(["good", "noAt"]);
    expect(getSnapshot().choices.noAt).toEqual({ optionId: "a", label: "A", at: "" });
  });

  it("treats a non-object choices field as empty", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, choices: ["a"] }));
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().choices).toEqual({});
  });
});

describe("the onboarding draft", () => {
  const full = {
    step: "feeding" as const,
    status: "pregnant" as const,
    date: "2026-12-01",
    country: "US",
    feeding: "formula",
    firstBaby: "yes",
    at: "2026-10-20T10:00:00.000Z",
  };

  function store(value: unknown) {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
  }

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips a draft", () => {
    saveDraft(full);
    expect(readDraft(new Date("2026-10-21T10:00:00.000Z"))).toEqual(full);
  });

  it("says nothing when there is no draft", () => {
    expect(readDraft()).toBeNull();
  });

  it("says nothing when the draft is not JSON", () => {
    window.localStorage.setItem(DRAFT_KEY, "{not json");
    expect(readDraft()).toBeNull();
  });

  it("says nothing when the draft is not an object", () => {
    window.localStorage.setItem(DRAFT_KEY, "null");
    expect(readDraft()).toBeNull();
    window.localStorage.setItem(DRAFT_KEY, "42");
    expect(readDraft()).toBeNull();
  });

  it("says nothing when the step is not one of ours", () => {
    store({ ...full, step: "checkout" });
    expect(readDraft()).toBeNull();
    store({ ...full, step: 3 });
    expect(readDraft()).toBeNull();
  });

  it("says nothing when the status is not one of ours", () => {
    store({ ...full, status: "expecting" });
    expect(readDraft()).toBeNull();
  });

  it("says nothing when the date is missing or empty", () => {
    store({ ...full, date: undefined });
    expect(readDraft()).toBeNull();
    store({ ...full, date: "" });
    expect(readDraft()).toBeNull();
  });

  it("says nothing when the timestamp is missing or unreadable", () => {
    store({ ...full, at: undefined });
    expect(readDraft()).toBeNull();
    store({ ...full, at: "yesterday" });
    expect(readDraft()).toBeNull();
  });

  it("says nothing when the draft is older than a week", () => {
    store(full);
    expect(readDraft(new Date("2026-10-28T10:00:00.000Z"))).toBeNull();
  });

  it("fills the optional answers with nothing rather than a guess", () => {
    store({ step: "country", status: "parent", date: "2026-01-01", at: full.at });
    expect(readDraft(new Date("2026-10-21T10:00:00.000Z"))).toEqual({
      step: "country",
      status: "parent",
      date: "2026-01-01",
      country: "",
      feeding: "",
      firstBaby: "",
      at: full.at,
    });
  });

  it("says nothing when storage refuses to be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readDraft()).toBeNull();
  });

  it("survives storage refusing to write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => saveDraft(full)).not.toThrow();
  });

  it("survives storage refusing to remove", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => clearDraft()).not.toThrow();
  });

  it("forgets the draft when it is cleared", () => {
    saveDraft(full);
    clearDraft();
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("forgets the draft once onboarding is finished", () => {
    saveDraft(full);
    completeOnboarding({ status: "pregnant", dueDate: "2026-12-01", profile: {} });
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("forgets the draft when everything is erased", () => {
    saveDraft(full);
    resetAll();
    expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
  });
});

describe("notices", () => {
  const match = (over: Partial<RecallMatch> = {}): RecallMatch => ({
    recall: {
      id: "cpsc-1",
      title: "High chairs recalled for a fall hazard",
      product: "Bicystar high chairs",
      hazard: "The seat can detach from the frame.",
      action: "Stop using the chair and contact the maker for a free repair kit.",
      severity: "stop-use",
      publishedAt: "2026-09-01",
      source: {
        id: "cpsc",
        title: "Bicystar high chairs",
        publisher: "CPSC",
        url: "https://www.cpsc.gov/Recalls/2026/example",
        kind: "government",
        accessed: "2026-10-20",
      },
      matches: { optionIds: [], actionIds: ["t-car-seat"], keywords: [] },
    },
    because: "step",
    matchedOn: "t-car-seat",
    ...over,
  });

  it("records a notice with the recall's title and product", () => {
    expect(recordNotices([match()], "2026-10-02T00:00:00.000Z")).toBe(1);
    expect(getSnapshot().notices["cpsc-1:t-car-seat"]).toEqual({
      id: "cpsc-1:t-car-seat",
      recallId: "cpsc-1",
      title: "High chairs recalled for a fall hazard",
      product: "Bicystar high chairs",
      because: "step",
      matchedOn: "t-car-seat",
      at: "2026-10-02T00:00:00.000Z",
    });
  });

  it("records nothing twice", () => {
    recordNotices([match()], "2026-10-02T00:00:00.000Z");
    expect(recordNotices([match()], "2026-10-03T00:00:00.000Z")).toBe(0);
    expect(getSnapshot().notices["cpsc-1:t-car-seat"]?.at).toBe("2026-10-02T00:00:00.000Z");
  });

  it("keeps two reasons for the same recall as two notices", () => {
    recordNotices([match(), match({ because: "option", matchedOn: "opt-graco" })]);
    expect(Object.keys(getSnapshot().notices).sort()).toEqual([
      "cpsc-1:opt-graco",
      "cpsc-1:t-car-seat",
    ]);
  });

  it("puts a notice away without deleting the record", () => {
    recordNotices([match()], "2026-10-02T00:00:00.000Z");
    dismissNotice("cpsc-1:t-car-seat", "2026-10-04T00:00:00.000Z");
    expect(getSnapshot().notices["cpsc-1:t-car-seat"]?.dismissedAt).toBe(
      "2026-10-04T00:00:00.000Z",
    );
    expect(visibleNotices(getSnapshot())).toEqual([]);
  });

  it("does not move a dismissal that already happened", () => {
    recordNotices([match()], "2026-10-02T00:00:00.000Z");
    dismissNotice("cpsc-1:t-car-seat", "2026-10-04T00:00:00.000Z");
    dismissNotice("cpsc-1:t-car-seat", "2026-10-05T00:00:00.000Z");
    expect(getSnapshot().notices["cpsc-1:t-car-seat"]?.dismissedAt).toBe(
      "2026-10-04T00:00:00.000Z",
    );
  });

  it("ignores a dismissal for a notice that does not exist", () => {
    dismissNotice("nope");
    expect(getSnapshot().notices).toEqual({});
  });

  it("shows the newest notice first", () => {
    recordNotices([match()], "2026-10-02T00:00:00.000Z");
    recordNotices(
      [match({ because: "option", matchedOn: "opt-graco" })],
      "2026-10-05T00:00:00.000Z",
    );
    expect(visibleNotices(getSnapshot()).map((n) => n.id)).toEqual([
      "cpsc-1:opt-graco",
      "cpsc-1:t-car-seat",
    ]);
  });

  it("survives a reload", () => {
    recordNotices([match()], "2026-10-02T00:00:00.000Z");
    __resetForTests();
    const unsubscribe = subscribe(() => {});
    expect(visibleNotices(getSnapshot())).toHaveLength(1);
    unsubscribe();
  });

  it("drops a stored notice with no recall id", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, notices: { a: { title: "x" }, b: 7 } }),
    );
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().notices).toEqual({});
    unsubscribe();
  });

  it("drops a stored notice with a reason it does not recognise", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...EMPTY_STATE,
        notices: {
          a: {
            recallId: "cpsc-1",
            title: "x",
            product: "y",
            matchedOn: "z",
            because: "vibes",
          },
        },
      }),
    );
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().notices).toEqual({});
    unsubscribe();
  });

  it("treats a non-object notices field as an empty queue", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...EMPTY_STATE, notices: [] }));
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().notices).toEqual({});
    unsubscribe();
  });

  it("fills in a missing timestamp on a stored notice", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...EMPTY_STATE,
        notices: {
          a: { recallId: "cpsc-1", title: "x", product: "y", matchedOn: "z", because: "step" },
        },
      }),
    );
    const unsubscribe = subscribe(() => {});
    expect(getSnapshot().notices.a?.at).toBe("");
    unsubscribe();
  });
});

describe("notification preferences", () => {
  it("starts with nothing switched on", () => {
    expect(getSnapshot().notifications.email).toBe(false);
    expect(getSnapshot().notifications.push).toBe(false);
    expect(getSnapshot().notifications.paused).toBe(false);
  });

  it("merges a patch rather than replacing the whole object", () => {
    setNotifications({ email: true });
    setNotifications({ frequency: "monthly" });
    expect(getSnapshot().notifications.email).toBe(true);
    expect(getSnapshot().notifications.frequency).toBe("monthly");
    expect(getSnapshot().notifications.quietFrom).toBe(21);
  });

  it("survives a reload", () => {
    setNotifications({ push: true, paused: true, frequency: "fortnightly" });
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().notifications.push).toBe(true);
    expect(getSnapshot().notifications.paused).toBe(true);
    expect(getSnapshot().notifications.frequency).toBe("fortnightly");
  });

  it("falls back to the defaults when the stored value is not an object", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, notifications: "on" }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().notifications).toEqual(EMPTY_STATE.notifications);
  });

  it("drops a frequency it does not recognise", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, notifications: { frequency: "hourly" } }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().notifications.frequency).toBe("weekly");
  });

  it("drops an hour that is not a real hour", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, notifications: { quietFrom: 25, quietTo: -1 } }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().notifications.quietFrom).toBe(21);
    expect(getSnapshot().notifications.quietTo).toBe(8);
  });

  it("keeps a real hour", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, notifications: { quietFrom: 22, quietTo: 6 } }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().notifications.quietFrom).toBe(22);
    expect(getSnapshot().notifications.quietTo).toBe(6);
  });

  it("treats a non-boolean toggle as off", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, notifications: { email: "yes", push: 1 } }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().notifications.email).toBe(false);
    expect(getSnapshot().notifications.push).toBe(false);
  });

  it("is erased with everything else", () => {
    setNotifications({ email: true, paused: true });
    resetAll();
    expect(getSnapshot().notifications).toEqual(EMPTY_STATE.notifications);
  });
});

describe("pin reminders", () => {
  it("sets a day on a pin", () => {
    togglePin({ id: "p1", title: "Pack the bag", packId: "w36", packTitle: "Week 36" });
    setPinReminder("p1", "2026-11-01");
    expect(getSnapshot().pins[0]?.remindOn).toBe("2026-11-01");
  });

  it("clears the day without removing the pin", () => {
    togglePin({ id: "p1", title: "Pack the bag", packId: "w36", packTitle: "Week 36" });
    setPinReminder("p1", "2026-11-01");
    setPinReminder("p1", undefined);
    expect(getSnapshot().pins).toHaveLength(1);
    expect(getSnapshot().pins[0]?.remindOn).toBeUndefined();
  });

  it("leaves other pins alone", () => {
    togglePin({ id: "p1", title: "One", packId: "w36", packTitle: "Week 36" });
    togglePin({ id: "p2", title: "Two", packId: "w36", packTitle: "Week 36" });
    setPinReminder("p1", "2026-11-01");
    expect(getSnapshot().pins.find((pin) => pin.id === "p2")?.remindOn).toBeUndefined();
  });

  it("survives a reload", () => {
    togglePin({ id: "p1", title: "Pack the bag", packId: "w36", packTitle: "Week 36" });
    setPinReminder("p1", "2026-11-01");
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().pins[0]?.remindOn).toBe("2026-11-01");
  });

  it("drops a stored reminder that is not a string", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...EMPTY_STATE,
        pins: [
          { id: "p1", title: "One", packId: "w36", packTitle: "Week 36", at: "", remindOn: 7 },
        ],
      }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().pins[0]?.remindOn).toBeUndefined();
  });
});

describe("reminded", () => {
  it("starts empty", () => {
    expect(getSnapshot().reminded).toEqual({});
  });

  it("records a key with a timestamp", () => {
    markReminded(["appointment:w28:2026-10-21"], "2026-10-20T09:00:00.000Z");
    expect(getSnapshot().reminded["appointment:w28:2026-10-21"]).toBe("2026-10-20T09:00:00.000Z");
  });

  it("keeps the first timestamp when the same key is recorded twice", () => {
    markReminded(["appointment:w28:2026-10-21"], "2026-10-20T09:00:00.000Z");
    markReminded(["appointment:w28:2026-10-21"], "2026-10-20T18:00:00.000Z");
    expect(getSnapshot().reminded["appointment:w28:2026-10-21"]).toBe("2026-10-20T09:00:00.000Z");
  });

  it("does not write when every key is already recorded", () => {
    markReminded(["a"], "2026-10-20T09:00:00.000Z");
    const before = getSnapshot();
    markReminded(["a"], "2026-10-20T10:00:00.000Z");
    expect(getSnapshot()).toBe(before);
  });

  it("records several keys at once", () => {
    markReminded(["a", "b"], "2026-10-20T09:00:00.000Z");
    expect(Object.keys(getSnapshot().reminded).sort()).toEqual(["a", "b"]);
  });

  it("stamps the current time when none is given", () => {
    markReminded(["a"]);
    expect(typeof getSnapshot().reminded["a"]).toBe("string");
  });

  it("survives a reload", () => {
    markReminded(["a"], "2026-10-20T09:00:00.000Z");
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().reminded["a"]).toBe("2026-10-20T09:00:00.000Z");
  });

  it("ignores a stored value that is not an object", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...EMPTY_STATE, reminded: "yes" }));
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().reminded).toEqual({});
  });

  it("ignores a stored array", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...EMPTY_STATE, reminded: ["a"] }));
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().reminded).toEqual({});
  });

  it("drops a stored entry that is not a string", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...EMPTY_STATE, reminded: { a: "2026-10-20T09:00:00.000Z", b: 3 } }),
    );
    __resetForTests();
    subscribe(() => {});
    expect(getSnapshot().reminded).toEqual({ a: "2026-10-20T09:00:00.000Z" });
  });
});
