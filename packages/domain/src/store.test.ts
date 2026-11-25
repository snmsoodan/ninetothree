import { describe, expect, it } from "vitest";
import { createStore } from "./store";
import { memoryIO, type StoreIO } from "./io";
import { DRAFT_KEY, EMPTY_STATE, STORAGE_KEY } from "./model";

/**
 * The port contract.
 *
 * The whole reason this package exists is that the state machine is the same
 * on a phone and in a browser, and the only thing that differs is where the
 * bytes go. So the proof is a differential one: run the same sequence of taps
 * through two stores whose only difference is the adapter, and require the
 * resulting state — and the resulting bytes — to be identical.
 */

/** A stand-in for localStorage: same four operations, no browser. */
function memoryStorage(seed: Record<string, string> = {}): StoreIO & {
  readonly cells: Map<string, string>;
} {
  const cells = new Map(Object.entries(seed));
  return {
    cells,
    load: (key) => cells.get(key) ?? null,
    save: (key, value) => void cells.set(key, value),
    remove: (key) => void cells.delete(key),
  };
}

const step = (id: string) => ({
  id,
  title: `Step ${id}`,
  packId: "test-week",
  packTitle: "Week 28",
});

/** One parent's first ten minutes, as both platforms would see them. */
function firstTenMinutes(store: ReturnType<typeof createStore>): void {
  store.completeOnboarding({
    status: "pregnant",
    dueDate: "2027-03-14",
    profile: { country: "US", feeding: "breast" },
  });
  store.markDone(step("sleep-1"), "2026-10-20T09:00:00.000Z");
  store.markSkipped(step("kit-1"), "already have one", "2026-10-20T09:01:00.000Z");
  store.snooze(step("bag-1"), "2026-11-01", "2026-10-20T09:02:00.000Z");
  store.togglePin(step("sleep-1"), "2026-10-20T09:03:00.000Z");
  store.setPinReminder("sleep-1", "2026-10-27");
  store.chooseOption("bag-1", "bag-a", "The wheely one", "2026-10-20T09:04:00.000Z");
  store.completeWeek("week-28", false, "2026-10-20T09:05:00.000Z");
  store.setReading({ contrast: "more" });
  store.setPersona("partner");
  store.addAppointment({ label: "Growth scan", date: "2026-11-04" }, "2026-10-20T09:06:00.000Z");
  store.saveDraft({
    step: "country",
    persona: "parent",
    status: "pregnant",
    date: "2027-03-14",
    country: "",
    feeding: "",
    firstBaby: "",
    at: "2026-10-20T09:07:00.000Z",
  });
}

describe("the memory port", () => {
  it("is a working store with no platform at all", () => {
    const store = createStore();
    firstTenMinutes(store);
    expect(store.getSnapshot().onboarded).toBe(true);
    expect(store.getSnapshot().pins).toHaveLength(1);
  });

  it("writes the state under the one key a phone would use", () => {
    const io = memoryIO();
    const store = createStore(io);
    store.markDone(step("sleep-1"), "2026-10-20T09:00:00.000Z");
    expect(Object.keys(io.dump())).toEqual([STORAGE_KEY]);
  });

  it("starts from an empty state when nothing was ever stored", () => {
    const store = createStore(memoryIO());
    store.hydrate();
    expect(store.getSnapshot()).toEqual(EMPTY_STATE);
    expect(store.isHydrated()).toBe(true);
  });

  it("does not need a browser to keep a draft", () => {
    const io = memoryIO();
    const store = createStore(io);
    store.saveDraft({
      step: "persona",
      persona: "parent",
      status: "pregnant",
      date: "",
      country: "",
      feeding: "",
      firstBaby: "",
      at: new Date().toISOString(),
    });
    expect(io.dump()[DRAFT_KEY]).toBeTruthy();
    expect(store.readDraft()?.step).toBe("persona");
    store.clearDraft();
    expect(io.dump()[DRAFT_KEY]).toBeUndefined();
  });
});

describe("the two ports agree", () => {
  it("produces the same state and the same bytes from the same sequence", () => {
    const phoneIO = memoryIO();
    const browserIO = memoryStorage();
    const phone = createStore(phoneIO);
    const browser = createStore(browserIO);

    firstTenMinutes(phone);
    firstTenMinutes(browser);

    expect(phone.getSnapshot()).toEqual(browser.getSnapshot());
    expect(phoneIO.dump()[STORAGE_KEY]).toBe(browserIO.cells.get(STORAGE_KEY));
  });

  it("rehydrates the same state it wrote", () => {
    const io = memoryIO();
    const first = createStore(io);
    firstTenMinutes(first);
    const written = io.dump()[STORAGE_KEY];

    const second = createStore(memoryIO(io.dump()));
    second.hydrate();

    expect(second.getSnapshot()).toEqual(first.getSnapshot());
    expect(io.dump()[STORAGE_KEY]).toBe(written);
  });
});

describe("the onboarding callback", () => {
  it("is told after every write, so a platform flag cannot drift", () => {
    const seen: boolean[] = [];
    const store = createStore({ ...memoryIO(), onOnboarded: (value) => seen.push(value) });
    store.completeOnboarding({ status: "parent", birthDate: "2026-09-01", profile: {} });
    store.resetAll();
    expect(seen).toEqual([true, false]);
  });

  it("does not let a failing flag stop the write", () => {
    const io = memoryIO();
    const store = createStore({
      ...io,
      onOnboarded: () => {
        throw new Error("cookie jar closed");
      },
    });
    store.markDone(step("sleep-1"), "2026-10-20T09:00:00.000Z");
    expect(JSON.parse(io.dump()[STORAGE_KEY] as string).progress["sleep-1"].status).toBe("done");
  });

  it("does not let a failing store stop the app", () => {
    const store = createStore({
      load: () => null,
      save: () => {
        throw new Error("quota");
      },
      remove: () => {
        throw new Error("quota");
      },
    });
    store.markDone(step("sleep-1"), "2026-10-20T09:00:00.000Z");
    store.resetAll();
    expect(store.getSnapshot()).toEqual(EMPTY_STATE);
  });

  it("survives a port that cannot be read at all", () => {
    const store = createStore({
      load: () => {
        throw new Error("blocked");
      },
      save: () => {},
      remove: () => {},
    });
    store.subscribe(() => {});
    expect(store.isHydrated()).toBe(true);
    expect(store.getSnapshot()).toEqual(EMPTY_STATE);
  });
});
