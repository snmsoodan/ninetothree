import type { SqlClient } from "./migrate";

export type HouseholdRole = "parent" | "partner" | "grandparent" | "carer";

declare const scopeBrand: unique symbol;

/**
 * Who a query is for.
 *
 * The brand is the point. `Scope` cannot be constructed with an object
 * literal, so a caller cannot invent a household id and pass it to a
 * repository function — the only way to get one is `scopeFor`, which reads
 * the membership out of the database. That is what makes a cross-household
 * read impossible by construction rather than by discipline.
 */
export interface Scope {
  readonly [scopeBrand]: true;
  readonly userId: string;
  readonly householdId: string;
  readonly role: HouseholdRole;
}

export class NoHouseholdError extends Error {
  constructor(userId: string) {
    super(`user ${userId} is not a member of any household`);
    this.name = "NoHouseholdError";
  }
}

/**
 * Runs `fn` with `app.user_id` set for the duration of one transaction.
 *
 * `set_config(..., true)` is transaction-local, so the setting cannot leak to
 * the next request that borrows the same connection from the pool. The
 * rollback on error is not decoration: without it a failed statement leaves
 * the connection inside an aborted transaction and every later query on it
 * fails with "current transaction is aborted".
 */
export async function asUser<T>(db: SqlClient, userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec("begin");
  try {
    await db.query("select set_config('app.user_id', $1, true)", [userId]);
    const result = await fn();
    await db.exec("commit");
    return result;
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}

/**
 * Resolves the scope for a signed-in user.
 *
 * A person can belong to more than one household in principle; the schema
 * allows it. This picks the oldest, which is the one they created, and is
 * deterministic rather than "whichever row came back first".
 */
export async function scopeFor(db: SqlClient, userId: string): Promise<Scope> {
  return asUser(db, userId, async () => {
    const { rows } = await db.query<{ household_id: string; role: HouseholdRole }>(
      `select m.household_id, m.role
         from household_members m
         join households h on h.id = m.household_id
        where m.user_id = $1
        order by h.created_at, m.household_id
        limit 1`,
      [userId],
    );
    const row = rows[0];
    if (!row) throw new NoHouseholdError(userId);
    return {
      userId,
      householdId: row.household_id,
      role: row.role,
    } as Scope;
  });
}
