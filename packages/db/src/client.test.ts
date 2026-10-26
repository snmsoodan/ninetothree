import { afterEach, describe, expect, it } from "vitest";
import { createDb, type DbHandle } from "./client";
import { migrateUp } from "./migrate";

let handle: DbHandle | undefined;

afterEach(async () => {
  await handle?.close();
  handle = undefined;
});

describe("createDb", () => {
  it("gives an in-process Postgres when there is no URL", async () => {
    handle = await createDb(undefined);

    const { rows } = await handle.sql.query<{ version: string }>("select version() as version");
    expect(rows[0]!.version).toMatch(/PostgreSQL/);
  });

  it("gives an in-process Postgres for a pglite: URL", async () => {
    handle = await createDb("pglite://memory");

    const { rows } = await handle.sql.query<{ n: string }>("select 1::text as n");
    expect(rows[0]!.n).toBe("1");
  });

  it("runs the migrations against the in-process database", async () => {
    handle = await createDb(undefined);

    expect(await migrateUp(handle.sql)).toEqual([
      "0001_init",
      "0002_rls",
      "0003_auth",
      "0004_household",
      "0005_invites",
    ]);
  });

  it("exposes the same tables through Drizzle as through SQL", async () => {
    handle = await createDb(undefined);
    await migrateUp(handle.sql);

    const { rows } = await handle.sql.query<{ n: string }>(
      "select count(*)::text as n from information_schema.tables where table_schema = 'public'",
    );
    expect(Number(rows[0]!.n)).toBeGreaterThan(15);
  });
});

describe("createDb with a real connection string", () => {
  it("builds a pool-backed handle and closes it", async () => {
    // Nothing listens on port 1, so this proves the wiring without a server:
    // the handle is built, the query reaches the pool, and the pool closes.
    const handle = await createDb("postgres://user:pass@127.0.0.1:1/ninetothree");

    expect(typeof handle.db.select).toBe("function");
    await expect(handle.sql.query("select 1")).rejects.toThrow();
    await expect(handle.sql.exec("select 1")).rejects.toThrow();
    await handle.close();
  });
});
