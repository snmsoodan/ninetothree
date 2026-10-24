import { createHash } from "node:crypto";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrateUp } from "../migrate";
import { createTestDb } from "../testing";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS, SESSION_MAX_AGE_S, TOKEN_TTL_MS } from "./policy";
import { checkRateLimit, clearAttempts, pruneAttempts, recordAttempt } from "./rateLimit";
import { mintLinkToken } from "./tokens";

let db: Awaited<ReturnType<typeof createTestDb>>;

beforeAll(async () => {
  db = await createTestDb();
});

beforeEach(async () => {
  await db.exec("drop schema public cascade; create schema public;");
  await migrateUp(db);
});

afterAll(async () => {
  await db?.close();
});

const T0 = new Date("2026-03-01T12:00:00Z");
const SECRET = "test-secret-not-a-real-one";
const at = (ms: number) => new Date(T0.getTime() + ms);

describe("the shipped policy", () => {
  it("gives a link fifteen minutes", () => {
    expect(TOKEN_TTL_MS).toBe(15 * 60 * 1000);
  });

  it("allows five attempts per window", () => {
    expect(RATE_LIMIT_MAX).toBe(5);
    expect(RATE_LIMIT_WINDOW_MS).toBe(15 * 60 * 1000);
  });

  it("keeps a session for thirty days", () => {
    expect(SESSION_MAX_AGE_S).toBe(30 * 24 * 60 * 60);
  });
});

