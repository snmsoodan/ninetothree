import { describe, expect, it } from "vitest";

import { hashInviteToken, INVITE_TTL_MS, mintInviteToken } from "./invites";

describe("invite tokens", () => {
  it("is a week", () => {
    expect(INVITE_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("mints a URL-safe string with 256 bits behind it", () => {
    const token = mintInviteToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });

  it("never mints the same token twice", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => mintInviteToken()));
    expect(tokens.size).toBe(50);
  });

  it("hashes to a stable hex digest", () => {
    const token = mintInviteToken();
    expect(hashInviteToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(token)).toBe(hashInviteToken(token));
  });

  it("does not store the token itself", () => {
    const token = mintInviteToken();
    expect(hashInviteToken(token)).not.toBe(token);
  });
});
