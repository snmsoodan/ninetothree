import { getTableColumns, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { migrateUp } from "./migrate";
import { TABLES } from "./schema";
import { createTestDb } from "./testing";

/**
 * `getSQLType()` is what Drizzle would write into a `create table`. The
 * database reports the same thing as a `udt_name`, which is a different
 * vocabulary for the same set of types. This is the translation, and it is
 * exhaustive on purpose: a column of a type nobody has mapped fails the test
 * rather than being skipped.
 */
const UDT: Record<string, string> = {
  uuid: "uuid",
  citext: "citext",
  text: "text",
  "char(2)": "bpchar",
  "timestamp with time zone": "timestamptz",
  date: "date",
  integer: "int4",
  boolean: "bool",
  jsonb: "jsonb",
  "text[]": "_text",
  bigserial: "int8",
};

interface ColumnRow {
  table_name: string;
  column_name: string;
  udt_name: string;
  is_nullable: "YES" | "NO";
  column_default: string | null;
}

/**
 * One Postgres for the whole file, emptied and re-migrated between tests.
 * See the note in `migrate.test.ts` for why the instance is not recreated.
 */
let db: Awaited<ReturnType<typeof createTestDb>>;

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.exec("drop schema public cascade; create schema public;");
  await migrateUp(db);
});

async function columns(): Promise<ColumnRow[]> {
  const { rows } = await db.query<ColumnRow>(
    `select table_name, column_name, udt_name, is_nullable, column_default
     from information_schema.columns
     where table_schema = 'public' and table_name <> '_migrations'
     order by table_name, ordinal_position`,
  );
  return rows;
}

