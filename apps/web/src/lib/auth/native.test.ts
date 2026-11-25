// @vitest-environment node
import { generateKeyPair, SignJWT, type CryptoKey, type JWTPayload } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NativeSession } from "@ninetothree/contracts";

import { getDb, resetDbForTests } from "./db";
import { authFromBearer, bearerToken, currentUser } from "./bearer";
import { buildVerifier, exchangeNative, type ExchangeDeps, type NativeEnv } from "./native";
import { auth } from "./session";

vi.mock("./session", () => ({ auth: vi.fn() }));

const GOOGLE_ISS = "https://accounts.google.com";
const APPLE_ISS = "https://appleid.apple.com";
const T0 = new Date("2026-11-25T12:00:00.000Z");

const env: NativeEnv = {
  AUTH_GOOGLE_ID: "google-web.apps.googleusercontent.com",
  AUTH_GOOGLE_NATIVE_IDS:
    "google-ios.apps.googleusercontent.com, google-android.apps.googleusercontent.com",
  AUTH_APPLE_ID: "com.ninetothree.web",
  AUTH_APPLE_NATIVE_ID: "com.ninetothree.app",
};

let signingKey: CryptoKey;
let signingPublicKey: CryptoKey;
let strangerKey: CryptoKey;

beforeEach(async () => {
  const pair = await generateKeyPair("RS256");
  signingKey = pair.privateKey;
  signingPublicKey = pair.publicKey;
  strangerKey = (await generateKeyPair("RS256")).privateKey;
});

afterEach(() => {
  resetDbForTests();
  vi.mocked(auth).mockReset();
});

async function token(
  claims: JWTPayload,
  options: { key?: CryptoKey; issuer?: string; audience?: string; expires?: string | number } = {},
) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(options.issuer ?? GOOGLE_ISS)
    .setAudience(options.audience ?? "google-ios.apps.googleusercontent.com")
    .setIssuedAt(Math.floor(T0.getTime() / 1000))
    .setExpirationTime(options.expires ?? "30m")
    .sign(options.key ?? signingKey);
}

/** A verifier that trusts the key this file signs with, and nothing else. */
function verifierFor(overrides: NativeEnv = env, now = T0) {
  return buildVerifier(overrides, { jwks: () => async () => signingPublicKey, now });
}

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://ninetothree.com/api/auth/native/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function deps(overrides: Partial<ExchangeDeps> = {}): Promise<ExchangeDeps> {
  const { sql } = await getDb();
  return { sql, verify: verifierFor(), now: T0, ...overrides };
}

function bearerRequest(token: string): Request {
  return new Request("https://ninetothree.com/api/household", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe("the exchange", () => {
  it("turns a Google ID token into a session that the bearer path accepts", async () => {
    const idToken = await token({ sub: "google-1", email: "Maya@Example.com", name: "Maya" });

    const response = await exchangeNative(post({ provider: "google", idToken }), await deps());
    expect(response.status).toBe(200);

    const session = NativeSession.parse(await response.json());
    expect(session.user.email).toBe("maya@example.com");
    expect(session.expiresAt).toBe("2026-12-25T12:00:00.000Z");
    expect(session.token.length).toBeGreaterThan(20);

    const resolved = await authFromBearer(bearerRequest(session.token));
    expect(resolved?.user).toEqual({ id: session.user.id, email: "maya@example.com" });
  });

  it("links a second provider to the same person by address", async () => {
    const first = NativeSession.parse(
      await (
        await exchangeNative(
          post({
            provider: "google",
            idToken: await token({ sub: "g", email: "maya@example.com" }),
          }),
          await deps(),
        )
      ).json(),
    );
    const appleToken = await token(
      { sub: "apple-1", email: "Maya@Example.com" },
      { issuer: APPLE_ISS, audience: "com.ninetothree.app" },
    );
    const second = NativeSession.parse(
      await (
        await exchangeNative(post({ provider: "apple", idToken: appleToken }), await deps())
      ).json(),
    );

    expect(second.user.id).toBe(first.user.id);
    const { sql } = await getDb();
    const { rows } = await sql.query<{ n: string }>("select count(*)::text as n from users");
    expect(rows[0]!.n).toBe("1");
  });

  it("keeps the name it already had when a provider sends none", async () => {
    await exchangeNative(
      post({
        provider: "google",
        idToken: await token({ sub: "g", email: "maya@example.com", name: "Maya" }),
      }),
      await deps(),
    );
    const second = NativeSession.parse(
      await (
        await exchangeNative(
          post({
            provider: "google",
            idToken: await token({ sub: "g", email: "maya@example.com" }),
          }),
          await deps(),
        )
      ).json(),
    );

    expect(second.user.name).toBe("Maya");
  });

  it("refuses a token signed by somebody else", async () => {
    const forged = await token({ sub: "g", email: "maya@example.com" }, { key: strangerKey });

    const response = await exchangeNative(
      post({ provider: "google", idToken: forged }),
      await deps(),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "invalid-token" });
  });

  it("refuses a token that has expired", async () => {
    const stale = await token(
      { sub: "g", email: "maya@example.com" },
      { expires: Math.floor(T0.getTime() / 1000) + 60 },
    );
    const later = new Date(T0.getTime() + 5 * 60 * 1000);

    const response = await exchangeNative(
      post({ provider: "google", idToken: stale }),
      await deps({ verify: verifierFor(env, later), now: later }),
    );

    expect(response.status).toBe(401);
  });

  it("refuses a token minted for a client this server does not know", async () => {
    const wrongAudience = await token(
      { sub: "g", email: "maya@example.com" },
      { audience: "someone-elses-app" },
    );

    const response = await exchangeNative(
      post({ provider: "google", idToken: wrongAudience }),
      await deps(),
    );

    expect(response.status).toBe(401);
  });

  it("refuses an Apple identity that carries no address", async () => {
    const appleToken = await token(
      { sub: "apple-1" },
      { issuer: APPLE_ISS, audience: "com.ninetothree.app" },
    );

    const response = await exchangeNative(
      post({ provider: "apple", idToken: appleToken }),
      await deps(),
    );

    expect(response.status).toBe(401);
  });

  it("says so when the provider has no client ID configured", async () => {
    const idToken = await token({ sub: "g", email: "maya@example.com" });

    const response = await exchangeNative(
      post({ provider: "google", idToken }),
      await deps({ verify: verifierFor({}) }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "not-configured" });
  });

  it("refuses a body that is not a request", async () => {
    const response = await exchangeNative(post({ provider: "github", idToken: "x" }), await deps());

    expect(response.status).toBe(400);
  });

  it("refuses a body that is not JSON at all", async () => {
    const request = new Request("https://ninetothree.com/api/auth/native/exchange", {
      method: "POST",
      body: "not json",
    });

    expect((await exchangeNative(request, await deps())).status).toBe(400);
  });

  it("counts a caller, then stops counting them", async () => {
    const { sql } = await getDb();
    const forged = await token({ sub: "g", email: "maya@example.com" }, { key: strangerKey });
    const request = () =>
      post({ provider: "google", idToken: forged }, { "x-forwarded-for": "203.0.113.9, 10.0.0.1" });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await exchangeNative(request(), await deps())).status).toBe(401);
    }

    const blocked = await exchangeNative(request(), await deps());
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("900");
    expect(await blocked.json()).toEqual({ error: "too-many-requests" });

    const { rows } = await sql.query<{ n: string }>(
      "select count(*)::text as n from auth_attempts where key = $1",
      ["native-exchange:203.0.113.9"],
    );
    expect(rows[0]!.n).toBe("10");
  });

  it("clears a caller's count once they get in", async () => {
    const good = await token({ sub: "g", email: "maya@example.com" });
    const headers = { "x-real-ip": "198.51.100.4" };

    await exchangeNative(post({ provider: "google", idToken: "nonsense" }, headers), await deps());
    await exchangeNative(post({ provider: "google", idToken: good }, headers), await deps());

    const { sql } = await getDb();
    const { rows } = await sql.query<{ n: string }>(
      "select count(*)::text as n from auth_attempts where key = $1",
      ["native-exchange:198.51.100.4"],
    );
    expect(rows[0]!.n).toBe("0");
  });

  it("puts every unattributed caller in one bucket", async () => {
    expect(await exchangeKeyFor(new Request("https://ninetothree.com/x"))).toBe(
      "native-exchange:unattributed",
    );
  });
});

