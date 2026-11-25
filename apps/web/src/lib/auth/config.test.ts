// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { buildConfig } from "./config";
import { getDb, resetDbForTests } from "./db";

afterEach(() => {
  resetDbForTests();
});

describe("buildConfig", () => {
  it("keeps sessions in the database, not in a cookie", async () => {
    const config = await buildConfig({});

    expect(config.session?.strategy).toBe("database");
    expect(config.session?.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("sends people to the calm pages, not to Auth.js's own", async () => {
    const config = await buildConfig({});

    expect(config.pages).toEqual({
      signIn: "/signin",
      verifyRequest: "/signin/check-email",
      error: "/signin/error",
    });
  });

  it("offers nothing on a copy with no OAuth app", async () => {
    const config = await buildConfig({});

    // Not even email: #139 made the magic link a test seam, not a way in.
    expect(config.providers).toHaveLength(0);
  });

  it("offers Google and Apple, in that order, when both are set", async () => {
    const config = await buildConfig({
      AUTH_GOOGLE_ID: "google-id",
      AUTH_GOOGLE_SECRET: "google-secret",
      AUTH_APPLE_ID: "apple-id",
      AUTH_APPLE_SECRET: "apple-secret",
    });

    expect(config.providers.map((provider) => (provider as { id: string }).id)).toEqual([
      "google",
      "apple",
    ]);
  });

  it("clears the attempt count when someone proves they own the address", async () => {
    const config = await buildConfig({});
    const { sql } = await getDb();
    await sql.query("insert into auth_attempts (key) values ($1)", ["maya@example.com"]);

    const allowed = await config.callbacks!.signIn!({
      user: { email: "Maya@Example.com" },
    } as never);

    expect(allowed).toBe(true);
    const { rows } = await sql.query<{ n: string }>(
      "select count(*)::text as n from auth_attempts",
    );
    expect(rows[0]!.n).toBe("0");
  });

  it("allows a sign-in with no address without touching the table", async () => {
    const config = await buildConfig({});

    const allowed = await config.callbacks!.signIn!({ user: {} } as never);

    expect(allowed).toBe(true);
  });
});
