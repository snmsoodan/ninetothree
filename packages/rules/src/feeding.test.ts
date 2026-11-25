import { describe, expect, it } from "vitest";

import {
  CUP_FROM_MONTHS,
  FEEDING_CHOICES,
  SOLIDS_FROM_MONTHS,
  feedingBand,
  feedingQuestion,
  stillBreastfeeding,
  type Feeding,
} from "./feeding";

const TODAY = "2026-06-15";

/** A birth date that lands the child exactly `months` old on TODAY. */
function bornMonthsAgo(months: number): string {
  const base = new Date(`${TODAY}T00:00:00Z`);
  base.setUTCMonth(base.getUTCMonth() - months);
  return base.toISOString().slice(0, 10);
}

function parent(months: number) {
  return { status: "parent" as const, birthDate: bornMonthsAgo(months) };
}

describe("feedingBand", () => {
  it("treats no answer and pregnancy the same, because the question is the same", () => {
    expect(feedingBand(null, TODAY)).toBe("pregnancy");
    expect(feedingBand({ status: "pregnant", dueDate: "2026-12-01" }, TODAY)).toBe("pregnancy");
  });

  it("stays in the milk band up to the month before solids", () => {
    expect(feedingBand(parent(0), TODAY)).toBe("milk");
    expect(feedingBand(parent(SOLIDS_FROM_MONTHS - 1), TODAY)).toBe("milk");
  });

  it("moves to weaning on the solids month and holds it until the cup", () => {
    expect(feedingBand(parent(SOLIDS_FROM_MONTHS), TODAY)).toBe("weaning");
    expect(feedingBand(parent(CUP_FROM_MONTHS - 1), TODAY)).toBe("weaning");
  });

  it("is solids from twelve months on, including a two-year-old", () => {
    expect(feedingBand(parent(CUP_FROM_MONTHS), TODAY)).toBe("solids");
    expect(feedingBand(parent(24), TODAY)).toBe("solids");
    expect(feedingBand(parent(36), TODAY)).toBe("solids");
  });

  it("does not go negative for a due date that has not arrived while the status still says parent", () => {
    expect(feedingBand({ status: "parent", birthDate: "2026-07-01" }, TODAY)).toBe("milk");
  });
});

describe("feeding choices", () => {
  it("never offers more than four, because more than four stops being a question", () => {
    for (const band of ["pregnancy", "milk", "weaning", "solids"] as const) {
      expect(FEEDING_CHOICES[band].length).toBeLessThanOrEqual(4);
      expect(FEEDING_CHOICES[band].length).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps the stored values stable across every band that reuses them", () => {
    for (const band of ["pregnancy", "milk", "weaning"] as const) {
      expect(FEEDING_CHOICES[band].map((c) => c.value)).toEqual([
        "breast",
        "formula",
        "both",
        "undecided",
      ]);
    }
  });

  it("only introduces the cup once a child is old enough for one", () => {
    expect(FEEDING_CHOICES.pregnancy.some((c) => c.value === "cup")).toBe(false);
    expect(FEEDING_CHOICES.milk.some((c) => c.value === "cup")).toBe(false);
    expect(FEEDING_CHOICES.weaning.some((c) => c.value === "cup")).toBe(false);
    expect(FEEDING_CHOICES.solids.some((c) => c.value === "cup")).toBe(true);
  });

  it("describes food as well as milk for a two-year-old, not just milk", () => {
    for (const choice of FEEDING_CHOICES.solids) {
      expect(choice.label.toLowerCase()).toMatch(/food|eating/);
    }
  });

  it("has a unique value for every option in a band", () => {
    for (const band of ["pregnancy", "milk", "weaning", "solids"] as const) {
      const values = FEEDING_CHOICES[band].map((c) => c.value);
      expect(new Set(values).size).toBe(values.length);
    }
  });
});

describe("feedingQuestion", () => {
  it("asks about a plan before the birth and about the present after it", () => {
    expect(feedingQuestion("pregnancy").heading).toBe("How do you plan to feed?");
    expect(feedingQuestion("milk").heading).toBe("How are you feeding?");
  });

  it("changes the question again when solids start and when milk steps back", () => {
    expect(feedingQuestion("weaning").heading).toBe("How is feeding going?");
    expect(feedingQuestion("solids").heading).toBe("What is your child eating now?");
  });

  it("gives every band a note rather than leaving the heading bare", () => {
    for (const band of ["pregnancy", "milk", "weaning", "solids"] as const) {
      expect(feedingQuestion(band).note.length).toBeGreaterThan(20);
    }
  });

  it("always says the answer only removes steps, never a warning", () => {
    expect(feedingQuestion("pregnancy").note).toContain("warn");
    expect(feedingQuestion("solids").note).toContain("hide");
  });
});

describe("stillBreastfeeding", () => {
  it("says no only for formula and for a cup", () => {
    expect(stillBreastfeeding("formula")).toBe(false);
    expect(stillBreastfeeding("cup")).toBe(false);
  });

  it("says yes for breastfeeding and for both, because both is still doing it", () => {
    expect(stillBreastfeeding("breast")).toBe(true);
    expect(stillBreastfeeding("both")).toBe(true);
  });

  it("says yes when undecided, so help is never hidden from someone deciding", () => {
    expect(stillBreastfeeding("undecided")).toBe(true);
  });

  it("says yes when unanswered, so a skipped question hides nothing", () => {
    expect(stillBreastfeeding(undefined)).toBe(true);
  });

  it("has an answer for every stored value", () => {
    const values: Feeding[] = ["breast", "formula", "both", "undecided", "cup"];
    for (const value of values) {
      expect(typeof stillBreastfeeding(value)).toBe("boolean");
    }
  });
});
