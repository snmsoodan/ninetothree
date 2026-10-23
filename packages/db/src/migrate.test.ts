import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  loadMigrations,
  migrateDown,
  migrateUp,
  migrationStatus,
  type Migration,
  type SqlClient,
} from "./migrate";
import { createTestDb } from "./testing";

const TABLES = [
  "appointments",
  "children",
  "content_events",
  "content_sources",
  "feature_flags",
  "household_members",
  "households",
  "item_state",
  "link_catalogue",
  "pregnancies",
  "reminders",
  "stage_packs",
  "stage_progress",
  "subscriptions",
  "users",
];

/**
 * One Postgres for the whole file, emptied between tests.
 *
 * Creating a PGlite instance costs about 750 ms; dropping and recreating the
 * `public` schema costs about 15 ms. Thirty-three tests at 750 ms each is a
 * suite that times out the moment anything else on the machine is busy, so the
 * instance is created once and the schema is reset instead.
 */
let db: SqlClient & { close(): Promise<void> };

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.exec("drop schema public cascade; create schema public;");
});

function fresh() {
  return db;
}

async function tableNames(db: SqlClient): Promise<string[]> {
  const { rows } = await db.query<{ table_name: string }>(
    `select table_name from information_schema.tables
     where table_schema = 'public' order by table_name`,
  );
  return rows.map((row) => row.table_name);
}

describe("loadMigrations", () => {
  it("pairs every up file with its down file", () => {
    const migrations = loadMigrations();
    expect(migrations.map((m) => m.name)).toEqual(["0001_init"]);
    expect(migrations[0]?.up).toContain("create table users");
    expect(migrations[0]?.down).toContain("drop table if exists users");
  });

  it("refuses a migration with no down file", () => {
    const dir = mkdtempSync(join(tmpdir(), "ntt-migrations-"));
    try {
      writeFileSync(join(dir, "0001_orphan.up.sql"), "select 1;");
      expect(() => loadMigrations(dir)).toThrow("0001_orphan has no .down.sql");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("sorts by name, not by directory order", () => {
    const dir = mkdtempSync(join(tmpdir(), "ntt-migrations-"));
    try {
      for (const name of ["0002_second", "0001_first"]) {
        writeFileSync(join(dir, `${name}.up.sql`), "select 1;");
        writeFileSync(join(dir, `${name}.down.sql`), "select 1;");
      }
      expect(loadMigrations(dir).map((m) => m.name)).toEqual(["0001_first", "0002_second"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("migrateUp", () => {
  it("creates every table on a fresh database", async () => {
    const db = await fresh();
    expect(await migrateUp(db)).toEqual(["0001_init"]);
    expect(await tableNames(db)).toEqual(["_migrations", ...TABLES]);
  });

  it("is idempotent", async () => {
    const db = await fresh();
    await migrateUp(db);
    expect(await migrateUp(db)).toEqual([]);
    expect(await tableNames(db)).toEqual(["_migrations", ...TABLES]);
  });

  it("rolls back a migration that fails halfway", async () => {
    const db = await fresh();
    const broken: Migration[] = [
      {
        name: "0001_broken",
        up: "create table half (id int); create table oops (",
        down: "drop table if exists half;",
      },
    ];
    await expect(migrateUp(db, broken)).rejects.toThrow();
    expect(await tableNames(db)).toEqual(["_migrations"]);
    expect(await migrationStatus(db, broken)).toEqual({
      applied: [],
      pending: ["0001_broken"],
    });
  });
});

describe("migrateDown", () => {
  it("drops every table and leaves the ledger", async () => {
    const db = await fresh();
    await migrateUp(db);
    expect(await migrateDown(db)).toEqual(["0001_init"]);
    expect(await tableNames(db)).toEqual(["_migrations"]);
  });

  it("keeps the extensions, because other schemas may use them", async () => {
    const db = await fresh();
    await migrateUp(db);
    await migrateDown(db);
    const { rows } = await db.query<{ extname: string }>(
      "select extname from pg_extension order by extname",
    );
    expect(rows.map((row) => row.extname)).toEqual(expect.arrayContaining(["citext", "pg_trgm"]));
  });

  it("round-trips twice", async () => {
    const db = await fresh();
    for (let pass = 0; pass < 2; pass += 1) {
      await migrateUp(db);
      expect(await tableNames(db)).toEqual(["_migrations", ...TABLES]);
      await migrateDown(db);
      expect(await tableNames(db)).toEqual(["_migrations"]);
    }
  });

  it("rolls back the newest first", async () => {
    const db = await fresh();
    const two: Migration[] = [
      { name: "0001_a", up: "create table a (id int);", down: "drop table a;" },
      { name: "0002_b", up: "create table b (id int);", down: "drop table b;" },
    ];
    await migrateUp(db, two);
    expect(await migrateDown(db, two, 2)).toEqual(["0002_b", "0001_a"]);
    expect(await tableNames(db)).toEqual(["_migrations"]);
  });

  it("refuses to roll back more than was applied", async () => {
    const db = await fresh();
    await migrateUp(db);
    await expect(migrateDown(db, undefined, 2)).rejects.toThrow(
      "cannot roll back 2: only 1 applied",
    );
  });

  it("refuses to roll back a migration whose file is gone", async () => {
    const db = await fresh();
    const gone: Migration[] = [
      { name: "0001_gone", up: "create table gone (id int);", down: "drop table gone;" },
    ];
    await migrateUp(db, gone);
    await expect(migrateDown(db, [], 1)).rejects.toThrow("0001_gone is applied but has no file");
  });

  it("rolls back a down that fails, leaving the table in place", async () => {
    const db = await fresh();
    const badDown: Migration[] = [
      { name: "0001_x", up: "create table x (id int);", down: "drop table nope;" },
    ];
    await migrateUp(db, badDown);
    await expect(migrateDown(db, badDown)).rejects.toThrow();
    expect(await tableNames(db)).toEqual(["_migrations", "x"]);
    expect(await migrationStatus(db, badDown)).toEqual({
      applied: ["0001_x"],
      pending: [],
    });
  });
});

describe("migrationStatus", () => {
  it("reports pending before and applied after", async () => {
    const db = await fresh();
    expect(await migrationStatus(db)).toEqual({
      applied: [],
      pending: ["0001_init"],
    });
    await migrateUp(db);
    expect(await migrationStatus(db)).toEqual({
      applied: ["0001_init"],
      pending: [],
    });
  });
});
