import { MIGRATIONS } from "./migrations.generated";

export { MIGRATIONS };

/**
 * The smallest surface a migration needs. PGlite and `pg` both satisfy it, so
 * the runner is tested against a real Postgres without a container.
 */
export interface SqlClient {
  exec(sql: string): Promise<unknown>;
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export interface Migration {
  /** `0001_init` — the file stem, which is also the sort key. */
  name: string;
  up: string;
  down: string;
}

async function applied(client: SqlClient): Promise<string[]> {
  await client.exec(LEDGER);
  const { rows } = await client.query<{ name: string }>(
    "select name from _migrations order by name",
  );
  return rows.map((row) => row.name);
}

const LEDGER = `
  create table if not exists _migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`;

/**
 * Applies every migration that has not been applied, in name order.
 *
 * Each one runs inside its own transaction together with the ledger insert, so
 * a failure leaves the database exactly as it was rather than half-migrated.
 */
export async function migrateUp(
  client: SqlClient,
  migrations: Migration[] = MIGRATIONS,
): Promise<string[]> {
  const done = new Set(await applied(client));
  const ran: string[] = [];
  for (const migration of migrations) {
    if (done.has(migration.name)) continue;
    await client.exec("begin");
    try {
      await client.exec(migration.up);
      await client.query("insert into _migrations (name) values ($1)", [migration.name]);
      await client.exec("commit");
    } catch (error) {
      await client.exec("rollback");
      throw error;
    }
    ran.push(migration.name);
  }
  return ran;
}

/**
 * Rolls back the last `steps` applied migrations, newest first.
 *
 * It refuses to roll back more than has been applied rather than silently
 * doing nothing, because a rollback that quietly did less than asked is how a
 * deploy script ends up believing it reverted something it did not.
 */
export async function migrateDown(
  client: SqlClient,
  migrations: Migration[] = MIGRATIONS,
  steps = 1,
): Promise<string[]> {
  const done = await applied(client);
  if (steps > done.length) {
    throw new Error(`cannot roll back ${steps}: only ${done.length} applied`);
  }
  const byName = new Map(migrations.map((m) => [m.name, m]));
  const target = done.slice(-steps).reverse();
  const rolled: string[] = [];
  for (const name of target) {
    const migration = byName.get(name);
    if (!migration) {
      throw new Error(`${name} is applied but has no file`);
    }
    await client.exec("begin");
    try {
      await client.exec(migration.down);
      await client.query("delete from _migrations where name = $1", [name]);
      await client.exec("commit");
    } catch (error) {
      await client.exec("rollback");
      throw error;
    }
    rolled.push(name);
  }
  return rolled;
}

export async function migrationStatus(
  client: SqlClient,
  migrations: Migration[] = MIGRATIONS,
): Promise<{ applied: string[]; pending: string[] }> {
  const done = await applied(client);
  const doneSet = new Set(done);
  return {
    applied: done,
    pending: migrations.map((migration) => migration.name).filter((name) => !doneSet.has(name)),
  };
}
