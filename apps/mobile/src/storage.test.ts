import { describe, expect, it } from "vitest";
import { DRAFT_KEY, STORAGE_KEY, createStore } from "@ninetothree/domain";
import { ONBOARDED_KEY, PRELOAD_KEYS, bufferedIO, type AsyncKeyValue } from "./storage";

/** The smallest AsyncStorage: a map, and a switch to make it slow or broken. */
function fakeStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  const calls: string[] = [];
  let gate: Promise<void> | null = null;
  const fail = { read: false, write: false, remove: false };

  const storage: AsyncKeyValue = {
    async getItem(key) {
      calls.push(`get ${key}`);
      if (fail.read) throw new Error("keychain locked");
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      calls.push(`set ${key}`);
      if (gate) await gate;
      if (fail.write) throw new Error("disk full");
      data.set(key, value);
    },
    async removeItem(key) {
      calls.push(`remove ${key}`);
      if (fail.remove) throw new Error("disk full");
      data.delete(key);
    },
  };

  return {
    storage,
    data,
    calls,
    fail,
    /** Hold every write until the returned function is called. */
    block() {
      let release = () => {};
      gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      return () => {
        release();
        gate = null;
      };
    },
  };
}

describe("the preloaded keys", () => {
  it("are the two the state machine reads plus the onboarding flag", () => {
    expect(PRELOAD_KEYS).toEqual([STORAGE_KEY, DRAFT_KEY, ONBOARDED_KEY]);
  });
});

describe("hydrate", () => {
  it("reads every key in one pass and answers from memory afterwards", async () => {
    const fake = fakeStorage({ [STORAGE_KEY]: '{"v":1}', [ONBOARDED_KEY]: "1" });
    const io = bufferedIO(fake.storage);

    expect(io.isHydrated()).toBe(false);
    expect(io.io.load(STORAGE_KEY)).toBeNull();

    await io.hydrate();

    expect(io.isHydrated()).toBe(true);
    expect(io.io.load(STORAGE_KEY)).toBe('{"v":1}');
    expect(io.io.load(ONBOARDED_KEY)).toBe("1");
    expect(io.io.load("never-written")).toBeNull();
    expect(fake.calls).toEqual(PRELOAD_KEYS.map((key) => `get ${key}`));
  });

  it("reads once even when called twice", async () => {
    const fake = fakeStorage();
    const io = bufferedIO(fake.storage);
    await io.hydrate();
    await io.hydrate();
    expect(fake.calls).toHaveLength(PRELOAD_KEYS.length);
  });

  it("treats a blocked read as a cold start rather than a crash", async () => {
    const fake = fakeStorage({ [STORAGE_KEY]: '{"v":1}' });
    fake.fail.read = true;
    const io = bufferedIO(fake.storage);

    await expect(io.hydrate()).resolves.toBeUndefined();

    expect(io.isHydrated()).toBe(true);
    expect(io.io.load(STORAGE_KEY)).toBeNull();
    expect(io.lastError()).toBeInstanceOf(Error);
  });
});

describe("save and remove", () => {
  it("answers synchronously and writes a moment later", async () => {
    const fake = fakeStorage();
    const io = bufferedIO(fake.storage);
    await io.hydrate();

    io.io.save(STORAGE_KEY, "a");
    // The store can read back what it just wrote before the disk has seen it,
    // which is the whole point of the cache.
    expect(io.io.load(STORAGE_KEY)).toBe("a");
    expect(fake.data.get(STORAGE_KEY)).toBeUndefined();

    await io.flush();
    expect(fake.data.get(STORAGE_KEY)).toBe("a");
    expect(io.writes()).toBe(1);
  });

  it("removes the key as well as blanking it in memory", async () => {
    const fake = fakeStorage({ [DRAFT_KEY]: "draft" });
    const io = bufferedIO(fake.storage);
    await io.hydrate();

    io.io.remove(DRAFT_KEY);
    expect(io.io.load(DRAFT_KEY)).toBeNull();

    await io.flush();
    expect(fake.data.has(DRAFT_KEY)).toBe(false);
  });

  it("serialises writes to the same key so the last one wins", async () => {
    const fake = fakeStorage();
    const io = bufferedIO(fake.storage);
    await io.hydrate();
    const release = fake.block();

    io.io.save(STORAGE_KEY, "one");
    io.io.save(STORAGE_KEY, "two");
    release();
    await io.flush();

    expect(fake.data.get(STORAGE_KEY)).toBe("two");
    expect(io.writes()).toBe(2);
  });

  it("keeps going after a failed write, and remembers the failure", async () => {
    const fake = fakeStorage();
    const io = bufferedIO(fake.storage);
    await io.hydrate();

    fake.fail.write = true;
    io.io.save(STORAGE_KEY, "lost");
    await io.flush();

    expect(io.lastError()).toBeInstanceOf(Error);
    expect(io.io.load(STORAGE_KEY)).toBe("lost");

    fake.fail.write = false;
    io.io.save(STORAGE_KEY, "kept");
    await io.flush();
    expect(fake.data.get(STORAGE_KEY)).toBe("kept");
  });

  it("reports a failed remove without throwing", async () => {
    const fake = fakeStorage({ [DRAFT_KEY]: "draft" });
    const io = bufferedIO(fake.storage);
    await io.hydrate();
    fake.fail.remove = true;

    io.io.remove(DRAFT_KEY);
    await expect(io.flush()).resolves.toBeUndefined();
    expect(io.lastError()).toBeInstanceOf(Error);
  });
});

describe("the onboarded flag", () => {
  it("is written once when the answer changes, and not on every save", async () => {
    const fake = fakeStorage();
    const io = bufferedIO(fake.storage);
    await io.hydrate();

    io.io.onOnboarded?.(true);
    io.io.onOnboarded?.(true);
    await io.flush();
    expect(io.writes()).toBe(1);
    expect(fake.data.get(ONBOARDED_KEY)).toBe("1");

    io.io.onOnboarded?.(false);
    await io.flush();
    expect(io.writes()).toBe(2);
    expect(fake.data.get(ONBOARDED_KEY)).toBe("");
  });

  it("stays quiet when asked for the value it already holds", async () => {
    const fake = fakeStorage({ [ONBOARDED_KEY]: "1" });
    const io = bufferedIO(fake.storage);
    await io.hydrate();

    io.io.onOnboarded?.(true);
    await io.flush();
    expect(io.writes()).toBe(0);
  });
});

describe("the store over the adapter", () => {
  it("hydrates a pin written by a previous run, with no await in the store's path", async () => {
    const fake = fakeStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: 1,
        onboarded: true,
        pins: [
          {
            id: "calm",
            title: "A calmer evening",
            packId: "w28",
            packTitle: "Week 28",
            at: "2026-01-01",
          },
        ],
      }),
    });
    const io = bufferedIO(fake.storage);
    await io.hydrate();
    const store = createStore(io.io);
    store.hydrate();

    expect(store.getSnapshot().onboarded).toBe(true);
    expect(store.getSnapshot().pins.map((pin) => pin.id)).toEqual(["calm"]);
  });

  it("persists an action to storage, as JSON the web can read", async () => {
    const fake = fakeStorage();
    const io = bufferedIO(fake.storage);
    await io.hydrate();
    const store = createStore(io.io);

    store.togglePin({ id: "calm", title: "Calm", packId: "w28", packTitle: "Week 28" });
    await io.flush();

    const written = JSON.parse(fake.data.get(STORAGE_KEY) ?? "{}") as { pins?: { id: string }[] };
    expect(written.pins?.map((pin) => pin.id)).toEqual(["calm"]);
  });
});
