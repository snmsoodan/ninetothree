import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  accountCsv,
  cancelDeletion,
  DELETION_GRACE_DAYS,
  deletionStatus,
  exportAccount,
  purgeDeleted,
  requestDeletion,
} from "./account";
import { migrateUp } from "./migrate";
import * as repo from "./repo";
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

interface Fixture {
  scope: Scope;
  userId: string;
  householdId: string;
}

async function seed(email: string): Promise<Fixture> {
  const { rows } = await db.query<{ id: string }>(
    "insert into users (email) values ($1) returning id",
    [email],
  );
  const userId = rows[0]!.id;
  const hh = await db.query<{ id: string }>(
    "insert into households (name) values ('Home') returning id",
  );
  const householdId = hh.rows[0]!.id;
  await db.query(
    "insert into household_members (household_id, user_id, role) values ($1,$2,'parent')",
    [householdId, userId],
  );
  return { scope: await scopeFor(db, userId), userId, householdId };
}

async function seedPack(id: string): Promise<void> {
  await db.query(
    `insert into stage_packs (id, kind, stage_index, title, payload)
     values ($1, 'pregnancy', 4, 'Week 4', '{}'::jsonb)`,
    [id],
  );
}

const DAY = 24 * 60 * 60 * 1000;

describe("exportAccount", () => {
  it("returns every table that holds something a person put there", async () => {
    const sam = await seed("sam@example.com");
    await seedPack("pregnancy-w4");
    await repo.upsertPregnancy(db, sam.scope, { dueDate: "2026-06-01" });
    await repo.setProgress(db, sam.scope, { stagePackId: "pregnancy-w4", state: "complete" });
    await repo.setItemState(db, sam.scope, {
      itemId: "w4-book",
      stagePackId: "pregnancy-w4",
      state: "done",
      title: "Book the first visit",
      note: "Dr Okafor, Tuesday",
    });
    await repo.createAppointment(db, sam.scope, {
      title: "First scan",
      kind: "scan",
      dueAt: new Date("2026-04-02T15:00:00Z"),
    });
    await repo.createReminder(db, sam.scope, {
      itemId: "w4-book",
      title: "Book the first visit",
      remindAt: new Date("2026-03-20T09:00:00Z"),
    });
    await repo.shareItem(db, sam.scope, {
      itemId: "w4-book",
      title: "Book the first visit",
      stagePackId: "pregnancy-w4",
      packTitle: "Week 4",
    });

    const exported = await exportAccount(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });

    expect(exported.exportedAt).toBe("2026-03-01T00:00:00.000Z");
    expect(exported.user?.email).toBe("sam@example.com");
    expect(exported.household?.name).toBe("Home");
    expect(exported.members).toHaveLength(1);
    expect(exported.pregnancy?.due_date).toBeInstanceOf(Date);
    expect(exported.progress).toHaveLength(1);
    expect(exported.items).toHaveLength(1);
    expect(exported.items[0]?.note).toBe("Dr Okafor, Tuesday");
    expect(exported.appointments).toHaveLength(1);
    expect(exported.reminders).toHaveLength(1);
    expect(exported.sharedItems).toHaveLength(1);
    expect(exported.jobs).toEqual([]);
    expect(exported.invites).toEqual([]);
    expect(exported.subscription).toBeNull();
    expect(exported.child).toBeNull();
    expect(exported.deletion).toBeNull();
  });

  it("does not export another person's private rows", async () => {
    const sam = await seed("sam@example.com");
    await seedPack("pregnancy-w4");
    await repo.createInvite(db, sam.scope, "partner", { token: "t" });
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ('nan@example.com') returning id",
    );
    await db.query(
      "insert into household_members (household_id, user_id, role) values ($1,$2,'partner')",
      [sam.householdId, rows[0]!.id],
    );
    const nanScope = await scopeFor(db, rows[0]!.id);
    await repo.setItemState(db, nanScope, {
      itemId: "w4-nan",
      stagePackId: "pregnancy-w4",
      state: "done",
      title: "Nan's own thing",
      note: "private",
    });

    const exported = await exportAccount(db, sam.scope);

    expect(exported.items).toEqual([]);
    expect(exported.members).toHaveLength(2);
  });

  it("includes a live deletion request", async () => {
    const sam = await seed("sam@example.com");
    await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });

    const exported = await exportAccount(db, sam.scope);

    expect(exported.deletion).toEqual({
      requestedAt: "2026-03-01T00:00:00.000Z",
      purgeAfter: "2026-03-31T00:00:00.000Z",
    });
  });
});

