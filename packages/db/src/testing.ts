import { PGlite } from "@electric-sql/pglite";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

import type { SqlClient } from "./migrate";

/**
 * A real Postgres, in this process, with no container.
 *
 * PGlite is Postgres compiled to WebAssembly. It is not an emulation, so the
 * migration is tested against the same parser, the same constraint checks and
 * the same `information_schema` that production uses. The version differs —
 * PGlite ships 18, Neon runs 16 — which is why the schema sticks to features
 * that have been stable since 13.
 */
export async function createTestDb(): Promise<SqlClient & { close(): Promise<void> }> {
  const db = new PGlite({ extensions: { citext, pg_trgm } });
  await db.waitReady;
  return {
    exec: (sql: string) => db.exec(sql),
    query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) =>
      db.query<T>(sql, params),
    close: () => db.close(),
  };
}
