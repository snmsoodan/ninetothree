import { PACKS } from "@ninetothree/content";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrateUp } from "./migrate";
import { listAppointments, listItemState, listPinned, listProgress, getPregnancy } from "./repo";
import { scopeFor } from "./scope";
import { assertSafeToSeed, SEED, seed } from "./seed";
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
  // A failed `beforeAll` leaves `db` undefined; closing it would replace the
  // real error with a confusing one.
  await db?.close();
});

async function count(table: string): Promise<number> {
  const { rows } = await db.query<{ n: string }>(`select count(*)::text as n from ${table}`);
  return Number(rows[0]!.n);
}

describe("seed", () => {
  it("writes the fixtures the issue asks for", async () => {
    const report = await seed(db);

    expect(report.households).toBe(3);
    expect(report.pregnancies).toBe(2);
    expect(report.children).toBe(2);
    expect(report.itemStates).toBe(40);

    expect(await count("households")).toBe(3);
    expect(await count("pregnancies")).toBe(2);
    expect(await count("children")).toBe(2);
    expect(await count("item_state")).toBe(40);
  });

  it("writes every shipped stage pack", async () => {
    const report = await seed(db);

    expect(report.packs).toBe(PACKS.length);
    expect(await count("stage_packs")).toBe(PACKS.length);
  });

  it("stores the pack payload so the row is self-contained", async () => {
    await seed(db);

    const { rows } = await db.query<{ payload: { id: string; coreActions: unknown[] } }>(
      "select payload from stage_packs where id = 'pregnancy-w28'",
    );

    expect(rows[0]!.payload.id).toBe("pregnancy-w28");
    expect(rows[0]!.payload.coreActions.length).toBeGreaterThan(0);
  });

  it("is idempotent — running it twice leaves the same rows", async () => {
    await seed(db);
    const first = {
      households: await count("households"),
      users: await count("users"),
      items: await count("item_state"),
      progress: await count("stage_progress"),
      packs: await count("stage_packs"),
    };

    await seed(db);

    expect({
      households: await count("households"),
      users: await count("users"),
      items: await count("item_state"),
      progress: await count("stage_progress"),
      packs: await count("stage_packs"),
    }).toEqual(first);
  });

  it("accepts a pack with no subtitle, baby or you section", async () => {
    const minimal = {
      id: "pregnancy-w99",
      kind: "pregnancy" as const,
      stageIndex: 99,
      stageUnit: "week" as const,
      locale: "en-US",
      country: "US",
      title: "Week 99",
      coreActions: [
        {
          id: "a-one",
          type: "do" as const,
          title: "Do a thing",
          why: "Because.",
          priority: "recommended" as const,
          domain: "health-parent" as const,
          options: [],
        },
      ],
      alsoKnow: [],
      redFlags: [{ id: "r-one", text: "Something is wrong", escalation: "call-911" as const }],
      appointments: [],
      sources: [
        {
          id: "s-one",
          title: "A source",
          publisher: "ACOG",
          url: "https://example.com",
          kind: "clinical" as const,
          accessed: "2026-01-01",
        },
      ],
      reviewedBy: "Clinical review pending",
      reviewedAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };

    const report = await seed(db, { packList: [...PACKS, minimal] });

    expect(report.packs).toBe(PACKS.length + 1);
    const { rows } = await db.query<{
      subtitle: string | null;
      baby: string | null;
      you: string | null;
    }>("select subtitle, baby, you from stage_packs where id = 'pregnancy-w99'");
    expect(rows[0]).toEqual({ subtitle: null, baby: null, you: null });
  });

  it("can skip the packs when they are already there", async () => {
    await seed(db);

    const report = await seed(db, { packs: false });

    expect(report.packs).toBe(0);
    expect(await count("stage_packs")).toBe(PACKS.length);
  });

  it("gives a usable app: the repository reads it back", async () => {
    await seed(db);

    const maya = await scopeFor(db, SEED.users.maya);
    const pregnancy = await getPregnancy(db, maya);
    expect(pregnancy?.due_date.toISOString().slice(0, 10)).toBe("2026-12-21");

    const items = await listItemState(db, maya);
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((row) => row.state === "done")).toBe(true);
    expect(items.some((row) => row.state === "skipped")).toBe(true);

    const pinned = await listPinned(db, maya);
    expect(pinned.length).toBe(2);
    expect(pinned.every((row) => row.pinned_at !== null)).toBe(true);

    const progress = await listProgress(db, maya);
    expect(progress.some((row) => row.state === "complete")).toBe(true);
    expect(progress.some((row) => row.forced)).toBe(true);

    const appointments = await listAppointments(db, maya);
    expect(appointments.length).toBe(3);
  });

  it("gives each household its own data and nobody else's", async () => {
    await seed(db);

    const maya = await scopeFor(db, SEED.users.maya);
    const ingrid = await scopeFor(db, SEED.users.ingrid);

    expect(await getPregnancy(db, maya)).toBeDefined();
    expect(await getPregnancy(db, ingrid)).toBeUndefined();

    const mayaItems = await listItemState(db, maya);
    const ingridItems = await listItemState(db, ingrid);
    expect(mayaItems.length).toBeGreaterThan(0);
    expect(ingridItems.length).toBeGreaterThan(0);
    expect(mayaItems.map((r) => r.item_id)).not.toContain("infant-month-4-safe-sleep");
  });

  it("puts a partner in the same household as the parent", async () => {
    await seed(db);

    const maya = await scopeFor(db, SEED.users.maya);
    const dev = await scopeFor(db, SEED.users.dev);

    expect(dev.householdId).toBe(maya.householdId);
    expect(dev.role).toBe("partner");
    expect(maya.role).toBe("parent");
  });

  it("rolls back everything if a row is bad", async () => {
    // A due date that is not a date fails at the second pregnancy, after the
    // first has been written. Nothing should survive.
    await db.query(
      "alter table pregnancies add constraint seed_probe check (due_date > '2027-01-01')",
    );

    await expect(seed(db)).rejects.toThrow();

    expect(await count("households")).toBe(0);
    expect(await count("users")).toBe(0);
  });
});

describe("assertSafeToSeed", () => {
  it("allows localhost, 127.0.0.1 and ::1", () => {
    expect(() => assertSafeToSeed("postgres://u:p@localhost:5432/ntt")).not.toThrow();
    expect(() => assertSafeToSeed("postgres://u:p@127.0.0.1:5432/ntt")).not.toThrow();
    expect(() => assertSafeToSeed("postgres://u:p@[::1]:5432/ntt")).not.toThrow();
  });

  it("refuses a remote host", () => {
    expect(() => assertSafeToSeed("postgres://u:p@db.example.com:5432/ntt")).toThrow(
      /refusing to seed db\.example\.com/,
    );
  });

  it("allows a remote host when forced", () => {
    expect(() => assertSafeToSeed("postgres://u:p@db.example.com:5432/ntt", true)).not.toThrow();
  });

  it("rejects something that is not a URL", () => {
    expect(() => assertSafeToSeed("not a url")).toThrow(/not a URL/);
  });
});
