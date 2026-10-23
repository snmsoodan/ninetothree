import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
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

const ymd = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);

interface Fixture {
  scope: Scope;
  userId: string;
  householdId: string;
}

async function seed(email: string, householdName: string): Promise<Fixture> {
  const { rows } = await db.query<{ id: string }>(
    "insert into users (email) values ($1) returning id",
    [email],
  );
  const userId = rows[0]!.id;
  const hh = await db.query<{ id: string }>(
    "insert into households (name) values ($1) returning id",
    [householdName],
  );
  const householdId = hh.rows[0]!.id;
  await db.query(
    "insert into household_members (household_id, user_id, role) values ($1,$2,'parent')",
    [householdId, userId],
  );
  return { scope: await scopeFor(db, userId), userId, householdId };
}

describe("users", () => {
  it("reads the signed-in user and nobody else", async () => {
    const a = await seed("a@example.com", "A");
    await seed("b@example.com", "B");

    const user = await repo.getUser(db, a.scope);

    expect(user?.email).toBe("a@example.com");
  });

  it("updates only the fields it is given", async () => {
    const a = await seed("a@example.com", "A");

    const updated = await repo.updateUser(db, a.scope, {
      name: "Sam",
      timezone: "America/Chicago",
    });

    expect(updated?.name).toBe("Sam");
    expect(updated?.timezone).toBe("America/Chicago");
    expect(updated?.locale).toBe("en-US");
    expect(updated?.country).toBe("US");
  });

  it("leaves untouched fields alone on a second patch", async () => {
    const a = await seed("a@example.com", "A");
    await repo.updateUser(db, a.scope, { name: "Sam" });

    const updated = await repo.updateUser(db, a.scope, { locale: "es-US" });

    expect(updated?.name).toBe("Sam");
    expect(updated?.locale).toBe("es-US");
  });
});

describe("households", () => {
  it("reads the household the scope names", async () => {
    const a = await seed("a@example.com", "The Singhs");

    const household = await repo.getHousehold(db, a.scope);

    expect(household?.name).toBe("The Singhs");
  });

  it("lists the members of that household only", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");

    const members = await repo.listMembers(db, a.scope);

    expect(members).toHaveLength(1);
    expect(members[0]!.user_id).toBe(a.userId);
    expect(members.map((m) => m.user_id)).not.toContain(b.userId);
  });
});

describe("pregnancies", () => {
  it("returns nothing before one is recorded", async () => {
    const a = await seed("a@example.com", "A");

    expect(await repo.getPregnancy(db, a.scope)).toBeUndefined();
  });

  it("creates one, then updates it rather than adding a second", async () => {
    const a = await seed("a@example.com", "A");

    const created = await repo.upsertPregnancy(db, a.scope, {
      dueDate: "2027-04-01",
      startDate: "2026-06-25",
      parity: 1,
      multiples: true,
    });
    expect(ymd(created.due_date)).toBe("2027-04-01");
    expect(created.parity).toBe(1);
    expect(created.multiples).toBe(true);

    const updated = await repo.upsertPregnancy(db, a.scope, { dueDate: "2027-04-08" });
    expect(updated.id).toBe(created.id);
    expect(ymd(updated.due_date)).toBe("2027-04-08");
    expect(ymd(updated.start_date)).toBe("2026-06-25");
    expect(updated.parity).toBe(1);

    const { rows } = await db.query<{ n: string }>(
      "select count(*)::text as n from pregnancies where household_id = $1",
      [a.householdId],
    );
    expect(rows[0]!.n).toBe("1");
  });

  it("defaults parity to 0 and multiples to false", async () => {
    const a = await seed("a@example.com", "A");

    const created = await repo.upsertPregnancy(db, a.scope, { dueDate: "2027-04-01" });

    expect(created.parity).toBe(0);
    expect(created.multiples).toBe(false);
    expect(created.start_date).toBeNull();
  });

  it("ignores a pregnancy that is no longer active", async () => {
    const a = await seed("a@example.com", "A");
    await repo.upsertPregnancy(db, a.scope, { dueDate: "2027-04-01" });
    await db.query("update pregnancies set status = 'ended' where household_id = $1", [
      a.householdId,
    ]);

    expect(await repo.getPregnancy(db, a.scope)).toBeUndefined();
  });
});

