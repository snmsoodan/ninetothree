import { describe, expect, it } from "vitest";
import { ageInDays, computeStage, daysUntilDue, gestationalDays, stageLabel } from "./stage";

const TODAY = "2026-06-15";

/** A due date exactly `days` away from TODAY. */
function dueIn(days: number): string {
  const d = new Date(Date.UTC(2026, 5, 15));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A birth date exactly `days` before TODAY. */
function bornAgo(days: number): string {
  return dueIn(-days);
}

describe("gestationalDays", () => {
  it("is 280 on the day the due date is 280 days out", () => {
    expect(gestationalDays(dueIn(280), TODAY)).toBe(0);
  });

  it("counts forward as the due date approaches", () => {
    expect(gestationalDays(dueIn(0), TODAY)).toBe(280);
  });

  it("goes past 280 when the due date has passed", () => {
    expect(gestationalDays(dueIn(-14), TODAY)).toBe(294);
  });

  it("rejects a date it cannot parse", () => {
    expect(() => gestationalDays("not-a-date", TODAY)).toThrow(/Invalid date/);
  });
});

describe("computeStage — pregnancy", () => {
  it("reports the week and the day within it", () => {
    // 28 weeks exactly = 196 days of gestation = 84 days until due.
    const stage = computeStage({ status: "pregnant", dueDate: dueIn(84) }, TODAY);
    expect(stage).toMatchObject({ kind: "pregnancy", index: 28, unit: "week", dayInStage: 0 });
    expect(stage.progress).toBe(0);
  });

  it("advances the day within the week", () => {
    const stage = computeStage({ status: "pregnant", dueDate: dueIn(81) }, TODAY);
    expect(stage.index).toBe(28);
    expect(stage.dayInStage).toBe(3);
    expect(stage.progress).toBeCloseTo(3 / 7);
  });

  it("clamps to week 4 before there is anything to say", () => {
    const stage = computeStage({ status: "pregnant", dueDate: dueIn(250) }, TODAY);
    expect(stage.index).toBe(4);
  });

  it("clamps to week 42 when the baby is late", () => {
    const stage = computeStage({ status: "pregnant", dueDate: dueIn(-30) }, TODAY);
    expect(stage.index).toBe(42);
    expect(stage.progress).toBeLessThanOrEqual(1);
  });

  it("never reports progress outside 0–1", () => {
    for (const offset of [-60, -1, 0, 1, 100, 280, 400]) {
      const stage = computeStage({ status: "pregnant", dueDate: dueIn(offset) }, TODAY);
      expect(stage.progress).toBeGreaterThanOrEqual(0);
      expect(stage.progress).toBeLessThanOrEqual(1);
    }
  });
});

describe("computeStage — after birth", () => {
  it("is week 1 on the day of birth", () => {
    const stage = computeStage({ status: "parent", birthDate: bornAgo(0) }, TODAY);
    expect(stage).toMatchObject({ kind: "postpartum", index: 1, unit: "week", dayInStage: 0 });
  });

  it("is week 1 on day six", () => {
    const stage = computeStage({ status: "parent", birthDate: bornAgo(6) }, TODAY);
    expect(stage).toMatchObject({ kind: "postpartum", index: 1, dayInStage: 6 });
  });

  it("is week 2 on day seven", () => {
    const stage = computeStage({ status: "parent", birthDate: bornAgo(7) }, TODAY);
    expect(stage).toMatchObject({ kind: "postpartum", index: 2, dayInStage: 0 });
  });

  it("is week 12 on day 77", () => {
    const stage = computeStage({ status: "parent", birthDate: bornAgo(77) }, TODAY);
    expect(stage).toMatchObject({ kind: "postpartum", index: 12, dayInStage: 0 });
  });

  it("switches to months at day 84", () => {
    const stage = computeStage({ status: "parent", birthDate: bornAgo(84) }, TODAY);
    expect(stage.unit).toBe("month");
    expect(stage.kind).toBe("infant");
    expect(stage.index).toBe(3);
  });

  it("treats a future birth date as day zero rather than a negative week", () => {
    const stage = computeStage({ status: "parent", birthDate: bornAgo(-5) }, TODAY);
    expect(stage).toMatchObject({ kind: "postpartum", index: 1, dayInStage: 0 });
  });

  it("uses calendar months, not 30-day blocks", () => {
    // Born 15 Jan 2026; on 15 Jun 2026 that is exactly five months.
    const stage = computeStage({ status: "parent", birthDate: "2026-01-15" }, TODAY);
    expect(stage.index).toBe(5);
    expect(stage.dayInStage).toBe(0);
  });

  it("does not count a month until the day-of-month is reached", () => {
    // Born 20 Jan 2026; on 15 Jun 2026 the fifth month has not started.
    const stage = computeStage({ status: "parent", birthDate: "2026-01-20" }, TODAY);
    expect(stage.index).toBe(4);
  });

  it("is an infant at twelve months and a toddler at thirteen", () => {
    expect(computeStage({ status: "parent", birthDate: "2025-06-15" }, TODAY).kind).toBe("infant");
    expect(computeStage({ status: "parent", birthDate: "2025-05-15" }, TODAY).kind).toBe("toddler");
  });

  it("reports progress through a month", () => {
    const stage = computeStage({ status: "parent", birthDate: "2026-01-15" }, TODAY);
    expect(stage.progress).toBe(0);
    const mid = computeStage({ status: "parent", birthDate: "2026-01-01" }, TODAY);
    expect(mid.progress).toBeGreaterThan(0);
    expect(mid.progress).toBeLessThan(1);
  });

  it("handles a leap-day birthday", () => {
    const stage = computeStage({ status: "parent", birthDate: "2024-02-29" }, "2026-03-01");
    expect(stage.index).toBeGreaterThanOrEqual(24);
    expect(stage.kind).toBe("toddler");
  });
});

describe("stageLabel", () => {
  it("labels every kind", () => {
    expect(
      stageLabel({ kind: "pregnancy", index: 28, unit: "week", dayInStage: 0, progress: 0 }),
    ).toBe("Week 28");
    expect(
      stageLabel({ kind: "postpartum", index: 3, unit: "week", dayInStage: 0, progress: 0 }),
    ).toBe("Week 3");
    expect(
      stageLabel({ kind: "infant", index: 6, unit: "month", dayInStage: 0, progress: 0 }),
    ).toBe("Month 6");
    expect(
      stageLabel({ kind: "toddler", index: 30, unit: "month", dayInStage: 0, progress: 0 }),
    ).toBe("Month 30");
  });
});

describe("daysUntilDue and ageInDays", () => {
  it("counts down to the due date", () => {
    expect(daysUntilDue(dueIn(10), TODAY)).toBe(10);
    expect(daysUntilDue(dueIn(-3), TODAY)).toBe(-3);
  });

  it("counts up from birth", () => {
    expect(ageInDays(bornAgo(100), TODAY)).toBe(100);
  });
});
