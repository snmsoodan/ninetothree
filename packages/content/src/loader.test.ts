import { describe, expect, it } from "vitest";
import {
  assertValidPacks,
  findPackForStage,
  loadPacks,
  nextPack,
  previousPack,
  sortPacks,
} from "./loader";
import { PACKS, PACKS_BY_ID, getPack } from "./registry";
import type { StagePack } from "./schema";
import { validPack } from "./schema.test";

function pack(overrides: Record<string, unknown>): StagePack {
  return {
    id: "p",
    kind: "pregnancy",
    stageIndex: 1,
    stageUnit: "week",
    locale: "en-US",
    country: "US",
    title: "T",
    coreActions: [
      {
        id: "a",
        type: "do",
        priority: "recommended",
        domain: "health-parent",
        title: "Do a thing",
        why: "Because.",
        options: [],
      },
    ],
    alsoKnow: [],
    redFlags: [{ id: "rf", text: "Something.", escalation: "call-911" }],
    appointments: [],
    sources: [
      {
        id: "s",
        title: "S",
        publisher: "P",
        url: "https://example.com/",
        kind: "clinical",
        accessed: "2026-01-01",
      },
    ],
    reviewedBy: "R",
    reviewedAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  } as StagePack;
}

describe("loadPacks", () => {
  it("returns valid packs and no issues", () => {
    const result = loadPacks([validPack()]);
    expect(result.issues).toEqual([]);
    expect(result.packs).toHaveLength(1);
  });

  it("collects every issue from a broken pack instead of throwing", () => {
    const result = loadPacks([validPack({ redFlags: [], sources: [] })]);
    expect(result.packs).toEqual([]);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
    expect(result.issues[0]?.packId).toBe("pregnancy-w28");
  });

  it("keeps the good packs when one is broken", () => {
    const result = loadPacks([validPack(), validPack({ id: "broken", redFlags: [] })]);
    expect(result.packs).toHaveLength(1);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("names the pack in every issue", () => {
    const result = loadPacks([validPack({ id: "pregnancy-w28", redFlags: [] })]);
    expect(result.issues.every((i) => i.packId === "pregnancy-w28")).toBe(true);
  });

  it("reports a root path when the failure is not on a field", () => {
    const result = loadPacks(["not a pack"]);
    expect(result.issues[0]?.packId).toBe("<unknown>");
    expect(result.issues[0]?.path).toBe("<root>");
  });

  it("reports a field path when the failure is on a field", () => {
    const result = loadPacks([validPack({ locale: "nope" })]);
    expect(result.issues[0]?.path).toBe("locale");
  });

  it("returns packs in chronological order", () => {
    const result = loadPacks([
      pack({ id: "week-20", stageIndex: 20 }),
      pack({ id: "week-08", stageIndex: 8 }),
    ]);
    expect(result.packs.map((p) => p.id)).toEqual(["week-08", "week-20"]);
  });
});

describe("sortPacks", () => {
  it("orders pregnancy, then postpartum, then infant, then toddler, then event", () => {
    const sorted = sortPacks([
      pack({ id: "e", kind: "event", stageIndex: 0 }),
      pack({ id: "t", kind: "toddler", stageIndex: 30 }),
      pack({ id: "i", kind: "infant", stageIndex: 6 }),
      pack({ id: "pp", kind: "postpartum", stageIndex: 1 }),
      pack({ id: "pr", kind: "pregnancy", stageIndex: 28 }),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["pr", "pp", "i", "t", "e"]);
  });

  it("orders by stage index within a kind", () => {
    const sorted = sortPacks([
      pack({ id: "w36", stageIndex: 36 }),
      pack({ id: "w8", stageIndex: 8 }),
      pack({ id: "w20", stageIndex: 20 }),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["w8", "w20", "w36"]);
  });

  it("breaks ties by id so the order is stable", () => {
    const sorted = sortPacks([
      pack({ id: "week-b", stageIndex: 8 }),
      pack({ id: "week-a", stageIndex: 8 }),
    ]);
    expect(sorted.map((p) => p.id)).toEqual(["week-a", "week-b"]);
  });

  it("does not mutate the input", () => {
    const input = [pack({ id: "week-20", stageIndex: 20 }), pack({ id: "week-08", stageIndex: 8 })];
    sortPacks(input);
    expect(input.map((p) => p.id)).toEqual(["week-20", "week-08"]);
  });
});

describe("assertValidPacks", () => {
  it("returns the packs when everything is valid", () => {
    expect(assertValidPacks([validPack()])).toHaveLength(1);
  });

  it("throws with every problem listed", () => {
    expect(() => assertValidPacks([validPack({ redFlags: [], sources: [] })])).toThrow(
      /Invalid stage packs:/,
    );
  });

  it("names the pack and the field in the error", () => {
    expect(() => assertValidPacks([validPack({ locale: "nope" })])).toThrow(
      /pregnancy-w28 → locale/,
    );
  });
});

describe("findPackForStage", () => {
  const packs = [
    pack({ id: "w8", stageIndex: 8 }),
    pack({ id: "w20", stageIndex: 20 }),
    pack({ id: "w36", stageIndex: 36 }),
  ];

  it("finds the exact pack", () => {
    expect(findPackForStage(packs, "pregnancy", 20)?.id).toBe("w20");
  });

  it("falls back to the nearest earlier pack", () => {
    expect(findPackForStage(packs, "pregnancy", 25)?.id).toBe("w20");
  });

  it("returns undefined before the first pack", () => {
    expect(findPackForStage(packs, "pregnancy", 4)).toBeUndefined();
  });

  it("returns undefined for a kind with no packs", () => {
    expect(findPackForStage(packs, "toddler", 30)).toBeUndefined();
  });
});

describe("nextPack and previousPack", () => {
  const packs = [
    pack({ id: "w8", stageIndex: 8 }),
    pack({ id: "w20", stageIndex: 20 }),
    pack({ id: "w36", stageIndex: 36 }),
    pack({ id: "pp1", kind: "postpartum", stageIndex: 1 }),
  ];

  it("walks forward within a kind", () => {
    expect(nextPack(packs, packs[0]!)?.id).toBe("w20");
  });

  it("stops at the end of a kind rather than crossing into the next", () => {
    expect(nextPack(packs, packs[2]!)).toBeUndefined();
  });

  it("walks backward within a kind", () => {
    expect(previousPack(packs, packs[1]!)?.id).toBe("w8");
  });

  it("stops at the start of a kind", () => {
    expect(previousPack(packs, packs[0]!)).toBeUndefined();
  });

  it("returns undefined for a pack that is not in the list", () => {
    const stranger = pack({ id: "nope", stageIndex: 99 });
    expect(nextPack(packs, stranger)).toBeUndefined();
    expect(previousPack(packs, stranger)).toBeUndefined();
  });
});

describe("the shipped registry", () => {
  it("loads every pack without an issue", () => {
    expect(PACKS.length).toBeGreaterThan(0);
  });

  it("is in chronological order", () => {
    const kinds = PACKS.map((p) => p.kind);
    const order = ["pregnancy", "postpartum", "infant", "toddler", "event"];
    const ranks = kinds.map((k) => order.indexOf(k));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("indexes every pack by id", () => {
    expect(PACKS_BY_ID.size).toBe(PACKS.length);
    for (const p of PACKS) expect(getPack(p.id)).toBe(p);
  });

  it("returns undefined for an unknown id", () => {
    expect(getPack("does-not-exist")).toBeUndefined();
  });

  it("gives every pack at most one essential action", () => {
    for (const p of PACKS) {
      expect(p.coreActions.filter((a) => a.priority === "essential").length).toBeLessThanOrEqual(1);
    }
  });

  it("gives every pack at least one red flag and one source", () => {
    for (const p of PACKS) {
      expect(p.redFlags.length).toBeGreaterThanOrEqual(1);
      expect(p.sources.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("is US-first", () => {
    for (const p of PACKS) {
      expect(p.locale).toBe("en-US");
      expect(p.country).toBe("US");
    }
  });

  it("has no duplicate ids across the whole registry", () => {
    const ids = PACKS.flatMap((p) => p.coreActions.map((a) => a.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