describe("children", () => {
  it("returns nothing before one is recorded", async () => {
    const a = await seed("a@example.com", "A");

    expect(await repo.getChild(db, a.scope)).toBeUndefined();
  });

  it("creates one, then updates it rather than adding a second", async () => {
    const a = await seed("a@example.com", "A");

    const created = await repo.upsertChild(db, a.scope, {
      birthDate: "2027-03-20",
      dueDate: "2027-04-01",
      correctedAge: true,
      sex: "female",
      feeding: "breast",
      birthType: "c-section",
    });
    expect(ymd(created.birth_date)).toBe("2027-03-20");
    expect(created.corrected_age).toBe(true);
    expect(created.feeding).toBe("breast");

    const updated = await repo.upsertChild(db, a.scope, { birthDate: "2027-03-21" });
    expect(updated.id).toBe(created.id);
    expect(ymd(updated.birth_date)).toBe("2027-03-21");
    expect(updated.feeding).toBe("breast");
    expect(updated.birth_type).toBe("c-section");

    const { rows } = await db.query<{ n: string }>(
      "select count(*)::text as n from children where household_id = $1",
      [a.householdId],
    );
    expect(rows[0]!.n).toBe("1");
  });

  it("defaults corrected_age to false and the rest to null", async () => {
    const a = await seed("a@example.com", "A");

    const created = await repo.upsertChild(db, a.scope, { birthDate: "2027-03-20" });

    expect(created.corrected_age).toBe(false);
    expect(created.due_date).toBeNull();
    expect(created.sex).toBeNull();
    expect(created.feeding).toBeNull();
    expect(created.birth_type).toBeNull();
  });
});

describe("stage progress", () => {
  async function seedPack(id: string): Promise<void> {
    await db.query(
      `insert into stage_packs (id, kind, stage_index, title, payload)
       values ($1, 'pregnancy', 4, 'Week 4', '{}'::jsonb)`,
      [id],
    );
  }

  it("starts empty", async () => {
    const a = await seed("a@example.com", "A");

    expect(await repo.listProgress(db, a.scope)).toEqual([]);
  });

  it("records a settled week and reads it back", async () => {
    const a = await seed("a@example.com", "A");
    await seedPack("pregnancy-w4");

    const at = new Date("2026-07-01T12:00:00Z");
    const row = await repo.setProgress(db, a.scope, {
      stagePackId: "pregnancy-w4",
      state: "complete",
      completedAt: at,
    });

    expect(row.state).toBe("complete");
    expect(row.forced).toBe(false);
    expect(row.completed_at?.toISOString()).toBe(at.toISOString());

    const all = await repo.listProgress(db, a.scope);
    expect(all).toHaveLength(1);
  });

  it("distinguishes a forced week from a settled one", async () => {
    const a = await seed("a@example.com", "A");
    await seedPack("pregnancy-w4");

    const row = await repo.setProgress(db, a.scope, {
      stagePackId: "pregnancy-w4",
      state: "complete",
      forced: true,
    });

    expect(row.forced).toBe(true);
  });

  it("updates in place on a second write", async () => {
    const a = await seed("a@example.com", "A");
    await seedPack("pregnancy-w4");

    await repo.setProgress(db, a.scope, { stagePackId: "pregnancy-w4", state: "in_progress" });
    const row = await repo.setProgress(db, a.scope, {
      stagePackId: "pregnancy-w4",
      state: "complete",
    });

    expect(row.state).toBe("complete");
    const all = await repo.listProgress(db, a.scope);
    expect(all).toHaveLength(1);
  });

  it("keeps one person's progress out of another's list", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");
    await seedPack("pregnancy-w4");

    await repo.setProgress(db, a.scope, { stagePackId: "pregnancy-w4", state: "complete" });

    expect(await repo.listProgress(db, b.scope)).toEqual([]);
  });
});