describe("the schema on disk", () => {
  it("has every table the Drizzle schema declares, and no others", async () => {
    const { rows } = await db.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_schema = 'public' and table_name <> '_migrations'
       order by table_name`,
    );
    expect(rows.map((row) => row.table_name)).toEqual(
      TABLES.map((table) => getTableName(table)).sort(),
    );
  });

  it("matches the Drizzle schema column for column", async () => {
    const live = await columns();
    const byTable = new Map<string, ColumnRow[]>();
    for (const row of live) {
      byTable.set(row.table_name, [...(byTable.get(row.table_name) ?? []), row]);
    }

    for (const table of TABLES) {
      const name = getTableName(table);
      const declared = Object.values(getTableColumns(table));
      const actual = byTable.get(name) ?? [];

      expect(actual.map((row) => row.column_name).sort(), `${name} columns`).toEqual(
        declared.map((column) => column.name).sort(),
      );

      for (const column of declared) {
        const row = actual.find((candidate) => candidate.column_name === column.name);
        expect(row, `${name}.${column.name} exists`).toBeDefined();
        const sqlType = column.getSQLType();
        expect(UDT[sqlType], `${name}.${column.name} type ${sqlType} is mapped`).toBeDefined();
        expect(row?.udt_name, `${name}.${column.name} type`).toBe(UDT[sqlType]);
        expect(row?.is_nullable, `${name}.${column.name} nullability`).toBe(
          column.notNull ? "NO" : "YES",
        );
        expect(row?.column_default !== null, `${name}.${column.name} default`).toBe(
          column.hasDefault,
        );
      }
    }
  });

  it("declares the same check constraints the database enforces", async () => {
    const { rows } = await db.query<{ relname: string; conname: string }>(
      `select rel.relname, con.conname
       from pg_constraint con
       join pg_class rel on rel.oid = con.conrelid
       join pg_namespace ns on ns.oid = rel.relnamespace
       where ns.nspname = 'public' and con.contype = 'c'`,
    );
    for (const table of TABLES) {
      const name = getTableName(table);
      const declared = getTableConfig(table)
        .checks.map((check) => check.name)
        .sort();
      const actual = rows
        .filter((row) => row.relname === name)
        .map((row) => row.conname)
        .sort();
      expect(actual, `${name} checks`).toEqual(declared);
    }
  });

  it("declares the same foreign keys the database enforces", async () => {
    const { rows } = await db.query<{
      relname: string;
      column_name: string;
      ref_table: string;
    }>(
      `select rel.relname,
              (select attname from pg_attribute
               where attrelid = con.conrelid and attnum = con.conkey[1]) as column_name,
              (select relname from pg_class where oid = con.confrelid) as ref_table
       from pg_constraint con
       join pg_class rel on rel.oid = con.conrelid
       join pg_namespace ns on ns.oid = rel.relnamespace
       where ns.nspname = 'public' and con.contype = 'f'`,
    );
    for (const table of TABLES) {
      const name = getTableName(table);
      const declared = getTableConfig(table)
        .foreignKeys.map((fk) => {
          const reference = fk.reference();
          return `${reference.columns[0]?.name}->${getTableName(reference.foreignTable)}`;
        })
        .sort();
      const actual = rows
        .filter((row) => row.relname === name)
        .map((row) => `${row.column_name}->${row.ref_table}`)
        .sort();
      expect(actual, `${name} foreign keys`).toEqual(declared);
    }
  });

  it("declares the same indexes the database has", async () => {
    // Indexes that back a primary key or a unique constraint are declared by
    // `.primaryKey()` and `.unique()`, not by `.indexes()`, so they are not
    // part of this comparison.
    const { rows } = await db.query<{ tablename: string; indexname: string }>(
      `select t.relname as tablename, i.relname as indexname
       from pg_index x
       join pg_class i on i.oid = x.indexrelid
       join pg_class t on t.oid = x.indrelid
       join pg_namespace ns on ns.oid = t.relnamespace
       where ns.nspname = 'public'
         and not exists (select 1 from pg_constraint c where c.conindid = x.indexrelid)`,
    );
    for (const table of TABLES) {
      const name = getTableName(table);
      const declared = getTableConfig(table)
        .indexes.map((index) => index.config.name)
        .sort();
      const actual = rows
        .filter((row) => row.tablename === name)
        .map((row) => row.indexname)
        .sort();
      expect(actual, `${name} indexes`).toEqual(declared);
    }
  });

  it("has the indexes the issue asks for", async () => {
    const { rows } = await db.query<{ indexname: string; indexdef: string }>(
      "select indexname, indexdef from pg_indexes where schemaname = 'public'",
    );
    const def = (name: string) => rows.find((row) => row.indexname === name)?.indexdef ?? "";

    expect(def("item_state_user_pack_idx")).toContain("(user_id, stage_pack_id)");
    expect(def("pregnancies_household_idx")).toContain("(household_id)");
    expect(def("children_household_idx")).toContain("(household_id)");
    expect(def("appointments_household_idx")).toContain("(household_id)");
    // A household has one subscription, so this is a unique constraint rather
    // than a plain index — the webhook upserts on it.
    expect(def("subscriptions_household_key")).toContain("UNIQUE");
    expect(def("subscriptions_household_key")).toContain("(household_id)");
    expect(def("reminders_remind_at_idx")).toContain("(remind_at)");
    expect(def("reminders_remind_at_idx")).toContain("WHERE (sent_at IS NULL)");
    expect(def("item_state_pinned_idx")).toContain("WHERE pinned");
    expect(def("link_catalogue_domains_idx")).toContain("USING gin");
    expect(def("link_catalogue_title_trgm_idx")).toContain("gin_trgm_ops");
  });
});

describe("the constraints that encode product rules", () => {
  async function insertPack(kind: string) {
    await db.query(
      `insert into stage_packs (id, kind, stage_index, title, payload)
       values ($1, $2, 0, 'Week 4', '{}'::jsonb)`,
      [`pack-${kind}`, kind],
    );
  }

  it("accepts every stage kind the content package ships", async () => {
    for (const kind of ["pregnancy", "postpartum", "infant", "toddler", "event"]) {
      await expect(insertPack(kind)).resolves.toBeUndefined();
    }
  });

  it("rejects a stage kind the content package does not ship", async () => {
    await expect(insertPack("newborn")).rejects.toThrow(/stage_packs_kind_check/);
  });

  it("accepts every skip reason the interface offers", async () => {
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ('a@b.com') returning id",
    );
    const userId = rows[0]?.id;
    for (const reason of ["not-now", "already-done", "not-for-me"]) {
      await expect(
        db.query(
          `insert into item_state (user_id, item_id, state, skip_reason)
           values ($1, $2, 'skipped', $3)`,
          [userId, `item-${reason}`, reason],
        ),
      ).resolves.toBeDefined();
    }
  });

  it("rejects a skip reason the interface does not offer", async () => {
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ('a@b.com') returning id",
    );
    await expect(
      db.query(
        `insert into item_state (user_id, item_id, state, skip_reason)
         values ($1, 'item', 'skipped', 'too-expensive')`,
        [rows[0]?.id],
      ),
    ).rejects.toThrow(/item_state_skip_reason_check/);
  });

  it("rejects a skip reason on an item that was not skipped", async () => {
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ('a@b.com') returning id",
    );
    await expect(
      db.query(
        `insert into item_state (user_id, item_id, state, skip_reason)
         values ($1, 'item', 'done', 'not-now')`,
        [rows[0]?.id],
      ),
    ).rejects.toThrow(/item_state_skip_reason_needs_skip/);
  });

  it("rejects a snooze with no return date", async () => {
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ('a@b.com') returning id",
    );
    await expect(
      db.query(
        `insert into item_state (user_id, item_id, state)
         values ($1, 'item', 'snoozed')`,
        [rows[0]?.id],
      ),
    ).rejects.toThrow(/item_state_snooze_needs_date/);
  });

  it("rejects a pin with no time, because the shelf is ordered by it", async () => {
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ('a@b.com') returning id",
    );
    await expect(
      db.query(`insert into item_state (user_id, item_id, pinned) values ($1, 'item', true)`, [
        rows[0]?.id,
      ]),
    ).rejects.toThrow(/item_state_pin_needs_time/);
  });

  it("only lets a commercial link earn money", async () => {
    const insert = (type: string, affiliate: boolean) =>
      db.query(
        `insert into link_catalogue (id, title, url, type, domains, last_checked, affiliate)
         values ($1, 'A place', 'https://example.com', $2, '{feeding}', '2026-01-01', $3)`,
        [`link-${type}-${affiliate}`, type, affiliate],
      );
    await expect(insert("commercial", true)).resolves.toBeDefined();
    await expect(insert("charity", true)).rejects.toThrow(/link_catalogue_affiliate_is_commercial/);
    await expect(insert("charity", false)).resolves.toBeDefined();
  });
});

describe("the types that are easy to get wrong", () => {
  it("treats an email as case-insensitive", async () => {
    await db.query("insert into users (email) values ('A@B.com')");
    const { rows } = await db.query<{ email: string }>(
      "select email from users where email = 'a@b.COM'",
    );
    expect(rows).toHaveLength(1);
  });

  it("generates a uuid without pgcrypto", async () => {
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ('a@b.com') returning id",
    );
    expect(rows[0]?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it("numbers content events without the caller supplying an id", async () => {
    await db.query("insert into content_events (event) values ('view')");
    await db.query("insert into content_events (event) values ('view')");
    const { rows } = await db.query<{ id: string }>("select id from content_events order by id");
    expect(rows.map((row) => String(row.id))).toEqual(["1", "2"]);
  });

  it("has pg_trgm, so the catalogue can be searched by a misspelling", async () => {
    const { rows } = await db.query<{ score: number }>(
      "select similarity('hello', 'helo') as score",
    );
    expect(rows[0]?.score).toBeGreaterThan(0.5);
  });

  it("keeps a pin when the pack it came from is deleted", async () => {
    const { rows } = await db.query<{ id: string }>(
      "insert into users (email) values ('a@b.com') returning id",
    );
    await db.query(
      `insert into stage_packs (id, kind, stage_index, title, payload)
       values ('pregnancy-w4', 'pregnancy', 0, 'Week 4', '{}'::jsonb)`,
    );
    await db.query(
      `insert into item_state (user_id, item_id, stage_pack_id, pinned, pinned_at, title)
       values ($1, 'item', 'pregnancy-w4', true, now(), 'Book the first scan')`,
      [rows[0]?.id],
    );
    await db.query("delete from stage_packs where id = 'pregnancy-w4'");
    const { rows: kept } = await db.query<{ stage_pack_id: string | null; title: string }>(
      "select stage_pack_id, title from item_state",
    );
    expect(kept).toEqual([{ stage_pack_id: null, title: "Book the first scan" }]);
  });
});
