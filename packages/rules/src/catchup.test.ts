import { describe, expect, it } from "vitest";
import type { Action, StageKind, StagePack, StageUnit } from "@ninetothree/content";
import {
  CATCH_UP_LIMIT,
  CATCH_UP_WINDOW,
  catchUp,
  catchUpCandidates,
  pickCatchUp,
} from "./catchup";

function action(overrides: Partial<Action> & { id: string }): Action {
  return {
    title: "A step",
    why: "Because it matters.",
    domain: "health-parent",
    priority: "recommended",
    options: [],
    ...overrides,
  } as Action;
}

function pack(
  id: string,
  kind: StageKind,
  stageIndex: number,
  actions: Action[],
  stageUnit: StageUnit = "week",
): StagePack {
  return {
    id,
    kind,
    stageIndex,
    stageUnit,
    title: `${kind} ${stageIndex}`,
    coreActions: actions,
    alsoKnow: [],
    appointments: [],
    redFlags: [{ id: `${id}-rf`, text: "Something is wrong.", escalation: "call-911" }],
    sources: [
      {
        id: `${id}-s`,
        title: "Source",
        url: "https://example.com",
        publisher: "P",
        kind: "clinical",
        accessed: "2026-01-01",
      },
    ],
    reviewedBy: "Test",
    reviewedAt: "2026-01-01",
    locale: "en-US",
    country: "US",
    updatedAt: "2026-01-01",
  } as StagePack;
}

const w8 = pack("pregnancy-w8", "pregnancy", 8, [
  action({ id: "w8-essential", priority: "essential", title: "Book the first visit" }),
  action({ id: "w8-optional", priority: "optional", title: "Read about nausea" }),
]);
const w12 = pack("pregnancy-w12", "pregnancy", 12, [
  action({ id: "w12-essential", priority: "essential", title: "Book the NT scan" }),
]);
const w20 = pack("pregnancy-w20", "pregnancy", 20, [
  action({ id: "w20-essential", priority: "essential", title: "Book the anatomy scan" }),
]);
const w28 = pack("pregnancy-w28", "pregnancy", 28, [
  action({ id: "w28-essential", priority: "essential", title: "Book the glucose test" }),
]);
const w30 = pack("pregnancy-w30", "pregnancy", 30, [
  action({ id: "w30-essential", priority: "essential", title: "Count the movements" }),
]);
const w36 = pack("pregnancy-w36", "pregnancy", 36, [
  action({ id: "w36-essential", priority: "essential", title: "Pack the bag" }),
]);

const ALL = [w8, w12, w20, w28, w30, w36];

