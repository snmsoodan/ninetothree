import { describe, expect, it } from "vitest";
import { EMPTY_STATE, STORAGE_KEY } from "@ninetothree/domain";
import { bootScreen, bootStorage } from "./boot";
import { ONBOARDED_KEY, type AsyncKeyValue } from "./storage";

function fakeStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  const calls: string[] = [];
  const storage: AsyncKeyValue = {
    async getItem(key) {
      calls.push(`get ${key}`);
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      calls.push(`set ${key}`);
      data.set(key, value);
    },
    async removeItem(key) {
      calls.push(`remove ${key}`);
      data.delete(key);
    },
  };
  return { storage, data, calls };
}

const stored = (state: Record<string, unknown>) => JSON.stringify({ version: 1, ...state });

describe("where a parent lands", () => {
  it("goes straight to today once the state says onboarding is done", () => {
    expect(bootScreen({ ...EMPTY_STATE, onboarded: true }, null)).toBe("/today");
  });

  it("asks a parent who has never answered", () => {
    expect(bootScreen(EMPTY_STATE, null)).toBe("/onboarding");
    expect(bootScreen(EMPTY_STATE, "")).toBe("/onboarding");
  });

  it("trusts the state's answer over the flag when the two disagree", () => {
    // Only reachable if a reset cleared the JSON and left the flag behind, or a
    // later schema change dropped the field the flag used to mirror.
    expect(bootScreen({ ...EMPTY_STATE, onboarded: true }, "")).toBe("/today");
  });

  it("falls back to the flag when the JSON did not survive", () => {
    expect(bootScreen(EMPTY_STATE, "1")).toBe("/today");
  });
});

describe("booting over real storage", () => {
  it("opens today for a returning parent, with their pins and progress read", async () => {
    const fake = fakeStorage({
      [STORAGE_KEY]: stored({
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
        completed: { w28: { at: "2026-01-02" } },
      }),
    });

    const booted = await bootStorage(fake.storage);

    expect(booted.screen).toBe("/today");
    expect(booted.store.isHydrated()).toBe(true);
    expect(booted.store.getSnapshot().pins.map((pin) => pin.id)).toEqual(["calm"]);
    expect(booted.store.getSnapshot().completed.w28?.at).toBe("2026-01-02");
  });

  it("asks a first-time parent, and writes nothing just by opening", async () => {
    const fake = fakeStorage();

    const booted = await bootStorage(fake.storage);

    expect(booted.screen).toBe("/onboarding");
    expect(booted.store.getSnapshot().onboarded).toBe(false);
    expect(fake.calls.filter((call) => call.startsWith("set"))).toEqual([]);
    expect(fake.data.size).toBe(0);
  });

  it("lands on onboarding when the JSON is unreadable, rather than crashing", async () => {
    const fake = fakeStorage({ [STORAGE_KEY]: "{not json" });

    const booted = await bootStorage(fake.storage);

    expect(booted.screen).toBe("/onboarding");
    expect(booted.store.getSnapshot().pins).toEqual([]);
  });

  it("still lands on today from the flag alone when the JSON is unreadable", async () => {
    const fake = fakeStorage({ [STORAGE_KEY]: "{not json", [ONBOARDED_KEY]: "1" });

    const booted = await bootStorage(fake.storage);

    expect(booted.screen).toBe("/today");
  });

  it("persists a pin made after boot through the same adapter", async () => {
    const fake = fakeStorage();
    const booted = await bootStorage(fake.storage);

    booted.store.togglePin({ id: "walk", title: "A walk", packId: "w30", packTitle: "Week 30" });
    await booted.io.flush();

    // The boot gate must hand back a writer, not just a reader: the shell's
    // first action happens before any screen has had a chance to wire one up.
    const written = JSON.parse(fake.data.get(STORAGE_KEY) ?? "{}") as { pins?: { id: string }[] };
    expect(written.pins?.map((pin) => pin.id)).toEqual(["walk"]);
  });
});
