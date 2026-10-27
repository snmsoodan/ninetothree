import { PACKS } from "@ninetothree/content/registry";
import { createDb, migrateUp, syncPacks, type DbHandle } from "@ninetothree/db";

let handle: Promise<DbHandle> | undefined;

/**
 * One database per server process.
 *
 * The migrations run on first use. They are idempotent — the ledger decides
 * what is pending — so this is a cheap `select` on a warm database and the
 * thing that makes `pnpm dev` work with no setup at all when `DATABASE_URL`
 * is unset and the database is the in-process one.
 *
 * The packs are synced for the same reason. `shared_items`, `item_state` and
 * `stage_progress` all carry a foreign key to `stage_packs`, so a pack that is
 * not in the table cannot be referenced — and the app is the only thing that
 * knows what the packs are.
 */
export function getDb(): Promise<DbHandle> {
  handle ??= (async () => {
    const created = await createDb(process.env.DATABASE_URL);
    await migrateUp(created.sql);
    await syncPacks(created.sql, PACKS);
    return created;
  })();
  return handle;
}

/** Test seam: forget the cached handle so the next call builds a new one. */
export function resetDbForTests(): void {
  handle = undefined;
}