describe("accountCsv", () => {
  it("writes a header and one row per thing", async () => {
    const sam = await seed("sam@example.com");
    await seedPack("pregnancy-w4");
    await repo.setItemState(db, sam.scope, {
      itemId: "w4-book",
      stagePackId: "pregnancy-w4",
      state: "done",
      title: "Book the first visit",
    });
    await repo.setProgress(db, sam.scope, { stagePackId: "pregnancy-w4", state: "complete" });

    const csv = accountCsv(await exportAccount(db, sam.scope));
    const lines = csv.trimEnd().split("\r\n");

    expect(lines[0]).toBe("section,id,title,stage,state,date,detail");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Pinned and done,w4-book,Book the first visit,pregnancy-w4,done,");
    expect(lines[2]).toContain("Weeks,pregnancy-w4,pregnancy-w4,pregnancy-w4,complete,");
  });

  it("quotes a field with a comma, a quote or a newline", async () => {
    const sam = await seed("sam@example.com");
    await seedPack("pregnancy-w4");
    await repo.setItemState(db, sam.scope, {
      itemId: "w4-book",
      stagePackId: "pregnancy-w4",
      state: "done",
      title: 'Ask for "the good room", please',
      note: "line one\nline two",
    });

    const csv = accountCsv(await exportAccount(db, sam.scope));

    expect(csv).toContain('"Ask for ""the good room"", please"');
    expect(csv).toContain('"line one\nline two"');
  });

  it("writes a row for an appointment, a reminder, a job and a shared pin", async () => {
    const sam = await seed("sam@example.com");
    await seedPack("pregnancy-w4");
    await repo.createAppointment(db, sam.scope, {
      title: "First scan",
      kind: "scan",
      dueAt: new Date("2026-04-02T15:00:00Z"),
      location: "Riverside",
    });
    await repo.createReminder(db, sam.scope, {
      itemId: "w4-book",
      title: "Book the first visit",
      remindAt: new Date("2026-03-20T09:00:00Z"),
    });
    await repo.assignJob(db, sam.scope, {
      itemId: "w4-book",
      title: "Book the first visit",
      stagePackId: "pregnancy-w4",
      packTitle: "Week 4",
      assignedTo: sam.userId,
    });
    await repo.shareItem(db, sam.scope, {
      itemId: "w4-book",
      title: "Book the first visit",
      stagePackId: "pregnancy-w4",
      packTitle: "Week 4",
    });

    const csv = accountCsv(await exportAccount(db, sam.scope));

    expect(csv).toContain("Appointments,");
    expect(csv).toContain("First scan");
    expect(csv).toContain("Reminders,w4-book,Book the first visit,,");
    expect(csv).toContain("Jobs,");
    expect(csv).toContain(",open,");
    expect(csv).toContain("Shared,w4-book,Book the first visit,Week 4,,");
  });

  it("writes a header and nothing else for an empty account", async () => {
    const sam = await seed("sam@example.com");
    const csv = accountCsv(await exportAccount(db, sam.scope));
    expect(csv).toBe("section,id,title,stage,state,date,detail\r\n");
  });
});

describe("requestDeletion", () => {
  it("works out the date itself when nobody passes one", async () => {
    const sam = await seed("sam@example.com");
    const status = await requestDeletion(db, sam.scope);
    const days =
      (new Date(status.purgeAfter).getTime() - new Date(status.requestedAt).getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(30);
  });

  it("sets the grace period to thirty days", async () => {
    const sam = await seed("sam@example.com");
    const now = new Date("2026-03-01T00:00:00Z");

    const status = await requestDeletion(db, sam.scope, { now });

    expect(DELETION_GRACE_DAYS).toBe(30);
    expect(status.requestedAt).toBe("2026-03-01T00:00:00.000Z");
    expect(status.purgeAfter).toBe(new Date(now.getTime() + 30 * DAY).toISOString());
  });

  it("marks the user as deleted", async () => {
    const sam = await seed("sam@example.com");
    await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });

    const user = await repo.getUser(db, sam.scope);
    expect(user?.deleted_at).toBeInstanceOf(Date);
  });

  it("does not push the date out when asked twice", async () => {
    const sam = await seed("sam@example.com");
    const first = await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });
    const second = await requestDeletion(db, sam.scope, { now: new Date("2026-03-10T00:00:00Z") });

    expect(second).toEqual(first);
  });

  it("starts a fresh request after one was cancelled", async () => {
    const sam = await seed("sam@example.com");
    await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });
    await cancelDeletion(db, sam.scope, { now: new Date("2026-03-02T00:00:00Z") });

    const again = await requestDeletion(db, sam.scope, { now: new Date("2026-04-01T00:00:00Z") });

    expect(again.requestedAt).toBe("2026-04-01T00:00:00.000Z");
  });
});

