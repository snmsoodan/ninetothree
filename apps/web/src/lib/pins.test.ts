import { describe, expect, it } from "vitest";
import { TEST_ACTION_INDEX } from "@/test-fixtures";
import { resolvePins } from "./pins";
import type { Pin } from "./store";

const packs = TEST_ACTION_INDEX;

const pin = (overrides: Partial<Pin> = {}): Pin => ({
  id: "t-glucose",
  title: "A title from an older release",
  packId: "pregnancy-w28",
  packTitle: "Week 28",
  at: "2026-10-20T00:00:00.000Z",
  ...overrides,
});

describe("resolvePins", () => {
  it("prefers the live content when the action still exists", () => {
    const [resolved] = resolvePins([pin()], packs);
    expect(resolved?.title).toBe("Book your glucose screening");
    expect(resolved?.packId).toBe("test-week");
    expect(resolved?.stale).toBe(false);
  });

  it("falls back to the snapshot when the action is gone", () => {
    const [resolved] = resolvePins([pin({ id: "retired-action" })], packs);
    expect(resolved).toEqual({
      id: "retired-action",
      title: "A title from an older release",
      packId: "pregnancy-w28",
      packTitle: "Week 28",
      stale: true,
    });
  });

  it("carries a reminder day through for a live pin", () => {
    const [resolved] = resolvePins([pin({ remindOn: "2026-11-01" })], packs);
    expect(resolved?.remindOn).toBe("2026-11-01");
  });

  it("carries a reminder day through for a retired pin", () => {
    const [resolved] = resolvePins([pin({ id: "retired-action", remindOn: "2026-11-01" })], packs);
    expect(resolved?.remindOn).toBe("2026-11-01");
  });

  it("leaves the reminder off when there is none", () => {
    const [resolved] = resolvePins([pin()], packs);
    expect(resolved).not.toHaveProperty("remindOn");
  });

  it("drops a legacy pin that has neither an action nor a snapshot", () => {
    expect(resolvePins([pin({ id: "retired-action", title: "" })], packs)).toEqual([]);
  });

  it("keeps the stored order", () => {
    const resolved = resolvePins(
      [pin({ id: "t-tdap" }), pin({ id: "t-glucose" }), pin({ id: "t-car-seat" })],
      packs,
    );
    expect(resolved.map((p) => p.id)).toEqual(["t-tdap", "t-glucose", "t-car-seat"]);
  });

  it("returns nothing for an empty shelf", () => {
    expect(resolvePins([], packs)).toEqual([]);
  });
});
