import { describe, expect, it, vi } from "vitest";

import {
  restoreSession,
  exchange,
  signIn,
  signOut,
  SESSION_KEY,
  type SecureStorePort,
} from "./auth";

const SESSION = {
  token: "abc123",
  expiresAt: "2030-01-01T00:00:00.000Z",
  user: { id: "5f1c9f0e-0000-4000-8000-000000000000", email: "sam@example.com", name: "Sam" },
};

function memory(
  initial: Record<string, string> = {},
): SecureStorePort & { values: Record<string, string> } {
  const values = { ...initial };
  return {
    values,
    getItem: async (key) => values[key] ?? null,
    setItem: async (key, value) => {
      values[key] = value;
    },
    deleteItem: async (key) => {
      delete values[key];
    },
  };
}

function response(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as Response;
}

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("sign-in on the phone", () => {
  it("trades a provider token for a session and keeps it", async () => {
    const store = memory();
    const fetch = vi.fn(async () => response(SESSION));
    const result = await signIn("google", {
      store,
      fetch: fetch as unknown as typeof globalThis.fetch,
      baseUrl: "https://ninetothree.com",
      providers: { google: async () => "id-token", apple: async () => null },
      now: () => NOW,
    });

    expect(result).toEqual({ state: "signed-in", session: SESSION });
    expect(fetch).toHaveBeenCalledWith("https://ninetothree.com/api/auth/native/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google", idToken: "id-token" }),
    });
    expect(JSON.parse(store.values[SESSION_KEY]!)).toEqual(SESSION);
  });

  it("stays signed out and silent when the server refuses the token", async () => {
    const store = memory();
    const result = await signIn("apple", {
      store,
      fetch: (async () =>
        response({ error: "invalid-token" }, false)) as unknown as typeof globalThis.fetch,
      baseUrl: "https://ninetothree.com",
      providers: { google: async () => null, apple: async () => "stale" },
    });

    expect(result).toEqual({ state: "refused" });
    expect(store.values[SESSION_KEY]).toBeUndefined();
  });

  it("treats a closed prompt as a cancellation, not a failure", async () => {
    const store = memory();
    const fetch = vi.fn();
    const result = await signIn("google", {
      store,
      fetch: fetch as unknown as typeof globalThis.fetch,
      baseUrl: "https://ninetothree.com",
      providers: { google: async () => null, apple: async () => null },
    });

    expect(result).toEqual({ state: "cancelled" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuses a body that is not a session", async () => {
    await expect(
      exchange("id-token", "google", {
        fetch: (async () => response({ token: 1 })) as unknown as typeof globalThis.fetch,
        baseUrl: "https://ninetothree.com",
      }),
    ).resolves.toBeNull();
  });

  it("restores a session that is still alive", async () => {
    const store = memory({ [SESSION_KEY]: JSON.stringify(SESSION) });
    await expect(restoreSession(store, NOW)).resolves.toEqual(SESSION);
    expect(store.values[SESSION_KEY]).toBeDefined();
  });

  it("forgets an expired or unreadable session rather than crashing on it", async () => {
    const expired = memory({
      [SESSION_KEY]: JSON.stringify({ ...SESSION, expiresAt: "2025-01-01T00:00:00.000Z" }),
    });
    await expect(restoreSession(expired, NOW)).resolves.toBeNull();
    expect(expired.values[SESSION_KEY]).toBeUndefined();

    const broken = memory({ [SESSION_KEY]: "not json" });
    await expect(restoreSession(broken, NOW)).resolves.toBeNull();
    expect(broken.values[SESSION_KEY]).toBeUndefined();
  });

  it("deletes the local credential even when revoking it fails", async () => {
    const store = memory({ [SESSION_KEY]: JSON.stringify(SESSION) });
    const fetch = vi.fn(async () => {
      throw new Error("offline");
    });
    await signOut(
      {
        store,
        fetch: fetch as unknown as typeof globalThis.fetch,
        baseUrl: "https://ninetothree.com",
      },
      "abc123",
    );

    expect(fetch).toHaveBeenCalledWith("https://ninetothree.com/api/auth/native/session", {
      method: "DELETE",
      headers: { authorization: "Bearer abc123" },
    });
    expect(store.values[SESSION_KEY]).toBeUndefined();
  });

  it("signs out locally without a token and without a request", async () => {
    const store = memory({ [SESSION_KEY]: JSON.stringify(SESSION) });
    const fetch = vi.fn();
    await signOut(
      {
        store,
        fetch: fetch as unknown as typeof globalThis.fetch,
        baseUrl: "https://ninetothree.com",
      },
      null,
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(store.values[SESSION_KEY]).toBeUndefined();
  });
});