describe("cancelDeletion", () => {
  it("clears the mark and says it did something", async () => {
    const sam = await seed("sam@example.com");
    await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });

    expect(await cancelDeletion(db, sam.scope, { now: new Date("2026-03-02T00:00:00Z") })).toBe(
      true,
    );
    expect((await repo.getUser(db, sam.scope))?.deleted_at).toBeNull();
    expect(await deletionStatus(db, sam.scope)).toBeUndefined();
  });

  it("says so when there was nothing to cancel", async () => {
    const sam = await seed("sam@example.com");
    expect(await cancelDeletion(db, sam.scope)).toBe(false);
  });
});

describe("deletionStatus", () => {
  it("is undefined before a request and after a cancel", async () => {
    const sam = await seed("sam@example.com");
    expect(await deletionStatus(db, sam.scope)).toBeUndefined();
  });

  it("reports the live request", async () => {
    const sam = await seed("sam@example.com");
    await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });

    expect(await deletionStatus(db, sam.scope)).toEqual({
      requestedAt: "2026-03-01T00:00:00.000Z",
      purgeAfter: "2026-03-31T00:00:00.000Z",
    });
  });
});

describe("purgeDeleted", () => {
  it("removes nothing before the grace period is up", async () => {
    const sam = await seed("sam@example.com");
    await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });

    expect(await purgeDeleted(db, { now: new Date("2026-03-30T00:00:00Z") })).toEqual({
      purged: 0,
    });
    const { rows } = await db.query("select id from users");
    expect(rows).toHaveLength(1);
  });

  it("removes the user and everything that cascades from them", async () => {
    const sam = await seed("sam@example.com");
    await seedPack("pregnancy-w4");
    await repo.setItemState(db, sam.scope, {
      itemId: "w4-book",
      stagePackId: "pregnancy-w4",
      state: "done",
      title: "Book the first visit",
    });
    await repo.setProgress(db, sam.scope, { stagePackId: "pregnancy-w4", state: "complete" });
    await repo.createAppointment(db, sam.scope, {
      title: "First scan",
      kind: "scan",
      dueAt: new Date("2026-04-02T15:00:00Z"),
    });
    await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });

    expect(await purgeDeleted(db, { now: new Date("2026-04-01T00:00:00Z") })).toEqual({
      purged: 1,
    });

    for (const table of [
      "users",
      "household_members",
      "item_state",
      "stage_progress",
      "appointments",
      "deletion_requests",
    ]) {
      const { rows } = await db.query(`select 1 from ${table}`);
      expect(rows, table).toHaveLength(0);
    }
  });

  it("keeps a household that still has somebody in it", async () => {
    const sam = await seed("sam@example.com");
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ('nan@example.com') returning id",
    );
    await db.query(
      "insert into household_members (household_id, user_id, role) values ($1,$2,'partner')",
      [sam.householdId, rows[0]!.id],
    );
    await repo.createAppointment(db, sam.scope, {
      title: "First scan",
      kind: "scan",
      dueAt: new Date("2026-04-02T15:00:00Z"),
    });
    await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });

    expect(await purgeDeleted(db, { now: new Date("2026-04-01T00:00:00Z") })).toEqual({
      purged: 1,
    });

    const households = await db.query("select id from households");
    expect(households.rows).toHaveLength(1);
    const appointments = await db.query("select id from appointments");
    expect(appointments.rows).toHaveLength(1);
  });

  it("leaves a cancelled request alone", async () => {
    const sam = await seed("sam@example.com");
    await requestDeletion(db, sam.scope, { now: new Date("2026-03-01T00:00:00Z") });
    await cancelDeletion(db, sam.scope, { now: new Date("2026-03-02T00:00:00Z") });

    expect(await purgeDeleted(db, { now: new Date("2026-06-01T00:00:00Z") })).toEqual({
      purged: 0,
    });
    const { rows } = await db.query("select id from users");
    expect(rows).toHaveLength(1);
  });

  it("works out the time itself when nobody passes one", async () => {
    expect(await purgeDeleted(db)).toEqual({ purged: 0 });
  });

  it("rolls back when the household cleanup fails", async () => {
    const exec = vi.fn().mockResolvedValue(undefined);
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: "u1" }] })
      .mockRejectedValueOnce(new Error("the disk is full"));

    await expect(purgeDeleted({ exec, query }, { now: new Date() })).rejects.toThrow(
      "the disk is full",
    );
    expect(exec.mock.calls.map((call) => call[0])).toEqual(["begin", "rollback"]);
  });

  it("leaves an account that never asked alone", async () => {
    await seed("sam@example.com");
    expect(await purgeDeleted(db, { now: new Date("2030-01-01T00:00:00Z") })).toEqual({
      purged: 0,
    });
  });
});