/** `exchangeKey` is not exported from the barrel a client sees, so read it the same way. */
async function exchangeKeyFor(request: Request): Promise<string> {
  const { exchangeKey } = await import("./native");
  return exchangeKey(request);
}

describe("the bearer path", () => {
  it("ignores a session that has been revoked", async () => {
    const session = NativeSession.parse(
      await (
        await exchangeNative(
          post({
            provider: "google",
            idToken: await token({ sub: "g", email: "maya@example.com" }),
          }),
          await deps(),
        )
      ).json(),
    );
    const { sql } = await getDb();
    await sql.query("delete from sessions where session_token = $1", [session.token]);

    expect(await authFromBearer(bearerRequest(session.token))).toBeNull();
  });

  it("ignores a session that has expired", async () => {
    const session = NativeSession.parse(
      await (
        await exchangeNative(
          post({
            provider: "google",
            idToken: await token({ sub: "g", email: "maya@example.com" }),
          }),
          await deps(),
        )
      ).json(),
    );
    const { sql } = await getDb();
    await sql.query("update sessions set expires = $2 where session_token = $1", [
      session.token,
      new Date(T0.getTime() - 1000),
    ]);

    expect(await authFromBearer(bearerRequest(session.token))).toBeNull();
  });

  it("ignores a token that was never issued", async () => {
    expect(await authFromBearer(bearerRequest("made-up"))).toBeNull();
  });

  it("reads a scheme in any case, and nothing else", () => {
    expect(bearerToken(bearerRequest("abc"))).toBe("abc");
    expect(
      bearerToken(
        new Request("https://ninetothree.com/x", { headers: { Authorization: "bearer abc" } }),
      ),
    ).toBe("abc");
    expect(
      bearerToken(
        new Request("https://ninetothree.com/x", { headers: { Authorization: "Basic abc" } }),
      ),
    ).toBeNull();
    expect(
      bearerToken(
        new Request("https://ninetothree.com/x", { headers: { Authorization: "Bearer  " } }),
      ),
    ).toBeNull();
    expect(bearerToken(new Request("https://ninetothree.com/x"))).toBeNull();
  });

  it("still lets the browser in on its cookie", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "cookie-user" } } as never);

    const who = await currentUser(new Request("https://ninetothree.com/api/household"));

    expect(who?.user).toEqual({ id: "cookie-user" });
  });

  it("prefers the phone's token when a request somehow has both", async () => {
    const session = NativeSession.parse(
      await (
        await exchangeNative(
          post({
            provider: "google",
            idToken: await token({ sub: "g", email: "maya@example.com" }),
          }),
          await deps(),
        )
      ).json(),
    );
    vi.mocked(auth).mockResolvedValue({ user: { id: "cookie-user" } } as never);

    const who = await currentUser(bearerRequest(session.token));

    expect(who?.user.id).toBe(session.user.id);
  });
});