describe("item state", () => {
  it("starts empty", async () => {
    const a = await seed("a@example.com", "A");

    expect(await repo.listItemState(db, a.scope)).toEqual([]);
    expect(await repo.listPinned(db, a.scope)).toEqual([]);
  });

  it("records a done action with its snapshot", async () => {
    const a = await seed("a@example.com", "A");

    const row = await repo.setItemState(db, a.scope, {
      itemId: "book-dating-scan",
      state: "done",
      title: "Book your dating scan",
      packTitle: "Week 8",
    });

    expect(row.state).toBe("done");
    expect(row.title).toBe("Book your dating scan");
    expect(row.pack_title).toBe("Week 8");
    expect(row.pinned).toBe(false);
  });

  it("records a skip with a reason", async () => {
    const a = await seed("a@example.com", "A");

    const row = await repo.setItemState(db, a.scope, {
      itemId: "buy-pillow",
      state: "skipped",
      skipReason: "not-for-me",
    });

    expect(row.state).toBe("skipped");
    expect(row.skip_reason).toBe("not-for-me");
  });

  it("pins, and lists only what is pinned", async () => {
    const a = await seed("a@example.com", "A");
    const at = new Date("2026-07-01T12:00:00Z");

    await repo.setItemState(db, a.scope, { itemId: "a-one", state: "done" });
    await repo.setItemState(db, a.scope, {
      itemId: "b-two",
      state: "done",
      pinned: true,
      pinnedAt: at,
      title: "Pediatrician",
    });

    const pinned = await repo.listPinned(db, a.scope);
    expect(pinned).toHaveLength(1);
    expect(pinned[0]!.item_id).toBe("b-two");
    expect(pinned[0]!.title).toBe("Pediatrician");
  });

  it("keeps the snapshot when a later write does not carry one", async () => {
    const a = await seed("a@example.com", "A");
    await repo.setItemState(db, a.scope, {
      itemId: "a-one",
      state: "done",
      title: "Original",
      packTitle: "Week 8",
      note: "keep me",
    });

    const row = await repo.setItemState(db, a.scope, { itemId: "a-one", state: "skipped" });

    expect(row.title).toBe("Original");
    expect(row.pack_title).toBe("Week 8");
    expect(row.note).toBe("keep me");
    expect(row.state).toBe("skipped");
  });

  it("records a choice", async () => {
    const a = await seed("a@example.com", "A");
    const at = new Date("2026-07-01T12:00:00Z");

    const row = await repo.setItemState(db, a.scope, {
      itemId: "choose-carrier",
      state: "done",
      choiceOptionId: "ergobaby-omni",
      choiceLabel: "Ergobaby Omni 360",
      chosenAt: at,
    });

    expect(row.choice_option_id).toBe("ergobaby-omni");
    expect(row.choice_label).toBe("Ergobaby Omni 360");
    expect(row.chosen_at?.toISOString()).toBe(at.toISOString());
  });

  it("records a snooze and a reminder date", async () => {
    const a = await seed("a@example.com", "A");

    const row = await repo.setItemState(db, a.scope, {
      itemId: "a-one",
      state: "snoozed",
      snoozedUntil: "2026-08-01",
      remindOn: "2026-07-25",
    });

    expect(ymd(row.snoozed_until)).toBe("2026-08-01");
    expect(ymd(row.remind_on)).toBe("2026-07-25");
  });

  it("unpins and clears the time when asked to", async () => {
    const a = await seed("a@example.com", "A");
    await repo.setItemState(db, a.scope, { itemId: "a-one", state: "done", pinned: true });

    const row = await repo.setItemState(db, a.scope, {
      itemId: "a-one",
      state: "done",
      pinned: false,
    });

    expect(row.pinned).toBe(false);
    expect(row.pinned_at).toBeNull();
    expect(await repo.listPinned(db, a.scope)).toEqual([]);
  });

  it("does not unpin when the write says nothing about pinning", async () => {
    const a = await seed("a@example.com", "A");
    const pinned = await repo.setItemState(db, a.scope, {
      itemId: "a-one",
      state: "done",
      pinned: true,
    });

    const row = await repo.setItemState(db, a.scope, { itemId: "a-one", state: "skipped" });

    expect(row.pinned).toBe(true);
    expect(row.pinned_at?.toISOString()).toBe(pinned.pinned_at?.toISOString());
  });

  it("keeps one person's pins out of another's shelf", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");

    await repo.setItemState(db, a.scope, { itemId: "a-one", state: "done", pinned: true });

    expect(await repo.listPinned(db, b.scope)).toEqual([]);
  });

  it("survives the retirement of the pack it came from", async () => {
    const a = await seed("a@example.com", "A");
    await db.query(
      `insert into stage_packs (id, kind, stage_index, title, payload)
       values ('pregnancy-w4', 'pregnancy', 4, 'Week 4', '{}'::jsonb)`,
    );
    await repo.setItemState(db, a.scope, {
      itemId: "a-one",
      stagePackId: "pregnancy-w4",
      state: "done",
      pinned: true,
      title: "Keep me",
    });

    await db.query("delete from stage_packs where id = 'pregnancy-w4'");

    const pinned = await repo.listPinned(db, a.scope);
    expect(pinned).toHaveLength(1);
    expect(pinned[0]!.stage_pack_id).toBeNull();
    expect(pinned[0]!.title).toBe("Keep me");
  });
});

