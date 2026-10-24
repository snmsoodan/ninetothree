import { describe, expect, it, vi } from "vitest";

import { buildProviders, DEFAULT_FROM } from "./providers";

const sender = vi.fn().mockResolvedValue(undefined);

describe("buildProviders", () => {
  it("always offers email, because it needs nothing configured", () => {
    const providers = buildProviders(sender, {});

    expect(providers).toHaveLength(1);
    expect(providers[0]!.id).toBe("email");
  });

  it("gives the link fifteen minutes", () => {
    const [email] = buildProviders(sender, {});

    expect((email as { maxAge: number }).maxAge).toBe(900);
  });

  it("sends through the sender it was given", async () => {
    const [email] = buildProviders(sender, {});
    const expires = new Date("2026-03-01T12:15:00Z");

    const send = (
      email as unknown as {
        sendVerificationRequest: (p: unknown) => Promise<void>;
      }
    ).sendVerificationRequest;
    await send({ identifier: "maya@example.com", url: "https://x/y", expires });

    expect(sender).toHaveBeenCalledWith({ to: "maya@example.com", url: "https://x/y", expires });
  });

  it("uses the default from address", () => {
    const [email] = buildProviders(sender, {});

    expect((email as { from: string }).from).toBe(DEFAULT_FROM);
  });

  it("uses a configured from address", () => {
    const [email] = buildProviders(sender, { EMAIL_FROM: "Hi <hi@x.com>" });

    expect((email as { from: string }).from).toBe("Hi <hi@x.com>");
  });

  it("adds Google only when both halves of the credential are there", () => {
    expect(buildProviders(sender, { AUTH_GOOGLE_ID: "id" })).toHaveLength(1);
    expect(buildProviders(sender, { AUTH_GOOGLE_SECRET: "secret" })).toHaveLength(1);
    expect(buildProviders(sender, { AUTH_GOOGLE_ID: "id", AUTH_GOOGLE_SECRET: "s" })).toHaveLength(
      2,
    );
  });

  it("adds Apple only when both halves of the credential are there", () => {
    expect(buildProviders(sender, { AUTH_APPLE_ID: "id" })).toHaveLength(1);
    expect(buildProviders(sender, { AUTH_APPLE_ID: "id", AUTH_APPLE_SECRET: "s" })).toHaveLength(2);
  });

  it("offers all three when all three are configured", () => {
    const providers = buildProviders(sender, {
      AUTH_GOOGLE_ID: "g",
      AUTH_GOOGLE_SECRET: "g",
      AUTH_APPLE_ID: "a",
      AUTH_APPLE_SECRET: "a",
    });

    expect(providers.map((p) => p.id)).toEqual(["email", "google", "apple"]);
  });
});
