import { describe, expect, it, vi } from "vitest";
import { RECALLS } from "@ninetothree/content";
import { EMPTY_STATE, curatedFeed, type AppState } from "@ninetothree/domain";
import { RecallFeed } from "@ninetothree/contracts";
import { fetchFeed, updatesView, type Fetcher } from "./updates";

const TODAY = "2026-10-20";

function state(overrides: Partial<AppState> = {}): AppState {
  return {
    ...EMPTY_STATE,
    onboarded: true,
    status: "parent",
    birthDate: "2026-07-20",
    ...overrides,
  };
}

function responder(body: unknown, ok = true): Fetcher {
  return vi.fn<Fetcher>(async () => ({ ok, json: async () => body }));
}

describe("updatesView", () => {
  it("draws the curated list while the request is out, and says it is checking", () => {
    const model = updatesView({ state: state(), feed: curatedFeed(), loading: true, today: TODAY });
    expect(model.heading).toBe("Updates");
    expect(model.status).toBe("Checking the registers.");
    expect(model.items.length).toBeGreaterThan(0);
  });

  it("says the registers did not answer rather than showing an empty page", () => {
    const model = updatesView({
      state: state(),
      feed: curatedFeed(),
      loading: false,
      today: TODAY,
    });
    expect(model.status).toContain("not answering");
    expect(model.shown.length).toBeGreaterThan(0);
  });

  it("asks for a date when the parent has not given one", () => {
    const model = updatesView({
      state: state({ birthDate: undefined, dueDate: undefined, status: "pregnant" }),
      feed: curatedFeed(),
      loading: false,
      today: TODAY,
    });
    expect(model.scopeLine.toLowerCase()).toContain("once you tell us your due date");
    expect(model.unfiltered).toBe(true);
  });

  it("carries the four free registers and the report link", () => {
    const model = updatesView({
      state: state(),
      feed: curatedFeed(),
      loading: false,
      today: TODAY,
    });
    expect(model.searches.map((source) => source.host)).toEqual([
      "cpsc.gov",
      "fda.gov",
      "nhtsa.gov",
      "fsis.usda.gov",
    ]);
    expect(model.report.url).toBe("https://www.saferproducts.gov/IncidentReporting");
  });

  it("narrows to the age once a birth date is known", () => {
    const model = updatesView({
      state: state(),
      feed: curatedFeed(),
      loading: false,
      today: TODAY,
    });
    expect(model.windowLine).toContain("3 months old");
  });
});

describe("fetchFeed", () => {
  it("returns the parsed feed when the registers answer", async () => {
    const live = { recalls: RECALLS.slice(0, 2), sources: [], live: true, fetchedAt: TODAY };
    expect(RecallFeed.safeParse(live).success).toBe(true);
    await expect(fetchFeed(responder(live))).resolves.toEqual(live);
  });

  it("returns null rather than a broken list when the shape is wrong", async () => {
    await expect(fetchFeed(responder({ recalls: "nope" }))).resolves.toBeNull();
  });

  it("returns null on a bad status", async () => {
    await expect(fetchFeed(responder({}, false))).resolves.toBeNull();
  });

  it("returns null when the request throws", async () => {
    const failing = vi.fn<Fetcher>(async () => {
      throw new Error("offline");
    });
    await expect(fetchFeed(failing)).resolves.toBeNull();
  });

  it("asks the same route the browser asks", async () => {
    const fetcher = responder({ recalls: [], sources: [], live: true, fetchedAt: TODAY });
    await fetchFeed(fetcher);
    expect(fetcher).toHaveBeenCalledWith("/api/updates", undefined);
  });
});
