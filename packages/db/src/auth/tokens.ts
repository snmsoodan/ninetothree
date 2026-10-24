import { createHash, randomBytes } from "node:crypto";

import type { SqlClient } from "../migrate";
import { TOKEN_TTL_MS } from "./policy";

export interface TokenOptions {
  /** The same secret Auth.js is configured with. Required: see below. */
  secret: string;
  ttlMs?: number;
  now?: Date;
}

/**
 * Mints a sign-in link token, in the shape Auth.js expects to find it.
 *
 * Auth.js sends the raw token in the URL and stores only a hash of it, so a copy
 * of the database is not a set of working sign-in links. Anything that writes a
 * token for the callback to accept has to hash it the same way, which is why
 * this returns the raw value and stores the hash.
 *
 * The hash is over the token *and the secret*, not the token alone. That is
 * Auth.js's own construction (`createHash(`${token}${secret}`)` in
 * `send-token.js` and again in the callback), and it is what stops a leaked
 * token table from being replayable without the secret. Getting this wrong
 * looks exactly like a correct implementation — the row is written, the URL is
 * well formed, and every link is rejected with `Verification`.
 *
 * Expired tokens for the same address are dropped first, so a person who asks
 * for a link every day for a month does not leave thirty rows behind. Live
 * tokens are left alone: asking twice must not invalidate the first link,
 * because the first email may still be the one they open.
 *
 * Consuming is not here. The adapter deletes the row as it reads it, which is
 * the whole of the replay defence, and a second implementation of that would be
 * a second thing to keep correct.
 */
export async function mintLinkToken(
  db: SqlClient,
  identifier: string,
  options: TokenOptions,
): Promise<{ token: string; expires: Date }> {
  const ttlMs = options.ttlMs ?? TOKEN_TTL_MS;
  const now = options.now ?? new Date();
  const expires = new Date(now.getTime() + ttlMs);
  const token = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(`${token}${options.secret}`).digest("hex");

  await db.query("delete from verification_tokens where identifier = $1 and expires <= $2", [
    identifier,
    now,
  ]);
  await db.query(
    "insert into verification_tokens (identifier, token, expires) values ($1, $2, $3)",
    [identifier, hash, expires],
  );

  return { token, expires };
}
