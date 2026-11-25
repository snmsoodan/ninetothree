import { describe, expect, it } from "vitest";

import { CreateInviteRequest, CreatedInvite, Invite, InviteList } from "./invites";

const invite = {
  id: "i1",
  role: "grandparent" as const,
  expiresAt: "2026-12-02T10:00:00.000Z",
};

describe("Invite", () => {
  it("reads an expiry as the string that crossed the wire", () => {
    expect(Invite.parse(invite)).toEqual(invite);
  });

  it("refuses a Date, because a route that forgot to serialise is the bug this catches", () => {
    expect(Invite.safeParse({ ...invite, expiresAt: new Date() }).success).toBe(false);
  });

  it("refuses an unknown role", () => {
    expect(Invite.safeParse({ ...invite, role: "guest" }).success).toBe(false);
  });
});

describe("InviteList", () => {
  it("allows an empty list, which is what a new household has", () => {
    expect(InviteList.parse({ invites: [] })).toEqual({ invites: [] });
  });

  it("refuses a bare array, which is the shape a caller is most likely to guess", () => {
    expect(InviteList.safeParse([invite]).success).toBe(false);
  });
});

describe("CreateInviteRequest", () => {
  it("takes a role and only a role", () => {
    expect(CreateInviteRequest.parse({ role: "carer" })).toEqual({ role: "carer" });
    expect(CreateInviteRequest.safeParse({}).success).toBe(false);
  });
});

describe("CreatedInvite", () => {
  it("carries a path, not an absolute origin", () => {
    expect(CreatedInvite.parse({ ...invite, url: "/join/abc" }).url).toBe("/join/abc");
  });

  it("refuses an absolute URL, because the host that minted it is not ours to guess", () => {
    expect(CreatedInvite.safeParse({ ...invite, url: "https://x.test/join/abc" }).success).toBe(
      false,
    );
  });
});
