import { describe, expect, it } from "vitest";

import { NativeExchangeRequest, NativeProvider, NativeSession } from "./auth";

const session = {
  token: "b0a1",
  expiresAt: "2026-12-25T10:00:00.000Z",
  user: { id: "6f1a2b3c-4d5e-4f60-8172-93a4b5c6d7e8", email: "maya@example.com", name: "Maya" },
};

describe("NativeProvider", () => {
  it("is exactly the two providers the web offers", () => {
    expect(NativeProvider.options).toEqual(["google", "apple"]);
  });

  it("refuses a third door", () => {
    expect(NativeProvider.safeParse("email").success).toBe(false);
  });
});

describe("NativeExchangeRequest", () => {
  it("takes a provider and a token", () => {
    expect(NativeExchangeRequest.parse({ provider: "apple", idToken: "eyJhbGci" }).provider).toBe(
      "apple",
    );
  });

  it("refuses an empty token rather than sending it to a verifier", () => {
    expect(NativeExchangeRequest.safeParse({ provider: "google", idToken: "" }).success).toBe(
      false,
    );
  });
});

describe("NativeSession", () => {
  it("accepts a session with a name", () => {
    expect(NativeSession.parse(session).user.name).toBe("Maya");
  });

  it("accepts a provider that gave no name", () => {
    expect(
      NativeSession.parse({ ...session, user: { ...session.user, name: null } }).user.name,
    ).toBeNull();
  });

  it("refuses an expiry that is not a timestamp", () => {
    expect(NativeSession.safeParse({ ...session, expiresAt: 1766666400000 }).success).toBe(false);
  });

  it("refuses an id that is not a uuid", () => {
    expect(
      NativeSession.safeParse({ ...session, user: { ...session.user, id: "1" } }).success,
    ).toBe(false);
  });
});
