import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { listDevices, pruneDevices, registerDevice, removeDevice } from "./devices";
import { migrateUp } from "./migrate";
import { scopeFor, type Scope } from "./scope";
import { createTestDb } from "./testing";

let db: Awaited<ReturnType<typeof createTestDb>>;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.exec("drop schema public cascade; create schema public;");
  await migrateUp(db);
});

afterAll(async () => {
  await db.close();
});

async function seed(email: string, household: string): Promise<Scope> {
  const { rows } = await db.query<{ id: string }>(
    "insert into users (email) values ($1) returning id",
    [email],
  );
  const userId = rows[0]!.id;
  const hh = await db.query<{ id: string }>(
    "insert into households (name) values ($1) returning id",
    [household],
  );
  await db.query(
    "insert into household_members (household_id, user_id, role) values ($1,$2,'parent')",
    [hh.rows[0]!.id, userId],
  );
  return scopeFor(db, userId);
}

async function rows(): Promise<number> {
  const result = await db.query<{ count: string }>("select count(*) from device_tokens");
  return Number(result.rows[0]!.count);
}

describe("device tokens", () => {
  it("registers one row per install and never lists another household's", async () => {
    const one = await seed("one@example.com", "One");
    const two = await seed("two@example.com", "Two");

    await registerDevice(db, one, { token: "token-a", platform: "ios" });
    await registerDevice(db, two, { token: "token-b", platform: "android" });

    await expect(listDevices(db, one)).resolves.toEqual([{ token: "token-a", platform: "ios" }]);
    await expect(listDevices(db, two)).resolves.toEqual([
      { token: "token-b", platform: "android" },
    ]);
  });

  it("moves a phone that signs into a second household instead of copying it", async () => {
    const one = await seed("one@example.com", "One");
    const two = await seed("two@example.com", "Two");

    await registerDevice(db, one, { token: "same-phone", platform: "ios" });
    await registerDevice(db, two, { token: "same-phone", platform: "ios" });

    expect(await rows()).toBe(1);
    await expect(listDevices(db, one)).resolves.toEqual([]);
    await expect(listDevices(db, two)).resolves.toEqual([{ token: "same-phone", platform: "ios" }]);
  });

  it("removes an install on sign-out, and only from its own household", async () => {
    const one = await seed("one@example.com", "One");
    const two = await seed("two@example.com", "Two");
    await registerDevice(db, one, { token: "phone", platform: "android" });

    await expect(removeDevice(db, two, "phone")).resolves.toBe(false);
    await expect(removeDevice(db, one, "phone")).resolves.toBe(true);
    expect(await rows()).toBe(0);
  });

  it("prunes nothing when the push service rejected no tokens", async () => {
    const one = await seed("one@example.com", "One");
    await registerDevice(db, one, { token: "kept", platform: "ios" });

    await expect(pruneDevices(db, one, [])).resolves.toBe(0);
    await expect(listDevices(db, one)).resolves.toEqual([{ token: "kept", platform: "ios" }]);
  });

  it("prunes rejected tokens, scoped to the household that owns them", async () => {
    const one = await seed("one@example.com", "One");
    const two = await seed("two@example.com", "Two");
    await registerDevice(db, one, { token: "gone", platform: "ios" });
    await registerDevice(db, two, { token: "kept", platform: "ios" });

    await expect(pruneDevices(db, two, ["gone"])).resolves.toBe(0);
    await expect(pruneDevices(db, one, ["gone"])).resolves.toBe(1);
    await expect(listDevices(db, two)).resolves.toEqual([{ token: "kept", platform: "ios" }]);
  });
});
