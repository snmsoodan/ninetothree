import { PGlite, type Extensions } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * One type for both drivers.
 *
 * `PgliteDatabase` and `NodePgDatabase` are the same `PgDatabase` with a
 * different result HKT, and the HKT is invariant — so a union of the two is
 * assignable to neither, and `DrizzleAdapter`'s generic then falls through to
 * its SQLite branch. Naming the common supertype here is what keeps the
 * adapter on the Postgres path.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

export interface DbHandle {
  db: Database;
  /** The raw SQL surface the migration runner and the auth policy use. */
  sql: {
    exec(statement: string): Promise<unknown>;
    query<T>(statement: string, params?: unknown[]): Promise<{ rows: T[] }>;
  };
  close(): Promise<void>;
}

/**
 * A database, from a URL.
 *
 * `pglite://` (or no URL at all) means an in-process Postgres compiled to WASM.
 * That is what makes `pnpm dev` and the end-to-end suite work with no server to
 * install, and it is why the same migrations run in both places. It is not a
 * production option: one process, one writer, no network.
 */
/**
 * PGlite's contrib modules find their `.tar.gz` next to themselves, so a
 * bundled copy has no neighbour to find and fails with "Extension bundle not
 * found". `webpackIgnore` keeps them out of the Next server bundle; Node
 * resolves them from `node_modules` at runtime, and vitest ignores the comment.
 */
async function contribExtensions(): Promise<Extensions> {
  const [citextModule, pgTrgmModule] = await Promise.all([
    import(/* webpackIgnore: true */ "@electric-sql/pglite/contrib/citext"),
    import(/* webpackIgnore: true */ "@electric-sql/pglite/contrib/pg_trgm"),
  ]);
  return { citext: citextModule.citext, pg_trgm: pgTrgmModule.pg_trgm };
}

export async function createDb(url: string | undefined): Promise<DbHandle> {
  if (!url || url.startsWith("pglite:")) {
    const pglite = new PGlite({ extensions: await contribExtensions() });
    return {
      db: drizzlePglite(pglite, { schema }),
      sql: {
        exec: (statement) => pglite.exec(statement),
        query: ((statement: string, params?: unknown[]) =>
          pglite.query(statement, params)) as DbHandle["sql"]["query"],
      },
      close: () => pglite.close(),
    };
  }

  const pool = new Pool({ connectionString: url });
  return {
    db: drizzlePg(pool, { schema }),
    sql: {
      exec: (statement) => pool.query(statement),
      query: ((statement: string, params?: unknown[]) =>
        pool.query(statement, params)) as DbHandle["sql"]["query"],
    },
    close: () => pool.end(),
  };
}
