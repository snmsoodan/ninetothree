import type { SqlClient } from "./migrate";
import { asUser, type Scope } from "./scope";

export type DevicePlatform = "ios" | "android";

export interface DeviceRow {
  token: string;
  platform: DevicePlatform;
}

/**
 * Registers an install, or moves one that signed into a different household.
 *
 * The token is unique across the table, so the second sign-in on the same
 * phone updates the row instead of creating a second copy of the same device.
 * `returning` gives the caller the row that now exists, whatever it was
 * before.
 */
export async function registerDevice(
  db: SqlClient,
  scope: Scope,
  device: { token: string; platform: DevicePlatform },
): Promise<DeviceRow> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<DeviceRow>(
      `insert into device_tokens (household_id, user_id, token, platform)
       values ($1, $2, $3, $4)
       on conflict (token) do update set
         household_id = excluded.household_id,
         user_id = excluded.user_id,
         platform = excluded.platform,
         updated_at = now()
       returning token, platform`,
      [scope.householdId, scope.userId, device.token, device.platform],
    );
    return rows[0]!;
  });
}

/**
 * Removes one install. Called on sign-out, and by the sender when a push
 * service says the token is no longer registered.
 */
export async function removeDevice(db: SqlClient, scope: Scope, token: string): Promise<boolean> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query(
      "delete from device_tokens where token = $1 and household_id = $2 returning token",
      [token, scope.householdId],
    );
    return rows.length > 0;
  });
}

/** Every install in this household. Never another household's. */
export async function listDevices(db: SqlClient, scope: Scope): Promise<DeviceRow[]> {
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query<DeviceRow>(
      `select token, platform from device_tokens
        where household_id = $1
        order by created_at, token`,
      [scope.householdId],
    );
    return rows;
  });
}

/**
 * Drops tokens the push service rejected. Scoped, like every other write:
 * a token from another household is not ours to prune.
 */
export async function pruneDevices(
  db: SqlClient,
  scope: Scope,
  tokens: readonly string[],
): Promise<number> {
  if (tokens.length === 0) return 0;
  return asUser(db, scope.userId, async () => {
    const { rows } = await db.query(
      `delete from device_tokens
        where household_id = $1 and token = any($2::text[])
        returning token`,
      [scope.householdId, tokens],
    );
    return rows.length;
  });
}
