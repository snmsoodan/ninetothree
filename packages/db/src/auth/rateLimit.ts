import type { SqlClient } from "../migrate";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./policy";

export interface RateLimitResult {
  allowed: boolean;
  /** How many more attempts fit in the window. Never negative. */
  remaining: number;
  /** How long until the oldest attempt in the window falls out. Zero when allowed. */
  retryAfterMs: number;
}

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
  now?: Date;
}

/**
 * Counts the attempts recorded against `key` inside the window.
 *
 * This reads; it does not write. The caller records the attempt only after it
 * has decided to act, so a request that is refused does not extend its own
 * lockout — otherwise a script that hammers the endpoint would keep it locked
 * forever, which is a denial of service dressed as a defence.
 */
export async function checkRateLimit(
  db: SqlClient,
  key: string,
  options: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const max = options.max ?? RATE_LIMIT_MAX;
  const windowMs = options.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const now = options.now ?? new Date();
  const since = new Date(now.getTime() - windowMs);

  const { rows } = await db.query<{ n: string; oldest: Date | null }>(
    `select count(*)::text as n, min(at) as oldest
       from auth_attempts
      where key = $1 and at > $2`,
    [key, since],
  );

  // `count(*)` without a `group by` always returns exactly one row.
  const used = Number(rows[0]!.n);
  if (used < max) {
    return { allowed: true, remaining: max - used, retryAfterMs: 0 };
  }

  const oldest = rows[0]!.oldest;
  const retryAfterMs = oldest ? Math.max(0, oldest.getTime() + windowMs - now.getTime()) : windowMs;
  return { allowed: false, remaining: 0, retryAfterMs };
}

/** Records one attempt. Call this only when the request is actually acted on. */
export async function recordAttempt(db: SqlClient, key: string, now?: Date): Promise<void> {
  await db.query("insert into auth_attempts (key, at) values ($1, $2)", [key, now ?? new Date()]);
}

/** Forgets every attempt against `key`. Used after a successful sign-in. */
export async function clearAttempts(db: SqlClient, key: string): Promise<void> {
  await db.query("delete from auth_attempts where key = $1", [key]);
}

/** Drops attempts older than the window. Cheap, and keeps the table from growing forever. */
export async function pruneAttempts(
  db: SqlClient,
  options: RateLimitOptions = {},
): Promise<number> {
  const windowMs = options.windowMs ?? RATE_LIMIT_WINDOW_MS;
  const now = options.now ?? new Date();
  const { rows } = await db.query<{ id: string }>(
    "delete from auth_attempts where at <= $1 returning id",
    [new Date(now.getTime() - windowMs)],
  );
  return rows.length;
}