describe("appointments", () => {
  it("starts empty", async () => {
    const a = await seed("a@example.com", "A");

    expect(await repo.listAppointments(db, a.scope)).toEqual([]);
  });

  it("creates one and lists it in date order", async () => {
    const a = await seed("a@example.com", "A");

    await repo.createAppointment(db, a.scope, {
      title: "Growth scan",
      dueAt: new Date("2026-09-01T09:00:00Z"),
      who: "Dr Chen",
      location: "Riverside",
      notes: "Bring the folder",
      kind: "scan",
    });
    await repo.createAppointment(db, a.scope, {
      title: "Dating scan",
      dueAt: new Date("2026-07-01T09:00:00Z"),
    });

    const all = await repo.listAppointments(db, a.scope);
    expect(all.map((x) => x.title)).toEqual(["Dating scan", "Growth scan"]);
    expect(all[1]!.who).toBe("Dr Chen");
    expect(all[1]!.source).toBe("user");
  });

  it("accepts an appointment with no date and sorts it last", async () => {
    const a = await seed("a@example.com", "A");

    await repo.createAppointment(db, a.scope, { title: "Someday" });
    await repo.createAppointment(db, a.scope, {
      title: "Soon",
      dueAt: new Date("2026-07-01T09:00:00Z"),
      source: "auto",
    });

    const all = await repo.listAppointments(db, a.scope);
    expect(all.map((x) => x.title)).toEqual(["Soon", "Someday"]);
    expect(all[0]!.source).toBe("auto");
  });

  it("deletes one, and reports whether it did", async () => {
    const a = await seed("a@example.com", "A");
    const created = await repo.createAppointment(db, a.scope, { title: "Growth scan" });

    expect(await repo.deleteAppointment(db, a.scope, created.id)).toBe(true);
    expect(await repo.deleteAppointment(db, a.scope, created.id)).toBe(false);
    expect(await repo.listAppointments(db, a.scope)).toEqual([]);
  });

  it("cannot delete another household's appointment", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");
    const created = await repo.createAppointment(db, a.scope, { title: "Growth scan" });

    expect(await repo.deleteAppointment(db, b.scope, created.id)).toBe(false);
    expect(await repo.listAppointments(db, a.scope)).toHaveLength(1);
  });

  it("keeps one household's appointments out of another's list", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");

    await repo.createAppointment(db, a.scope, { title: "Growth scan" });

    expect(await repo.listAppointments(db, b.scope)).toEqual([]);
  });
});

