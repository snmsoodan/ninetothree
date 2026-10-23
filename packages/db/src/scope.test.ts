import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrateUp } from "./migrate";
import { asUser, NoHouseholdError, scopeFor, type Scope } from "./scope";
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

async function seedUser(email: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    "insert into users (email) values ($1) returning id",
    [email],
  );
  return rows[0]!.id;
}

async function seedHousehold(userId: string, name: string): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    "insert into households (name) values ($1) returning id",
    [name],
  );
  const householdId = rows[0]!.id;
  await db.query(
    "insert into household_members (household_id, user_id, role) values ($1,$2,'parent')",
    [householdId, userId],
  );
  return householdId;
}

describe("scopeFor", () => {
  it("resolves the household and role for a member", async () => {
    const userId = await seedUser("a@example.com");
    const householdId = await seedHousehold(userId, "Home");

    const scope = await scopeFor(db, userId);

    expect(scope.userId).toBe(userId);
    expect(scope.householdId).toBe(householdId);
    expect(scope.role).toBe("parent");
  });

  it("throws NoHouseholdError for a user who belongs to nothing", async () => {
    const userId = await seedUser("lonely@example.com");

    await expect(scopeFor(db, userId)).rejects.toBeInstanceOf(NoHouseholdError);
    await expect(scopeFor(db, userId)).rejects.toThrow(/not a member of any household/);
  });

  it("picks the same household every time when a user has two", async () => {
    const userId = await seedUser("two@example.com");
    const first = await seedHousehold(userId, "First");
    const second = await seedHousehold(userId, "Second");

    const a = await scopeFor(db, userId);
    const b = await scopeFor(db, userId);

    expect(a.householdId).toBe(b.householdId);
    expect([first, second]).toContain(a.householdId);
  });

  it("picks the household they joined first", async () => {
    const userId = await seedUser("two@example.com");
    const older = await seedHousehold(userId, "Older");
    const newer = await seedHousehold(userId, "Newer");
    await db.query("update households set created_at = '2020-01-01T00:00:00Z' where id = $1", [
      older,
    ]);
    await db.query("update households set created_at = '2021-01-01T00:00:00Z' where id = $1", [
      newer,
    ]);

    const scope = await scopeFor(db, userId);

    expect(scope.householdId).toBe(older);
  });

  it("carries the role the membership row actually has", async () => {
    const userId = await seedUser("partner@example.com");
    const { rows } = await db.query<{ id: string }>(
      "insert into households (name) values ('Home') returning id",
    );
    await db.query(
      "insert into household_members (household_id, user_id, role) values ($1,$2,'partner')",
      [rows[0]!.id, userId],
    );

    const scope = await scopeFor(db, userId);

    expect(scope.role).toBe("partner");
  });
});

describe("asUser", () => {
  it("returns what the callback returns", async () => {
    const userId = await seedUser("a@example.com");

    const value = await asUser(db, userId, async () => 42);

    expect(value).toBe(42);
  });

  it("sets app.user_id for the duration of the transaction", async () => {
    const userId = await seedUser("a@example.com");

    const seen = await asUser(db, userId, async () => {
      const { rows } = await db.query<{ id: string }>(
        "select current_setting('app.user_id', true) as id",
      );
      return rows[0]!.id;
    });

    expect(seen).toBe(userId);
  });

  it("rolls back on error and leaves the connection usable", async () => {
    const userId = await seedUser("a@example.com");

    await expect(
      asUser(db, userId, async () => {
        await db.query("insert into users (email) values ('ghost@example.com')");
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    const { rows } = await db.query<{ count: string }>(
      "select count(*)::text as count from users where email = 'ghost@example.com'",
    );
    expect(rows[0]!.count).toBe("0");

    // The connection is not stuck in an aborted transaction.
    const after = await db.query<{ n: number }>("select 1 as n");
    expect(after.rows[0]!.n).toBe(1);
  });

  it("does not leak the setting to the next transaction", async () => {
    const userId = await seedUser("a@example.com");
    await asUser(db, userId, async () => undefined);

    const { rows } = await db.query<{ id: string | null }>(
      "select current_setting('app.user_id', true) as id",
    );

    expect(rows[0]!.id ?? "").toBe("");
  });
});

describe("the Scope type", () => {
  it("cannot be built from an object literal", () => {
    // @ts-expect-error — the brand is not exported, so this is a type error.
    const forged: Scope = { userId: "a", householdId: "b", role: "parent" };
    expect(forged).toBeDefined();
  });
});
