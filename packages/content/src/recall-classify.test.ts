import { describe, expect, it } from "vitest";

import { classifyRecall } from "./recall-classify";
import { RECALL_CATEGORIES } from "./recalls";

/**
 * The classifier is the filter between two hundred agency records a quarter and
 * the dozen that could reach a baby. Its two failure modes cost different
 * things: a false negative hides a real recall, a false positive spends a
 * parent's attention on a fuel can. The cases below are taken from real records
 * in the CPSC and FDA registers.
 */
describe("classifyRecall", () => {
  it("reads a car seat as travel, and finds it while pregnant", () => {
    const guess = classifyRecall({
      title: "Graco recalls infant car seats",
      product: "Graco SnugRide infant car seat",
      hazard: "The harness may not hold in a crash.",
    });
    expect(guess).toEqual({ category: "travel", ages: { fromMonths: -9, toMonths: 24 } });
  });

  it("reads a car seat as travel before it reads it as a seat", () => {
    // "car seat" also contains no other rule word, but the ordering matters for
    // the ones that do: a "baby bath seat" must not become travel.
    expect(classifyRecall({ title: "Baby bath seat recall" })?.category).toBe("care");
  });

  it("reads a stroller as travel across the whole range", () => {
    expect(classifyRecall({ title: "UPPAbaby strollers" })?.ages).toEqual({
      fromMonths: -9,
      toMonths: 36,
    });
  });

  it("reads a lounger as sleep, and only for the first months", () => {
    expect(classifyRecall({ title: "The CooCooBaby loungers" })?.ages).toEqual({
      fromMonths: 0,
      toMonths: 6,
    });
  });

  it("reads formula as feeding, and only for the first year", () => {
    const guess = classifyRecall({
      title: "ByHeart whole nutrition infant formula",
      hazard: "Possible botulism contamination.",
    });
    expect(guess?.category).toBe("feeding");
    expect(guess?.ages).toEqual({ fromMonths: 0, toMonths: 12 });
  });

  it("reads a puree pouch as food, which starts at four months", () => {
    expect(classifyRecall({ title: "Peter Rabbit Organics fruit puree pouches" })?.ages).toEqual({
      fromMonths: 4,
      toMonths: 36,
    });
  });

  it("ignores a recall that merely mentions a child", () => {
    // Real CPSC record: a fuel can whose hazard is "risk of child poisoning".
    // The word is in the hazard and the product is not ours.
    expect(
      classifyRecall({
        title: "Briggs & Stratton recalls fuel cans",
        product: "Fuel can",
        hazard: "Risk of child poisoning and burns.",
      }),
    ).toBeNull();
  });

  it("ignores a thermal laminator sold beside toys", () => {
    expect(
      classifyRecall({
        title: "Amazon recalls thermal laminators",
        product: "Thermal laminator",
        hazard: "The cord can overheat.",
      }),
    ).toBeNull();
  });

  it("does not read the description", () => {
    // Descriptions name every retailer and every neighbour on the shelf. The
    // crib here is context, not the product.
    expect(
      classifyRecall({
        title: "A folding table was recalled",
        product: "Folding table",
        hazard: "It can collapse.",
        description: "Sold at stores that also carry cribs, strollers and baby monitors.",
      }),
    ).toBeNull();
  });

  it("accepts the plural of every word it knows", () => {
    expect(classifyRecall({ title: "Cribs recalled" })?.category).toBe("sleep");
    expect(classifyRecall({ title: "High chairs recalled" })?.category).toBe("feeding");
    expect(classifyRecall({ title: "Diapers recalled" })?.category).toBe("care");
  });

  it("needs a whole word, not a fragment of one", () => {
    // "cot" inside "cotton", "bib" inside "bible", "toy" inside "toyota".
    expect(classifyRecall({ title: "Cotton swabs recalled" })).toBeNull();
    expect(classifyRecall({ title: "A bible was misprinted" })).toBeNull();
    expect(classifyRecall({ title: "Toyota vehicles recalled" })).toBeNull();
  });

  it("finds the word at either end of the string", () => {
    expect(classifyRecall({ title: "Crib" })?.category).toBe("sleep");
    expect(classifyRecall({ title: "Recall of a crib" })?.category).toBe("sleep");
  });

  it("reads the product and the hazard, not just the title", () => {
    expect(classifyRecall({ title: "A recall", product: "Wooden high chair" })?.category).toBe(
      "feeding",
    );
    expect(
      classifyRecall({ title: "A recall", hazard: "Choking hazard from a rattle" })?.category,
    ).toBe("play");
  });

  it("is not confused by case", () => {
    expect(classifyRecall({ title: "STROLLER RECALL" })?.category).toBe("travel");
  });

  it("only ever answers with a category the schema allows", () => {
    for (const title of [
      "crib",
      "stroller",
      "infant formula",
      "puree pouch",
      "diaper",
      "toy",
      "dresser",
    ]) {
      const guess = classifyRecall({ title });
      expect(guess).not.toBeNull();
      expect(RECALL_CATEGORIES).toContain(guess?.category);
    }
  });

  it("gives every window a start at or before its end", () => {
    for (const title of [
      "crib",
      "stroller",
      "infant formula",
      "puree pouch",
      "diaper",
      "toy",
      "dresser",
    ]) {
      const ages = classifyRecall({ title })?.ages;
      expect(ages?.fromMonths).toBeLessThanOrEqual(ages?.toMonths ?? 0);
      expect(ages?.fromMonths).toBeGreaterThanOrEqual(-9);
      expect(ages?.toMonths).toBeLessThanOrEqual(36);
    }
  });

  it("leaves an adult product alone, even when the words are ours", () => {
    // Real CPSC records. "bed rail" and "bottle" are words this classifier
    // looks for, and both of these would have reached every parent for three
    // years under the wrong one.
    expect(
      classifyRecall({
        title:
          "Xentrawave Recalls Adult Portable Bed Rails Due to Risk of Serious Injury or Death from Entrapment",
        product: "Adult portable bed rails",
        hazard: "A child can become entrapped between the rail and the mattress.",
      }),
    ).toBeNull();
    expect(
      classifyRecall({
        title:
          "RootStim Recalls Minoxidil Hair Regrowth Treatment Bottles Due to Risk of Serious Injury or Death from Child Poisoning",
        product: "Minoxidil hair regrowth treatment, 60 mL bottle",
        hazard: "The bottle lacks a child-resistant closure.",
      }),
    ).toBeNull();
    expect(
      classifyRecall({ title: "DREO Recalls DR-HSH015 Space Heaters Due to Fire Hazard" }),
    ).toBeNull();
  });

  it("asks for a baby bottle, not a bottle", () => {
    expect(classifyRecall({ title: "Baby bottle warmer recall" })?.category).toBe("feeding");
    expect(classifyRecall({ title: "Stainless steel water bottle recall" })).toBeNull();
  });

  it("does not read an electric balloon pump as a toy", () => {
    expect(
      classifyRecall({ title: "Dollar Tree Recalls Electric Balloon Pumps Due to Burn Hazard" }),
    ).toBeNull();
  });

  it("reads a sound machine as sleep, not as a night light", () => {
    // The CPSC product name is "Portable Sleep Machines with Night Light", and
    // "night light" is a home word, so the specific rule has to come first.
    expect(
      classifyRecall({
        title: "Love To Dream Recalls Portable Sleep Machines Due to Risk of Injury from Fire",
        product: "Portable Sleep Machines with Night Light model number LTD-SM23",
      })?.category,
    ).toBe("sleep");
  });

  it("does not read an adult herbal supplement as infant formula", () => {
    expect(
      classifyRecall({
        title:
          "Byron White Formulas, Inc. recalls Byron White FORMULAS A-FNG Herbal Supplement 1.0 fl. oz.",
        product: "Byron White FORMULAS A-FNG Herbal Supplement",
        hazard: "May contain nuts.",
      }),
    ).toBeNull();
    expect(classifyRecall({ title: "Infant formula recall" })?.category).toBe("feeding");
  });

  it("wants a puree before calling a pouch baby food", () => {
    // Real FDA records. Both are food in a pouch; only one is a baby's.
    expect(
      classifyRecall({
        title: "DARING FOODS INC recalls Plant Steak Bites, Ready in 4 Mins Microwaveable Pouch",
        product: "Daring; Plant Steak Bites; Microwaveable Pouch",
        hazard: "Undeclared milk, which can cause serious reactions in children.",
      }),
    ).toBeNull();
    expect(
      classifyRecall({
        title:
          "PT Organics Limited recalls Peter Rabbit Organics Banana & Strawberry fruit puree pouch",
        product: "Banana & Strawberry fruit puree, 4oz/113g pouch",
      })?.category,
    ).toBe("food");
  });

  it("does not read a block of cheese as a building block, or a shelf life as a shelf", () => {
    expect(
      classifyRecall({
        title:
          "Clover Hill Dairy recalls mild cheese, Snack Pack Assorted Regular Mild Stix, 1 lb block",
      }),
    ).toBeNull();
    expect(
      classifyRecall({
        title: "Fromagerie recalls Cabricharme, Shelf life: 30 days, all dates",
      }),
    ).toBeNull();
    expect(classifyRecall({ title: "Wooden building blocks recalled" })?.category).toBe("play");
  });

  it("returns a fresh object, so a caller cannot edit the rule", () => {
    const first = classifyRecall({ title: "crib" });
    if (first) first.ages.toMonths = 99;
    expect(classifyRecall({ title: "crib" })?.ages.toMonths).toBe(12);
  });
});