describe("reminders", () => {
  it("starts empty", async () => {
    const a = await seed("a@example.com", "A");

    expect(await repo.listReminders(db, a.scope)).toEqual([]);
  });

  it("creates one and lists it in time order", async () => {
    const a = await seed("a@example.com", "A");

    await repo.createReminder(db, a.scope, {
      title: "Later",
      remindAt: new Date("2026-09-01T09:00:00Z"),
      itemId: "a-one",
      channel: "push",
    });
    await repo.createReminder(db, a.scope, {
      title: "Sooner",
      remindAt: new Date("2026-07-01T09:00:00Z"),
    });

    const all = await repo.listReminders(db, a.scope);
    expect(all.map((x) => x.title)).toEqual(["Sooner", "Later"]);
    expect(all[1]!.channel).toBe("push");
    expect(all[1]!.item_id).toBe("a-one");
    expect(all[0]!.channel).toBe("email");
  });

  it("marks one sent, and reports whether it did", async () => {
    const a = await seed("a@example.com", "A");
    const created = await repo.createReminder(db, a.scope, {
      title: "Book the scan",
      remindAt: new Date("2026-07-01T09:00:00Z"),
    });
    const at = new Date("2026-07-01T09:00:05Z");

    expect(await repo.markReminderSent(db, a.scope, created.id, at)).toBe(true);
    expect(await repo.markReminderSent(db, a.scope, created.id, at)).toBe(true);

    const all = await repo.listReminders(db, a.scope);
    expect(all[0]!.sent_at?.toISOString()).toBe(at.toISOString());
  });

  it("defaults the sent time to now", async () => {
    const a = await seed("a@example.com", "A");
    const created = await repo.createReminder(db, a.scope, {
      title: "Book the scan",
      remindAt: new Date("2026-07-01T09:00:00Z"),
    });

    expect(await repo.markReminderSent(db, a.scope, created.id)).toBe(true);

    const all = await repo.listReminders(db, a.scope);
    expect(all[0]!.sent_at).toBeInstanceOf(Date);
  });

  it("cannot mark another person's reminder sent", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");
    const created = await repo.createReminder(db, a.scope, {
      title: "Book the scan",
      remindAt: new Date("2026-07-01T09:00:00Z"),
    });

    expect(await repo.markReminderSent(db, b.scope, created.id)).toBe(false);
  });
});

describe("subscriptions", () => {
  it("returns nothing before one exists", async () => {
    const a = await seed("a@example.com", "A");

    expect(await repo.getSubscription(db, a.scope)).toBeUndefined();
  });

  it("creates one, then updates it rather than adding a second", async () => {
    const a = await seed("a@example.com", "A");
    const end = new Date("2027-01-01T00:00:00Z");

    const created = await repo.upsertSubscription(db, a.scope, {
      plan: "plus",
      status: "active",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      currentPeriodEnd: end,
    });
    expect(created.plan).toBe("plus");
    expect(created.stripe_customer_id).toBe("cus_123");

    const updated = await repo.upsertSubscription(db, a.scope, {
      plan: "family",
      status: "active",
    });
    expect(updated.id).toBe(created.id);
    expect(updated.plan).toBe("family");
    expect(updated.stripe_customer_id).toBe("cus_123");
    expect(updated.current_period_end?.toISOString()).toBe(end.toISOString());

    const { rows } = await db.query<{ n: string }>(
      "select count(*)::text as n from subscriptions where household_id = $1",
      [a.householdId],
    );
    expect(rows[0]!.n).toBe("1");
  });

  it("creates one with no Stripe ids at all", async () => {
    const a = await seed("a@example.com", "A");

    const created = await repo.upsertSubscription(db, a.scope, { plan: "free", status: "active" });

    expect(created.stripe_customer_id).toBeNull();
    expect(created.stripe_subscription_id).toBeNull();
    expect(created.current_period_end).toBeNull();
  });

  it("keeps one household's subscription out of another's read", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");

    await repo.upsertSubscription(db, a.scope, { plan: "plus", status: "active" });

    expect(await repo.getSubscription(db, b.scope)).toBeUndefined();
  });
});

