import { describe, expect, it, vi } from "vitest";

import { buildProviders, DEFAULT_FROM, signInChoices } from "./providers";

const sender = vi.fn().mockResolvedValue(undefined);
const GOOGLE = { AUTH_GOOGLE_ID: "g", AUTH_GOOGLE_SECRET: "g" };
const APPLE = { AUTH_APPLE_ID: "a", AUTH_APPLE_SECRET: "a" };

describe("buildProviders", () => {
  it("offers nothing at all when nothing is configured", () => {
    // No email fallback: an address nothing delivers to would be a form that
    // silently loses a parent's sign-in.
    expect(buildProviders(sender, {})).toHaveLength(0);
  });

  it("offers Google only when both halves of the credential are there", () => {
    expect(buildProviders(sender, { AUTH_GOOGLE_ID: "id" })).toHaveLength(0);
    expect(buildProviders(sender, { AUTH_GOOGLE_SECRET: "secret" })).toHaveLength(0);
    expect(buildProviders(sender, GOOGLE).map((p) => p.id)).toEqual(["google"]);
  });

  it("offers Apple only when both halves of the credential are there", () => {
    expect(buildProviders(sender, { AUTH_APPLE_ID: "id" })).toHaveLength(0);
    expect(buildProviders(sender, APPLE).map((p) => p.id)).toEqual(["apple"]);
  });

  it("is exactly two providers, in a stable order", () => {
    expect(buildProviders(sender, { ...GOOGLE, ...APPLE }).map((p) => p.id)).toEqual([
      "google",
      "apple",
    ]);
  });

  it("links a Google account to an Apple account with the same address", () => {
    /* Both providers verify the address, so the person is the person. The
       alternative is `OAuthAccountNotLinked` on somebody who used Apple on
       their phone and Google on their laptop. */
    for (const provider of buildProviders(sender, { ...GOOGLE, ...APPLE })) {
      // Auth.js keeps provider options under `options`, not at the top level.
      expect(provider.options).toMatchObject({ allowDangerousEmailAccountLinking: true });
    }
  });

  it("adds the email provider only in test mode", () => {
    expect(buildProviders(sender, { AUTH_TEST_MODE: "0" })).toHaveLength(0);
    expect(buildProviders(sender, { AUTH_TEST_MODE: "1" }).map((p) => p.id)).toEqual(["email"]);
    expect(buildProviders(sender, { ...GOOGLE, AUTH_TEST_MODE: "1" }).map((p) => p.id)).toEqual([
      "google",
      "email",
    ]);
  });

  it("gives the test link fifteen minutes and sends through the sender it was given", async () => {
    const [email] = buildProviders(sender, { AUTH_TEST_MODE: "1" });
    const expires = new Date("2026-03-01T12:15:00Z");

    expect((email as { maxAge: number }).maxAge).toBe(900);
    const send = (
      email as unknown as {
        sendVerificationRequest: (p: unknown) => Promise<void>;
      }
    ).sendVerificationRequest;
    await send({ identifier: "maya@example.com", url: "https://x/y", expires });

    expect(sender).toHaveBeenCalledWith({ to: "maya@example.com", url: "https://x/y", expires });
  });

  it("uses the default from address, or a configured one", () => {
    expect((buildProviders(sender, { AUTH_TEST_MODE: "1" })[0] as { from: string }).from).toBe(
      DEFAULT_FROM,
    );
    expect(
      (
        buildProviders(sender, { AUTH_TEST_MODE: "1", EMAIL_FROM: "Hi <hi@x.com>" })[0] as {
          from: string;
        }
      ).from,
    ).toBe("Hi <hi@x.com>");
  });
});

describe("signInChoices", () => {
  it("is what the sign-in page is allowed to draw", () => {
    expect(signInChoices({})).toEqual([]);
    expect(signInChoices(GOOGLE)).toEqual(["google"]);
    expect(signInChoices({ ...GOOGLE, ...APPLE, AUTH_TEST_MODE: "1" })).toEqual([
      "google",
      "apple",
      "email",
    ]);
  });
});