describe("rate limiting", () => {
  it("allows the first request and reports the room left", async () => {
    const result = await checkRateLimit(db, "maya@example.com", { now: T0 });

    expect(result).toEqual({ allowed: true, remaining: 5, retryAfterMs: 0 });
  });

  it("counts down as attempts are recorded", async () => {
    await recordAttempt(db, "maya@example.com", T0);
    await recordAttempt(db, "maya@example.com", at(1000));

    const result = await checkRateLimit(db, "maya@example.com", { now: at(2000) });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it("refuses the sixth request in the window", async () => {
    for (let i = 0; i < 5; i += 1) await recordAttempt(db, "maya@example.com", at(i * 1000));

    const result = await checkRateLimit(db, "maya@example.com", { now: at(6000) });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("says how long to wait, measured from the oldest attempt", async () => {
    for (let i = 0; i < 5; i += 1) await recordAttempt(db, "maya@example.com", at(i * 1000));

    const result = await checkRateLimit(db, "maya@example.com", { now: at(60_000) });

    expect(result.retryAfterMs).toBe(RATE_LIMIT_WINDOW_MS - 60_000);
  });

  it("forgets attempts once they fall out of the window", async () => {
    for (let i = 0; i < 5; i += 1) await recordAttempt(db, "maya@example.com", T0);

    const result = await checkRateLimit(db, "maya@example.com", {
      now: at(RATE_LIMIT_WINDOW_MS + 1),
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it("keeps one address's attempts out of another's", async () => {
    for (let i = 0; i < 5; i += 1) await recordAttempt(db, "maya@example.com", at(i * 1000));

    const other = await checkRateLimit(db, "priya@example.com", { now: at(6000) });

    expect(other.allowed).toBe(true);
  });

  it("does not extend a lockout when a refused request is not recorded", async () => {
    for (let i = 0; i < 5; i += 1) await recordAttempt(db, "maya@example.com", at(i * 1000));

    // Ten refusals, none of which record anything.
    for (let i = 0; i < 10; i += 1) {
      await checkRateLimit(db, "maya@example.com", { now: at(6000 + i) });
    }

    const later = await checkRateLimit(db, "maya@example.com", {
      now: at(RATE_LIMIT_WINDOW_MS + 5000),
    });
    expect(later.allowed).toBe(true);
  });

  it("clears the count after a successful sign-in", async () => {
    for (let i = 0; i < 5; i += 1) await recordAttempt(db, "maya@example.com", at(i * 1000));

    await clearAttempts(db, "maya@example.com");

    const result = await checkRateLimit(db, "maya@example.com", { now: at(6000) });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it("prunes what has aged out and leaves what has not", async () => {
    await recordAttempt(db, "old@example.com", at(0));
    await recordAttempt(db, "new@example.com", at(RATE_LIMIT_WINDOW_MS - 1000));

    const removed = await pruneAttempts(db, { now: at(RATE_LIMIT_WINDOW_MS) });

    expect(removed).toBe(1);
    const { rows } = await db.query<{ key: string }>("select key from auth_attempts");
    expect(rows.map((r) => r.key)).toEqual(["new@example.com"]);
  });

  it("falls back to a full window when the oldest attempt is unreadable", async () => {
    // A row with a null `at` cannot exist — the column is not null — so the
    // fallback is exercised by asking for a window that excludes everything.
    const result = await checkRateLimit(db, "nobody@example.com", {
      now: T0,
      max: 0,
    });

    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBe(RATE_LIMIT_WINDOW_MS);
  });
});

describe("with the shipped defaults", () => {
  it("rate-limits against the real clock when no window is given", async () => {
    const result = await checkRateLimit(db, "maya@example.com");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMIT_MAX);
  });

  it("records an attempt against the real clock", async () => {
    await recordAttempt(db, "maya@example.com");

    const { rows } = await db.query<{ at: Date }>("select at from auth_attempts");
    expect(Math.abs(rows[0]!.at.getTime() - Date.now())).toBeLessThan(5000);
  });

  it("prunes against the real clock", async () => {
    await recordAttempt(db, "maya@example.com", new Date(Date.now() - RATE_LIMIT_WINDOW_MS - 1000));

    expect(await pruneAttempts(db)).toBe(1);
  });

  it("mints a token against the real clock", async () => {
    const { expires } = await mintLinkToken(db, "maya@example.com", { secret: SECRET });

    expect(Math.abs(expires.getTime() - (Date.now() + TOKEN_TTL_MS))).toBeLessThan(5000);
  });
});

describe("magic-link tokens", () => {
  it("mints a token that expires in fifteen minutes", async () => {
    const { token, expires } = await mintLinkToken(db, "maya@example.com", {
      secret: SECRET,
      now: T0,
    });

    expect(token.length).toBeGreaterThan(20);
    expect(expires.getTime()).toBe(T0.getTime() + TOKEN_TTL_MS);
  });

  it("mints a different token every time", async () => {
    const a = await mintLinkToken(db, "maya@example.com", { secret: SECRET, now: T0 });
    const b = await mintLinkToken(db, "maya@example.com", { secret: SECRET, now: T0 });

    expect(a.token).not.toBe(b.token);
  });

  it("stores the hash, never the token that was sent", async () => {
    const { token } = await mintLinkToken(db, "maya@example.com", { secret: SECRET, now: T0 });

    const { rows } = await db.query<{ token: string }>(
      "select token from verification_tokens where identifier = $1",
      ["maya@example.com"],
    );

    expect(rows[0]!.token).not.toBe(token);
    expect(rows[0]!.token).toBe(createHash("sha256").update(`${token}${SECRET}`).digest("hex"));
  });

  it("hashes with the secret, so a stolen token table is not a set of links", async () => {
    const { token } = await mintLinkToken(db, "maya@example.com", { secret: SECRET, now: T0 });

    const { rows } = await db.query<{ token: string }>(
      "select token from verification_tokens where identifier = $1",
      ["maya@example.com"],
    );

    expect(rows[0]!.token).not.toBe(createHash("sha256").update(token).digest("hex"));
  });

  it("leaves the first link alive when a second is asked for", async () => {
    const first = await mintLinkToken(db, "maya@example.com", { secret: SECRET, now: T0 });
    await mintLinkToken(db, "maya@example.com", { secret: SECRET, now: at(1000) });

    const { rows } = await db.query<{ n: string }>(
      "select count(*)::text as n from verification_tokens where identifier = $1",
      ["maya@example.com"],
    );
    expect(rows[0]!.n).toBe("2");
    expect(first.token).toHaveLength(64);
  });

  it("drops expired tokens for the same address when minting a new one", async () => {
    await mintLinkToken(db, "maya@example.com", { secret: SECRET, now: T0 });
    await mintLinkToken(db, "maya@example.com", { secret: SECRET, now: at(TOKEN_TTL_MS + 1) });

    const { rows } = await db.query<{ n: string }>(
      "select count(*)::text as n from verification_tokens where identifier = $1",
      ["maya@example.com"],
    );
    expect(rows[0]!.n).toBe("1");
  });

  it("keeps one address's tokens out of another's", async () => {
    await mintLinkToken(db, "maya@example.com", { secret: SECRET, now: T0 });
    await mintLinkToken(db, "priya@example.com", { secret: SECRET, now: T0 });

    const { rows } = await db.query<{ n: string }>(
      "select count(*)::text as n from verification_tokens where identifier = $1",
      ["priya@example.com"],
    );
    expect(rows[0]!.n).toBe("1");
  });

  it("can mint one that has already run out, for the expiry test", async () => {
    const { expires } = await mintLinkToken(db, "maya@example.com", {
      secret: SECRET,
      ttlMs: -60_000,
    });

    expect(expires.getTime()).toBeLessThan(Date.now());
  });
});
