import { beforeEach, describe, expect, it } from "vitest";
import type { Recall } from "@ninetothree/content";
import { __resetForTests, chooseOption, getSnapshot, togglePin } from "./store";
import { currentMatches, newMatches, subjectFrom, syncNotices } from "./recalls";

const recall = (over: Partial<Recall> = {}): Recall => ({
  id: "cpsc-1",
  title: "High chairs recalled for a fall hazard",
  product: "Bicystar high chairs",
  hazard: "The seat can detach from the frame.",
  action: "Stop using the chair and contact the maker for a free repair kit.",
  severity: "stop-use",
  publishedAt: "2026-09-01",
  source: {
    id: "cpsc",
    title: "Bicystar high chairs",
    publisher: "CPSC",
    url: "https://www.cpsc.gov/Recalls/2026/example",
    kind: "government",
    accessed: "2026-10-20",
  },
  matches: { optionIds: [], actionIds: ["t-car-seat"], keywords: [] },
  ...over,
});

const pin = (id: string, title: string) => ({
  id,
  title,
  packId: "test-week",
  packTitle: "Week 28",
});

beforeEach(() => {
  window.localStorage.clear();
  __resetForTests();
});

describe("subjectFrom", () => {
  it("is empty for a parent who has pinned and chosen nothing", () => {
    expect(subjectFrom(getSnapshot())).toEqual({ choices: {}, pins: [] });
  });

  it("carries the option id, not the label", () => {
    chooseOption("t-car-seat", "opt-graco", "Graco Extend2Fit", "2026-10-01");
    expect(subjectFrom(getSnapshot()).choices).toEqual({ "t-car-seat": { optionId: "opt-graco" } });
  });

  it("carries the pinned title, because a keyword match reads it", () => {
    togglePin(pin("t-car-seat", "Choose a car seat"), "2026-10-01");
    expect(subjectFrom(getSnapshot()).pins).toEqual([
      { id: "t-car-seat", title: "Choose a car seat" },
    ]);
  });
});

describe("currentMatches", () => {
  it("finds nothing when the parent has nothing", () => {
    expect(currentMatches(getSnapshot(), [recall()])).toEqual([]);
  });

  it("finds a recall for a pinned step", () => {
    togglePin(pin("t-car-seat", "Choose a car seat"), "2026-10-01");
    const matches = currentMatches(getSnapshot(), [recall()]);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.because).toBe("step");
    expect(matches[0]?.matchedOn).toBe("t-car-seat");
  });

  it("finds a recall for a chosen option", () => {
    chooseOption("t-car-seat", "opt-graco", "Graco", "2026-10-01");
    const matches = currentMatches(getSnapshot(), [
      recall({ matches: { optionIds: ["opt-graco"], actionIds: [], keywords: [] } }),
    ]);
    expect(matches[0]?.because).toBe("option");
  });
});

describe("newMatches", () => {
  it("is everything before anything has been recorded", () => {
    togglePin(pin("t-car-seat", "Choose a car seat"), "2026-10-01");
    expect(newMatches(getSnapshot(), [recall()])).toHaveLength(1);
  });

  it("is nothing once the notice exists", () => {
    togglePin(pin("t-car-seat", "Choose a car seat"), "2026-10-01");
    syncNotices(getSnapshot(), [recall()], "2026-10-02T00:00:00.000Z");
    expect(newMatches(getSnapshot(), [recall()])).toEqual([]);
  });

  it("still reports a stronger reason after a weaker one was dismissed", () => {
    togglePin(pin("t-car-seat", "Choose a car seat"), "2026-10-01");
    syncNotices(getSnapshot(), [recall()], "2026-10-02T00:00:00.000Z");
    chooseOption("t-car-seat", "opt-graco", "Graco", "2026-10-03");
    const fresh = newMatches(getSnapshot(), [
      recall({ matches: { optionIds: ["opt-graco"], actionIds: ["t-car-seat"], keywords: [] } }),
    ]);
    expect(fresh).toHaveLength(1);
    expect(fresh[0]?.because).toBe("option");
  });
});

describe("syncNotices", () => {
  it("records nothing and returns zero when there is nothing to say", () => {
    expect(syncNotices(getSnapshot(), [recall()])).toBe(0);
    expect(getSnapshot().notices).toEqual({});
  });

  it("records one notice per match and returns the count", () => {
    togglePin(pin("t-car-seat", "Choose a car seat"), "2026-10-01");
    expect(syncNotices(getSnapshot(), [recall()], "2026-10-02T00:00:00.000Z")).toBe(1);
    expect(Object.keys(getSnapshot().notices)).toEqual(["cpsc-1:t-car-seat"]);
  });

  it("is idempotent, so a re-render cannot double the queue", () => {
    togglePin(pin("t-car-seat", "Choose a car seat"), "2026-10-01");
    syncNotices(getSnapshot(), [recall()], "2026-10-02T00:00:00.000Z");
    expect(syncNotices(getSnapshot(), [recall()], "2026-10-03T00:00:00.000Z")).toBe(0);
    expect(Object.keys(getSnapshot().notices)).toHaveLength(1);
  });
});
