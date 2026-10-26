import { createHash, randomBytes } from "node:crypto";

/**
 * How long an invite link is good for.
 *
 * Longer than a sign-in link, because an invite is sent to someone who may not
 * be looking at their email today, and shorter than a week, because a link that
 * grants access to a child's records should not sit in an inbox indefinitely.
 */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * A fresh invite token: 32 random bytes, base64url, so it survives a URL.
 *
 * The token is never stored. `hashInviteToken` is what goes in the database, so
 * a copy of the database is not a set of working invites.
 */
export function mintInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * The stored form of a token.
 *
 * A plain SHA-256, with no secret mixed in — unlike a sign-in token, which is
 * hashed with the application secret. The difference is entropy: a sign-in
 * token is derived from an email address and a timestamp, so a secret is what
 * makes the hash unguessable, while this token is 256 random bits and there is
 * nothing to guess. Adding a secret here would only mean that rotating it
 * invalidates every outstanding invite.
 */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
