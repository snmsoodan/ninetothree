import type { SqlClient } from "@ninetothree/db";
import {
  checkRateLimit,
  clearAttempts,
  EXCHANGE_RATE_LIMIT_MAX,
  recordAttempt,
  SESSION_MAX_AGE_S,
} from "@ninetothree/db/auth";
import { type NativeProvider, NativeSession, NativeExchangeRequest } from "@ninetothree/contracts";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

import type { ProviderEnv } from "./providers";

/**
 * Trading the ID token an OS handed a phone for a row in `sessions`.
 *
 * There is no second identity system here. The phone arrives with a token that
 * Google or Apple signed, this file checks the signature against that
 * provider's published keys, links the account by address the way the web's
 * `allowDangerousEmailAccountLinking` already does, and writes a session. What
 * comes back is the same kind of session the browser gets in a cookie, which is
 * why revoking one revokes it everywhere.
 */

export interface NativeEnv extends ProviderEnv {
  /**
   * Client IDs the phone's ID token may be minted for, comma separated.
   *
   * A Google ID token names the client that asked for it in `aud`, and the
   * Android client is a different value from the web one, so the web client ID
   * alone would refuse every phone. When unset, only the web client ID is
   * accepted, which is honest: an unconfigured native app gets "not configured"
   * rather than a token verified against nothing.
   */
  AUTH_GOOGLE_NATIVE_IDS?: string;
  AUTH_APPLE_NATIVE_ID?: string;
}

/** Who the token says this is, once the signature and claims have been checked. */
export interface NativeIdentity {
  provider: NativeProvider;
  subject: string;
  email: string;
  name: string | null;
}

export type Verify = (raw: string, provider: NativeProvider) => Promise<NativeIdentity>;

export const GOOGLE_JWKS = new URL("https://www.googleapis.com/oauth2/v3/certs");
export const APPLE_JWKS = new URL("https://appleid.apple.com/auth/keys");

/**
 * Google has used two spellings of its issuer for years and tokens in the wild
 * carry both, so both are accepted. Nothing else is.
 */
const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const APPLE_ISSUER = "https://appleid.apple.com";

function audiences(env: NativeEnv, provider: NativeProvider): string[] {
  const extra = (env.AUTH_GOOGLE_NATIVE_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const values =
    provider === "google"
      ? [env.AUTH_GOOGLE_ID ?? "", ...extra]
      : [env.AUTH_APPLE_NATIVE_ID ?? "", env.AUTH_APPLE_ID ?? ""];
  return [...new Set(values.filter(Boolean))];
}

export interface VerifierOptions {
  /** Where the provider's keys come from. A seam, so tests never reach the network. */
  jwks?: (provider: NativeProvider) => JWTVerifyGetKey;
  now?: Date;
}

/**
 * The real verifier: one key set per provider, cached by `jose` between calls.
 *
 * A provider with no configured client ID cannot be verified against anything,
 * so asking it throws `not-configured` rather than falling back to "trust the
 * token", which is the mistake that turns a login route into an open door.
 */
export function buildVerifier(env: NativeEnv = process.env, options: VerifierOptions = {}): Verify {
  const keySets: Record<NativeProvider, JWTVerifyGetKey> = {
    google: options.jwks?.("google") ?? createRemoteJWKSet(GOOGLE_JWKS),
    apple: options.jwks?.("apple") ?? createRemoteJWKSet(APPLE_JWKS),
  };

  return async (raw, provider) => {
    const audience = audiences(env, provider);
    if (audience.length === 0) throw new Error("not-configured");

    const { payload } = await jwtVerify(raw, keySets[provider], {
      issuer: provider === "google" ? GOOGLE_ISSUERS : APPLE_ISSUER,
      audience,
      currentDate: options.now,
    });

    // Apple only includes the address on the first consent unless the app asks
    // each time, and never for a hidden-address account it decides to anonymise
    // differently; an identity with no address cannot be linked to an account,
    // so it is refused here rather than creating a user called "undefined".
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const subject = payload.sub ?? "";
    if (!email || !subject) throw new Error("token has no address");

    const name = typeof payload.name === "string" && payload.name ? payload.name : null;
    return { provider, subject, email, name };
  };
}

export interface ExchangeDeps {
  sql: SqlClient;
  verify: Verify;
  now?: Date;
}

/**
 * The key an attempt is counted against.
 *
 * The address is not known until the token has been verified, and an endpoint
 * that can be hammered before verification is an endpoint that can be hammered.
 * So the count is per caller, from the proxy's forwarded address; the same
 * trade the magic-link guard made, one step earlier in the flow.
 */
export function exchangeKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return `native-exchange:${forwarded || real || "unattributed"}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function exchangeNative(request: Request, deps: ExchangeDeps): Promise<Response> {
  const now = deps.now ?? new Date();

  let input: NativeExchangeRequest;
  try {
    input = NativeExchangeRequest.parse(await request.json());
  } catch {
    return json({ error: "invalid-request" }, 400);
  }

  const key = exchangeKey(request);
  const limit = await checkRateLimit(deps.sql, key, {
    max: EXCHANGE_RATE_LIMIT_MAX,
    now,
  });
  if (!limit.allowed) {
    return new Response(JSON.stringify({ error: "too-many-requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
        "Cache-Control": "no-store",
      },
    });
  }

  let identity: NativeIdentity;
  try {
    identity = await deps.verify(input.idToken, input.provider);
  } catch (error) {
    if ((error as Error).message === "not-configured") {
      return json({ error: "not-configured" }, 503);
    }
    await recordAttempt(deps.sql, key, now);
    return json({ error: "invalid-token" }, 401);
  }

  const expires = new Date(now.getTime() + SESSION_MAX_AGE_S * 1000);
  const token = randomToken();

  const { rows } = await deps.sql.query<{
    id: string;
    email: string;
    name: string | null;
  }>(
    `insert into users (email, name, email_verified)
          values ($1, $2, $3)
     on conflict (email) do update
             set name = coalesce(users.name, excluded.name),
                 email_verified = coalesce(users.email_verified, excluded.email_verified)
       returning id, email::text as email, name`,
    [identity.email, identity.name, now],
  );
  const user = rows[0]!;

  await deps.sql.query(
    "insert into sessions (session_token, user_id, expires) values ($1, $2, $3)",
    [token, user.id, expires],
  );
  await clearAttempts(deps.sql, key);

  return json(
    NativeSession.parse({
      token,
      expiresAt: expires.toISOString(),
      user: { id: user.id, email: user.email, name: user.name },
    }),
  );
}

/**
 * A session token, not a guessable one.
 *
 * 32 bytes from the platform CSPRNG, base64url so it survives a header without
 * escaping. Auth.js's own cookie tokens are longer because they are also an
 * opaque identifier in a URL; nothing here is ever put in a URL.
 */
function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
