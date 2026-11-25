import { getDb } from "./db";
import { auth } from "./session";

/**
 * The session a phone carries, read from the `Authorization` header.
 *
 * The same `sessions` row a browser resolves from its cookie, joined to the same
 * `users` row. Expiry is checked in SQL rather than in JavaScript so a clock in
 * a serverless function cannot extend a session that the database considers
 * over.
 */
export async function authFromBearer(
  request: Request,
): Promise<{ user: { id: string; email: string } } | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const { sql } = await getDb();
  const { rows } = await sql.query<{ id: string; email: string }>(
    `select u.id, u.email::text as email
       from sessions s
       join users u on u.id = s.user_id
      where s.session_token = $1
        and s.expires > now()
        and u.deleted_at is null`,
    [token],
  );

  const row = rows[0];
  return row ? { user: { id: row.id, email: row.email } } : null;
}

/** The token in `Authorization: Bearer …`, or null. Case-insensitive scheme, as RFC 7235 says. */
export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, ...rest] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer") return null;
  const token = rest.join(" ").trim();
  return token || null;
}

/**
 * Who is asking: the phone's bearer token, or the browser's cookie.
 *
 * Routes call this instead of `auth()`. A request carries at most one of the
 * two, so the order costs one header read for a browser and one null check for a
 * phone. Falling back to the cookie rather than the other way round is
 * deliberate: the browser path is the one already in production, and it must not
 * change behaviour because a phone exists.
 */
export async function currentUser(
  request: Request,
): Promise<{ user: { id: string; email?: string | null } } | null> {
  const bearer = await authFromBearer(request);
  if (bearer) return bearer;

  const session = await auth();
  const user = session?.user;
  // A cookie session with no id is not a person this app can act as, and every
  // caller would have to check again. It becomes "signed out" here, once.
  if (!user?.id) return null;
  return { user: { id: user.id, email: user.email } };
}
