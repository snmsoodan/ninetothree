import { describe, expect, it } from "vitest";

import {
  Household,
  HouseholdMember,
  LeaveResponse,
  SharePinRequest,
  SharePinResponse,
} from "./household";

const member = {
  userId: "u1",
  role: "parent" as const,
  email: "a@example.com",
  name: "A",
  isYou: true,
};

const household = {
  id: "h1",
  role: "parent" as const,
  members: [member],
  sharedItemIds: ["p1"],
  jobsForYou: [{ id: "j1", title: "Book the scan", packTitle: "Week 12" }],
};

describe("Household", () => {
  it("reads the body /api/household actually sends", () => {
    expect(Household.parse(household)).toEqual(household);
  });

  it("allows a member with no name, because Apple does not always give one", () => {
    expect(HouseholdMember.safeParse({ ...member, name: null }).success).toBe(true);
  });

  it("refuses a role the database cannot hold", () => {
    expect(Household.safeParse({ ...household, role: "admin" }).success).toBe(false);
    expect(HouseholdMember.safeParse({ ...member, role: "admin" }).success).toBe(false);
  });

  it("refuses a missing field rather than inventing it", () => {
    const { members: _members, ...withoutMembers } = household;
    expect(Household.safeParse(withoutMembers).success).toBe(false);
  });

  it("strips a field it has never heard of, so the web can add one", () => {
    const parsed = Household.parse({ ...household, themePreference: "dark" });
    expect(parsed).not.toHaveProperty("themePreference");
    expect(parsed.members).toHaveLength(1);
  });
});

describe("SharePinRequest", () => {
  it("accepts the two fields the pin button always sends", () => {
    expect(SharePinRequest.parse({ itemId: "p1", title: "Vitamin D" })).toEqual({
      itemId: "p1",
      title: "Vitamin D",
    });
  });

  it("accepts an unshare and a pack", () => {
    const parsed = SharePinRequest.parse({
      itemId: "p1",
      title: "Vitamin D",
      packId: "pregnancy-week-12",
      packTitle: "Week 12",
      shared: false,
    });
    expect(parsed.shared).toBe(false);
  });

  it("refuses an empty title, which is a pin a partner cannot read", () => {
    expect(SharePinRequest.safeParse({ itemId: "p1", title: "" }).success).toBe(false);
  });
});

describe("SharePinResponse and LeaveResponse", () => {
  it("are one boolean each", () => {
    expect(SharePinResponse.parse({ shared: true })).toEqual({ shared: true });
    expect(SharePinResponse.safeParse({ shared: "yes" }).success).toBe(false);
    expect(LeaveResponse.parse({ left: false })).toEqual({ left: false });
  });
});
