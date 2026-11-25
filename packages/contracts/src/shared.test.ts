import { describe, expect, it } from "vitest";

import { ErrorBody, MemberRole, Timestamp } from "./shared";

describe("MemberRole", () => {
  it("accepts the four roles and nothing else", () => {
    for (const role of ["parent", "partner", "grandparent", "carer"]) {
      expect(MemberRole.safeParse(role).success).toBe(true);
    }
    expect(MemberRole.safeParse("owner").success).toBe(false);
    expect(MemberRole.safeParse("").success).toBe(false);
  });
});

describe("Timestamp", () => {
  it("accepts what JSON.stringify does to a Date", () => {
    expect(Timestamp.parse(new Date("2026-11-25T10:00:00.000Z").toJSON())).toBe(
      "2026-11-25T10:00:00.000Z",
    );
    // Offsets, because a client is not required to be in UTC.
    expect(Timestamp.safeParse("2026-11-25T10:00:00+01:00").success).toBe(true);
  });

  it("refuses a Date object, which is the shape that cannot have crossed", () => {
    expect(Timestamp.safeParse(new Date()).success).toBe(false);
  });

  it("refuses prose and a bare day", () => {
    expect(Timestamp.safeParse("yesterday").success).toBe(false);
    expect(Timestamp.safeParse("2026-11-25").success).toBe(false);
  });
});

describe("ErrorBody", () => {
  it("is the one shape every refusal shares", () => {
    expect(ErrorBody.parse({ error: "signed out" })).toEqual({ error: "signed out" });
    expect(ErrorBody.safeParse({ error: 401 }).success).toBe(false);
    expect(ErrorBody.safeParse({}).success).toBe(false);
  });
});
