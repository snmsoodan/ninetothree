import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  EMPTY_STATE,
  STORAGE_KEY,
  __resetForTests,
  clearProgress,
  completeOnboarding,
  getServerSnapshot,
  getSnapshot,
  isHydrated,
  useHydrated,
  isDone,
  isPinned,
  isSkipped,
  markDone,
  markSkipped,
  resetAll,
  stageInput,
  subscribe,
  togglePin,
  updateProfile,
} from "./store";

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
  it("marks an action done with a timestamp", () => {
    markDone("a1", "2026-06-15T10:00:00.000Z");
    expect(getSnapshot().progress.a1).toEqual({ status: "done", at: "2026-06-15T10:00:00.000Z" });
    expect(isDone(getSnapshot(), "a1")).toBe(true);
  });

  it("marks an action skipped without a reason", () => {
    markSkipped("a1", undefined, "2026-06-15T10:00:00.000Z");
    expect(getSnapshot().progress.a1).toEqual({
      status: "skipped",
      at: "2026-06-15T10:00:00.000Z",
    });
    expect(isSkipped(getSnapshot(), "a1")).toBe(true);
  });

  it("marks an action skipped with a reason", () => {
    markSkipped("a1", "not-now", "2026-06-15T10:00:00.000Z");
    expect(getSnapshot().progress.a1?.reason).toBe("not-now");
  });

  it("replaces a skip with a done", () => {
    markSkipped("a1");
    markDone("a1");
    expect(isDone(getSnapshot(), "a1")).toBe(true);
    expect(isSkipped(getSnapshot(), "a1")).toBe(false);
  });

  it("undoes a done", () => {
    markDone("a1");
    clearProgress("a1");
    expect(getSnapshot().progress.a1).toBeUndefined();
    expect(isDone(getSnapshot(), "a1")).toBe(false);
  });

  it("undoes an action that was never touched without complaining", () => {
    expect(() => clearProgress("never")).not.toThrow();
    expect(getSnapshot().progress).toEqual({});
  });

  it("keeps other actions when one is undone", () => {
    markDone("a1");
    markDone("a2");
    clearProgress("a1");
    expect(Object.keys(getSnapshot().progress)).toEqual(["a2"]);
  });

  it("reports an unknown action as neither done nor skipped", () => {
    expect(isDone(getSnapshot(), "nope")).toBe(false);
    expect(isSkipped(getSnapshot(), "nope")).toBe(false);
  });
});

describe("pins", () => {
  it("pins and unpins", () => {
    togglePin("a1");
    expect(isPinned(getSnapshot(), "a1")).toBe(true);
    togglePin("a1");
    expect(isPinned(getSnapshot(), "a1")).toBe(false);
  });

  it("keeps several pins in the order they were added", () => {
    togglePin("a1");
    togglePin("a2");
    expect(getSnapshot().pins).toEqual(["a1", "a2"]);
  });

  it("unpins only the one asked for", () => {
    togglePin("a1");
    togglePin("a2");
    togglePin("a1");
    expect(getSnapshot().pins).toEqual(["a2"]);
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

describe("resetAll", () => {
  it("returns to the empty state", () => {
    completeOnboarding({ status: "pregnant", dueDate: "2026-12-01", profile: {} });
    markDone("a1");
    togglePin("a1");
    resetAll();
    expect(getSnapshot()).toEqual(EMPTY_STATE);
  });

  it("clears the stored copy too", () => {
    markDone("a1");
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    resetAll();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("persistence", () => {
  it("writes to localStorage on every change", () => {
    markDone("a1");
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
    expect(getSnapshot().pins).toEqual(["a1"]);
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
    expect(() => markDone("a1")).not.toThrow();
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
    markDone("a1");
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    unsubA();
    unsubB();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    unsubscribe();
    markDone("a1");
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
