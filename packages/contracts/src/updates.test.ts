import { describe, expect, it } from "vitest";

import { RECALLS } from "@ninetothree/content";

import { RecallFeed, RecallSourceStatus } from "./updates";

/** A real curated recall, so the composition is checked against real data. */
const [recall] = RECALLS;

const feed = {
  recalls: [recall],
  sources: [{ id: "cpsc" as const, name: "CPSC", ok: true, count: 1 }],
  live: true,
  fetchedAt: "2026-11-25T10:00:00.000Z",
};

describe("RecallSourceStatus", () => {
  it("allows a failure to say why", () => {
    expect(
      RecallSourceStatus.parse({
        id: "fda",
        name: "FDA",
        ok: false,
        count: 0,
        error: "timed out after 8s",
      }).error,
    ).toBe("timed out after 8s");
  });

  it("refuses a source that is neither register", () => {
    expect(RecallSourceStatus.safeParse({ ...feed.sources[0], id: "which" }).success).toBe(false);
  });

  it("refuses a negative count", () => {
    expect(RecallSourceStatus.safeParse({ ...feed.sources[0], count: -1 }).success).toBe(false);
  });
});

describe("RecallFeed", () => {
  it("validates a feed built from a real curated recall", () => {
    expect(RecallFeed.safeParse(feed).success).toBe(true);
  });

  it("allows an empty feed, which is what an offline build sends", () => {
    expect(RecallFeed.safeParse({ ...feed, recalls: [], live: false, fetchedAt: "" }).success).toBe(
      true,
    );
  });

  it("refuses a recall that is not a recall", () => {
    expect(RecallFeed.safeParse({ ...feed, recalls: [{ id: "x" }] }).success).toBe(false);
  });

  it("refuses a feed missing its sources, which the page labels itself with", () => {
    expect(RecallFeed.safeParse({ recalls: [], live: true, fetchedAt: "" }).success).toBe(false);
  });
});
