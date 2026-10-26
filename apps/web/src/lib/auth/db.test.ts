// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { getDb, resetDbForTests } from "./db";

afterEach(() => {
  resetDbForTests();
});

describe("getDb", () => {
  it("gives a database with the migrations already applied", async () => {
    const { sql } = await getDb();

    const { rows } = await sql.query<{ name: string }>(
      "select name from _migrations order by name",
    );
    expect(rows.map((r) => r.name)).toEqual([
      "0001_init",
      "0002_rls",
      "0003_auth",
      "0004_household",
    ]);
  });

  it("gives the same handle twice, so a request does not open a second database", async () => {
    const first = await getDb();
    const second = await getDb();

    expect(second).toBe(first);
  });

  it("gives a new handle after a reset", async () => {
    const first = await getDb();
    resetDbForTests();
    const second = await getDb();

    expect(second).not.toBe(first);
  });
});