describe("row-level security", () => {
  /*
   * The point of this block: the queries above all carry a `where` clause, so
   * they would pass even with no policies at all. These tests drop the `where`
   * clause and connect as a non-superuser, which is the only way to prove the
   * policies are doing anything.
   *
   * PGlite connects as `postgres`, a superuser, and superusers bypass RLS even
   * with `force row level security`. So the test creates an ordinary role and
   * switches to it. Production must do the same or the policies are decorative.
   */
  async function asAppUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    await db.exec("begin");
    try {
      await db.query("select set_config('app.user_id', $1, true)", [userId]);
      await db.exec("set local role app_user");
      const result = await fn();
      await db.exec("commit");
      return result;
    } catch (error) {
      await db.exec("rollback");
      throw error;
    }
  }

  async function grantAppUser(): Promise<void> {
    await db.exec(`
      do $$
      begin
        if not exists (select 1 from pg_roles where rolname = 'app_user') then
          create role app_user nologin;
        end if;
      end
      $$;
      grant usage on schema public to app_user;
      grant select, insert, update, delete on all tables in schema public to app_user;
    `);
  }

  it("hides another household's pregnancy from an unscoped select", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");
    await repo.upsertPregnancy(db, a.scope, { dueDate: "2027-04-01" });
    await repo.upsertPregnancy(db, b.scope, { dueDate: "2027-05-01" });
    await grantAppUser();

    const seen = await asAppUser(a.userId, async () => {
      const { rows } = await db.query<{ household_id: string }>(
        "select household_id from pregnancies",
      );
      return rows;
    });

    expect(seen).toHaveLength(1);
    expect(seen[0]!.household_id).toBe(a.householdId);
  });

  it("hides another person's pins from an unscoped select", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");
    await repo.setItemState(db, a.scope, { itemId: "a-one", state: "done", pinned: true });
    await repo.setItemState(db, b.scope, { itemId: "b-two", state: "done", pinned: true });
    await grantAppUser();

    const seen = await asAppUser(a.userId, async () => {
      const { rows } = await db.query<{ item_id: string }>("select item_id from item_state");
      return rows;
    });

    expect(seen.map((r) => r.item_id)).toEqual(["a-one"]);
  });

  it("hides another household's appointments from an unscoped select", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");
    await repo.createAppointment(db, a.scope, { title: "Mine" });
    await repo.createAppointment(db, b.scope, { title: "Theirs" });
    await grantAppUser();

    const seen = await asAppUser(a.userId, async () => {
      const { rows } = await db.query<{ title: string }>("select title from appointments");
      return rows;
    });

    expect(seen.map((r) => r.title)).toEqual(["Mine"]);
  });

  it("refuses to write a row into someone else's household", async () => {
    const a = await seed("a@example.com", "A");
    const b = await seed("b@example.com", "B");
    await grantAppUser();

    await expect(
      asAppUser(a.userId, async () => {
        await db.query(
          "insert into pregnancies (household_id, due_date) values ($1, '2027-04-01')",
          [b.householdId],
        );
      }),
    ).rejects.toThrow(/row-level security/);
  });

  it("returns nothing at all when no user is set", async () => {
    const a = await seed("a@example.com", "A");
    await repo.upsertPregnancy(db, a.scope, { dueDate: "2027-04-01" });
    await grantAppUser();

    await db.exec("begin");
    await db.exec("set local role app_user");
    const { rows } = await db.query<{ id: string }>("select id from pregnancies");
    await db.exec("commit");

    expect(rows).toEqual([]);
  });

  it("still lets the app read the content tables, which are not personal", async () => {
    await db.query(
      `insert into stage_packs (id, kind, stage_index, title, payload)
       values ('pregnancy-w4', 'pregnancy', 4, 'Week 4', '{}'::jsonb)`,
    );
    const a = await seed("a@example.com", "A");
    await grantAppUser();

    const seen = await asAppUser(a.userId, async () => {
      const { rows } = await db.query<{ id: string }>("select id from stage_packs");
      return rows;
    });

    expect(seen.map((r) => r.id)).toEqual(["pregnancy-w4"]);
  });
});
