import type { SqlClient } from "./migrate";
import { asUser, type Scope } from "./scope";

/*
 * Exporting and deleting an account.
 *
 * Two rules shape this file.
 *
 *   1. An export is only worth having if it is complete. So it reads every
 *      table that holds something a person put there, and it reads them
 *      through the same policies as the rest of the app — an export that
 *      could see more than the app can would be a bug, not a feature.
 *   2. Deleting is a request, not an event. Thirty days, cancellable by
 *      signing in again, and then a job removes the row and everything that
 *      cascades from it.
 */

/** How long a deletion can be undone. */
export const DELETION_GRACE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AccountExport {
  exportedAt: string;
  user: Record<string, unknown> | null;
  household: Record<string, unknown> | null;
  members: Record<string, unknown>[];
  pregnancy: Record<string, unknown> | null;
  child: Record<string, unknown> | null;
  progress: Record<string, unknown>[];
  items: Record<string, unknown>[];
  appointments: Record<string, unknown>[];
  reminders: Record<string, unknown>[];
  subscription: Record<string, unknown> | null;
  sharedItems: Record<string, unknown>[];
  jobs: Record<string, unknown>[];
  invites: Record<string, unknown>[];
  deletion: DeletionStatus | null;
}

/**
 * Everything the server holds about one person and their household.
 *
 * `item_state` is read for the caller only, not for the household: it is
 * self-only by policy, and an export that quietly widened that would be the
 * one place a partner's notes could leak.
 */
export async function exportAccount(
  db: SqlClient,
  scope: Scope,
  options: { now?: Date } = {},
): Promise<AccountExport> {
  const now = options.now ?? new Date();

  return asUser(db, scope.userId, async () => {
    const one = async (sql: string, params: unknown[] = []) => {
      const { rows } = await db.query<Record<string, unknown>>(sql, params);
      return rows[0] ?? null;
    };
    const many = async (sql: string, params: unknown[] = []) => {
      const { rows } = await db.query<Record<string, unknown>>(sql, params);
      return rows;
    };

    const user = await one("select * from users where id = $1", [scope.userId]);
    const household = await one("select * from households where id = $1", [scope.householdId]);
    const members = await many(
      `select m.user_id, m.role, u.email, u.name
         from household_members m
         join users u on u.id = m.user_id
        where m.household_id = $1
        order by m.role, u.email`,
      [scope.householdId],
    );
    const pregnancy = await one(
      "select * from pregnancies where household_id = $1 order by created_at limit 1",
      [scope.householdId],
    );
    const child = await one(
      "select * from children where household_id = $1 order by created_at limit 1",
      [scope.householdId],
    );
    const progress = await many(
      "select * from stage_progress where user_id = $1 order by stage_pack_id",
      [scope.userId],
    );
    const items = await many("select * from item_state where user_id = $1 order by item_id", [
      scope.userId,
    ]);
    const appointments = await many(
      "select * from appointments where household_id = $1 order by due_at",
      [scope.householdId],
    );
    const reminders = await many("select * from reminders where user_id = $1 order by remind_at", [
      scope.userId,
    ]);
    const subscription = await one(
      "select * from subscriptions where household_id = $1 order by created_at limit 1",
      [scope.householdId],
    );
    const sharedItems = await many(
      "select * from shared_items where household_id = $1 order by created_at",
      [scope.householdId],
    );
    const jobs = await many("select * from jobs where household_id = $1 order by created_at", [
      scope.householdId,
    ]);
    const invites = await many(
      `select id, household_id, role, created_by, expires_at, used_at, revoked_at, created_at
         from household_invites
        where household_id = $1
        order by created_at`,
      [scope.householdId],
    );
    const deletion = await one(
      `select requested_at, purge_after
         from deletion_requests
        where user_id = $1 and cancelled_at is null
        order by requested_at desc
        limit 1`,
      [scope.userId],
    );

    return {
      exportedAt: now.toISOString(),
      user,
      household,
      members,
      pregnancy,
      child,
      progress,
      items,
      appointments,
      reminders,
      subscription,
      sharedItems,
      jobs,
      invites,
      deletion: deletion
        ? {
            requestedAt: (deletion.requested_at as Date).toISOString(),
            purgeAfter: (deletion.purge_after as Date).toISOString(),
          }
        : null,
    };
  });
}

export interface DeletionStatus {
  requestedAt: string;
  purgeAfter: string;
}

/**
 * Asks for the account to be deleted.
 *
 * Idempotent: asking twice returns the request that is already live rather
 * than pushing the date out, because a person who clicks twice has not
 * changed their mind about wanting it gone.
 */
