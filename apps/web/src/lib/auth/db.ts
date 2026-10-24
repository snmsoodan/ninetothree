import { createDb, migrateUp, type DbHandle } from "@ninetothree/db";

let handle: Promise<DbHandle> | undefined;

/**
 * One database per server process.
 *
 * The migrations run on first use. They are idempotent — the ledger decides
 * what is pending — so this is a cheap `select` on a warm database and the
 * thing that makes `pnpm dev` work with no setup at all when `DATABASE_URL`
 * is unset and the database is the in-process one.
 */
export function getDb(): Promise<DbHandle> {
  handle ??= (async () => {
    const created = await createDb(process.env.DATABASE_URL);
    await migrateUp(created.sql);
    return created;
  })();
  return handle;
}

/** Test seam: forget the cached handle so the next call builds a new one. */
export function resetDbForTests(): void {
  handle = undefined;
}