describe("catchUp", () => {
  it("returns nothing for the first stage in the sequence", () => {
    const result = catchUp(ALL, w8, []);
    expect(result.items).toEqual([]);
    expect(result.lookedBack).toBe(0);
    expect(result.empty).toBe(true);
  });

  it("never returns a backlog, however late the parent joined", () => {
    // Joining at week 36 means 32 weeks were missed. The answer is still
    // bounded by the window and the limit, not by how late they are.
    const result = catchUp(ALL, w36, []);
    expect(result.items.length).toBeLessThanOrEqual(CATCH_UP_LIMIT);
    expect(result.lookedBack).toBe(CATCH_UP_WINDOW);
  });

  it("looks back exactly the window, not to the beginning", () => {
    const result = catchUp(ALL, w36, []);
    const ids = result.items.map((i) => i.actionId);
    expect(ids).not.toContain("w8-essential");
    expect(ids).not.toContain("w12-essential");
    expect(ids).toContain("w20-essential");
    expect(ids).toContain("w28-essential");
    expect(ids).toContain("w30-essential");
  });

  it("puts an essential ahead of a recommended from a later stage", () => {
    const withRecommended = pack("pregnancy-w29", "pregnancy", 29, [
      action({ id: "w29-recommended", priority: "recommended", title: "Buy a pillow" }),
    ]);
    const result = catchUp([...ALL, withRecommended], w30, []);
    expect(result.items[0]?.actionId).toBe("w28-essential");
    expect(result.items.map((i) => i.actionId)).toContain("w29-recommended");
  });

  it("orders the rest most recent first", () => {
    const result = catchUp(ALL, w36, []);
    const ids = result.items.map((i) => i.actionId);
    expect(ids).toEqual(["w30-essential", "w28-essential", "w20-essential"]);
  });

  it("leaves out optional steps, because they are not a catch-up", () => {
    const result = catchUp(ALL, w12, []);
    expect(result.items.map((i) => i.actionId)).toEqual(["w8-essential"]);
  });

  it("leaves out anything already done", () => {
    const result = catchUp(ALL, w36, ["w28-essential"]);
    expect(result.items.map((i) => i.actionId)).not.toContain("w28-essential");
  });

  it("is empty when everything in the window is done", () => {
    const result = catchUp(ALL, w36, ["w20-essential", "w28-essential", "w30-essential"]);
    expect(result.items).toEqual([]);
    expect(result.empty).toBe(true);
    expect(result.lookedBack).toBe(CATCH_UP_WINDOW);
  });

  it("carries the pack it came from, so the UI can say where it is from", () => {
    const result = catchUp(ALL, w36, []);
    const item = result.items.find((i) => i.actionId === "w28-essential");
    expect(item?.packId).toBe("pregnancy-w28");
    expect(item?.packTitle).toBe("pregnancy 28");
    expect(item?.stageLabel).toBe("Week 28");
  });

  it("labels a monthly stage as a month", () => {
    const m2 = pack(
      "infant-month-2",
      "infant",
      2,
      [action({ id: "m2-essential", priority: "essential", title: "Two month visit" })],
      "month",
    );
    const m6 = pack(
      "infant-month-6",
      "infant",
      6,
      [action({ id: "m6-essential", priority: "essential", title: "Start solids" })],
      "month",
    );
    const result = catchUp([m2, m6], m6, []);
    expect(result.items[0]?.stageLabel).toBe("Month 2");
  });

  it("does not cross from pregnancy into the baby's first year", () => {
    const m2 = pack(
      "infant-month-2",
      "infant",
      2,
      [action({ id: "m2-essential", priority: "essential", title: "Two month visit" })],
      "month",
    );
    const result = catchUp([...ALL, m2], m2, []);
    expect(result.items).toEqual([]);
    expect(result.lookedBack).toBe(0);
  });

  it("ignores event packs, which are not part of the sequence", () => {
    const event = pack(
      "event-csection",
      "event",
      0,
      [action({ id: "event-essential", priority: "essential", title: "C-section recovery" })],
      "day",
    );
    const result = catchUp([...ALL, event], w36, []);
    expect(result.items.map((i) => i.actionId)).not.toContain("event-essential");
  });

  it("sorts an unordered pack list before looking back", () => {
    const shuffled = [w36, w8, w30, w12, w28, w20];
    const result = catchUp(shuffled, w36, []);
    expect(result.items.map((i) => i.actionId)).toEqual([
      "w30-essential",
      "w28-essential",
      "w20-essential",
    ]);
  });

  it("honours a custom window and limit", () => {
    const result = catchUp(ALL, w36, [], { window: 5, limit: 1 });
    expect(result.lookedBack).toBe(5);
    expect(result.items).toHaveLength(1);
  });

  it("returns nothing when the current pack is not in the list", () => {
    const stranger = pack("pregnancy-w40", "pregnancy", 40, [
      action({ id: "w40-essential", priority: "essential", title: "Wait" }),
    ]);
    const result = catchUp(ALL, stranger, []);
    expect(result.items).toEqual([]);
    expect(result.empty).toBe(true);
  });

  it("treats a zero limit as nothing to show rather than everything", () => {
    const result = catchUp(ALL, w36, [], { limit: 0 });
    expect(result.items).toEqual([]);
    expect(result.empty).toBe(true);
  });
});

describe("catchUpCandidates", () => {
  it("flattens the window into plain data, most recent stage first", () => {
    const { candidates, lookedBack } = catchUpCandidates(ALL, w36);
    expect(lookedBack).toBe(3);
    expect(candidates.map((c) => c.actionId)).toEqual([
      "w30-essential",
      "w28-essential",
      "w20-essential",
    ]);
    expect(candidates[0]).toEqual({
      actionId: "w30-essential",
      title: "Count the movements",
      why: "Because it matters.",
      priority: "essential",
      packId: "pregnancy-w30",
      packTitle: "pregnancy 30",
      stageLabel: "Week 30",
    });
  });

  it("does not know or care what is done, so the client can filter", () => {
    const { candidates } = catchUpCandidates(ALL, w36);
    expect(candidates).toHaveLength(3);
    const picked = pickCatchUp(candidates, ["w30-essential"]);
    expect(picked.items.map((i) => i.actionId)).toEqual(["w28-essential", "w20-essential"]);
  });

  it("returns nothing at the first stage of the guide", () => {
    expect(catchUpCandidates(ALL, w8)).toEqual({ candidates: [], lookedBack: 0 });
  });

  it("honours a custom window", () => {
    expect(catchUpCandidates(ALL, w36, { window: 1 }).candidates.map((c) => c.actionId)).toEqual([
      "w30-essential",
    ]);
  });
});

describe("pickCatchUp", () => {
  const { candidates } = catchUpCandidates(ALL, w36);

  it("takes at most the limit", () => {
    expect(pickCatchUp(candidates, [], 2).items).toHaveLength(2);
    expect(pickCatchUp(candidates, [], CATCH_UP_LIMIT).items).toHaveLength(3);
  });

  it("treats a skip exactly like a done step", () => {
    const all = ["w30-essential", "w28-essential", "w20-essential"];
    expect(pickCatchUp(candidates, all)).toEqual({ items: [], empty: true });
  });

  it("treats a zero limit as nothing to show rather than everything", () => {
    expect(pickCatchUp(candidates, [], 0)).toEqual({ items: [], empty: true });
  });
});