export async function requestDeletion(
  db: SqlClient,
  scope: Scope,
  options: { now?: Date } = {},
): Promise<DeletionStatus> {
  const now = options.now ?? new Date();
  const purgeAfter = new Date(now.getTime() + DELETION_GRACE_DAYS * DAY_MS);

  return asUser(db, scope.userId, async () => {
    const existing = await db.query<{ requested_at: Date; purge_after: Date }>(
      `select requested_at, purge_after
         from deletion_requests
        where user_id = $1 and cancelled_at is null
        order by requested_at desc
        limit 1`,
      [scope.userId],
    );
    const live = existing.rows[0];
    if (live) {
      return {
        requestedAt: live.requested_at.toISOString(),
        purgeAfter: live.purge_after.toISOString(),
      };
    }

    const { rows } = await db.query<{ requested_at: Date; purge_after: Date }>(
      `insert into deletion_requests (user_id, requested_at, purge_after)
       values ($1, $2, $3)
       returning requested_at, purge_after`,
      [scope.userId, now, purgeAfter],
    );
    await db.query("update users set deleted_at = $2 where id = $1", [scope.userId, now]);

    const created = rows[0]!;
    return {
      requestedAt: created.requested_at.toISOString(),
      purgeAfter: created.purge_after.toISOString(),
    };
  });
}

/**
 * Changes their mind.
 *
 * Returns false when there was nothing to cancel, so the caller can say
 * "there is no deletion pending" rather than pretending it did something.
 */
export async function cancelDeletion(
  db: SqlClient,
  scope: Scope,
  options: { now?: Date } = {},
): Promise<boolean> {
  const now = options.now ?? new Date();

  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{ id: string }>(
      `update deletion_requests
          set cancelled_at = $2
        where user_id = $1 and cancelled_at is null
        returning id`,
      [scope.userId, now],
    );
    if (rows.length === 0) return false;
    await db.query("update users set deleted_at = null where id = $1", [scope.userId]);
    return true;
  });
}

export async function deletionStatus(
  db: SqlClient,
  scope: Scope,
): Promise<DeletionStatus | undefined> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<{ requested_at: Date; purge_after: Date }>(
      `select requested_at, purge_after
         from deletion_requests
        where user_id = $1 and cancelled_at is null
        order by requested_at desc
        limit 1`,
      [scope.userId],
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      requestedAt: row.requested_at.toISOString(),
      purgeAfter: row.purge_after.toISOString(),
    };
  });
}

/**
 * Removes every account whose grace period has run out.
 *
 * Deliberately unscoped and deliberately not a repository function: it is a
 * job, it runs as the owner, and it is the one place in this package that
 * deletes a `users` row. Everything that references the user cascades, so
 * there is nothing left behind to find.
 */
export async function purgeDeleted(
  db: SqlClient,
  options: { now?: Date } = {},
): Promise<{ purged: number }> {
  const now = options.now ?? new Date();

  await db.exec("begin");
  try {
    const { rows } = await db.query<{ id: string }>(
      `delete from users
        where id in (
          select user_id from deletion_requests
           where cancelled_at is null and purge_after <= $1
        )
        returning id`,
      [now],
    );

    // A household is not owned by a user, so deleting the last member does not
    // cascade to it. Without this the appointments, shared pins and jobs of a
    // deleted account would sit in a household nobody can reach — still
    // personal data, still on disk. This is the same rule `leaveHousehold`
    // uses: a household with no members is not a household.
    await db.query(
      `delete from households h
        where not exists (select 1 from household_members m where m.household_id = h.id)`,
    );

    await db.exec("commit");
    return { purged: rows.length };
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}

/**
 * The same data as one flat table.
 *
 * The JSON export is the complete one. This is the version a person can open
 * in a spreadsheet, so it is one row per thing with a `section` column rather
 * than a file per table — a folder of six CSVs is not more useful than one
 * sheet with a filter on it.
 */
export function accountCsv(account: AccountExport): string {
  const header = ["section", "id", "title", "stage", "state", "date", "detail"];
  const rows: string[][] = [];

  const text = (value: unknown): string =>
    value === null || value === undefined ? "" : String(value);
  const day = (value: unknown): string => {
    if (value instanceof Date) return value.toISOString();
    return text(value);
  };

  for (const item of account.items) {
    rows.push([
      "Pinned and done",
      text(item.item_id),
      text(item.title),
      text(item.stage_pack_id),
      text(item.state),
      day(item.updated_at),
      text(item.note),
    ]);
  }
  for (const entry of account.progress) {
    rows.push([
      "Weeks",
      text(entry.stage_pack_id),
      text(entry.stage_pack_id),
      text(entry.stage_pack_id),
      text(entry.state),
      day(entry.completed_at),
      "",
    ]);
  }
  for (const appointment of account.appointments) {
    rows.push([
      "Appointments",
      text(appointment.id),
      text(appointment.title),
      "",
      text(appointment.kind),
      day(appointment.due_at),
      text(appointment.location),
    ]);
  }
  for (const reminder of account.reminders) {
    rows.push([
      "Reminders",
      text(reminder.item_id),
      text(reminder.title),
      "",
      text(reminder.channel),
      day(reminder.remind_at),
      "",
    ]);
  }
  for (const job of account.jobs) {
    rows.push([
      "Jobs",
      text(job.id),
      text(job.title),
      text(job.pack_title),
      text(job.status),
      day(job.done_at ?? job.created_at),
      "",
    ]);
  }
  for (const shared of account.sharedItems) {
    rows.push([
      "Shared",
      text(shared.item_id),
      text(shared.title),
      text(shared.pack_title),
      "",
      day(shared.created_at),
      "",
    ]);
  }

  const escape = (value: string): string =>
    /[",\n\r]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

  return [header, ...rows].map((row) => row.map(escape).join(",")).join("\r\n") + "\r\n";
}
