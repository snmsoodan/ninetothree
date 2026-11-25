import { ageInMonths, type StageInput } from "./stage";

/**
 * How a child is fed, and how the question changes with age.
 *
 * The question used to be the same at six days and at two years: four milk
 * options, as if the bottle were still the whole of it. It is not. By two a
 * child eats at the table and drinks from a cup, and a screen that offers
 * "Breastfeeding" and nothing else reads as though nobody built it for them.
 *
 * So the options follow the child's age while the stored value keeps one
 * meaning at every age: is this parent still breastfeeding, or not. That is
 * the only thing any rule reads it for.
 */
export type Feeding = "breast" | "formula" | "both" | "undecided" | "cup";

/**
 * The four shapes the question takes. Pregnancy is separate from the milk
 * band even though the choices are the same, because the wording is not:
 * "How do you plan to feed?" is a different question from "How are you
 * feeding?", and asking the second of someone at week 12 is a small insult.
 */
export type FeedingBand = "pregnancy" | "milk" | "weaning" | "solids";

/** The AAP introduces solids around six months; before that, milk is the diet. */
export const SOLIDS_FROM_MONTHS = 6;
/** Whole milk and a cup replace formula and the bottle around twelve. */
export const CUP_FROM_MONTHS = 12;

export function feedingBand(input: StageInput | null, today: string): FeedingBand {
  if (input === null || input.status === "pregnant") return "pregnancy";
  const months = Math.max(0, ageInMonths(input, today));
  if (months < SOLIDS_FROM_MONTHS) return "milk";
  if (months < CUP_FROM_MONTHS) return "weaning";
  return "solids";
}

export interface FeedingChoice {
  value: Feeding;
  label: string;
}

/**
 * Never more than four. A radio list is a question, and a question with six
 * answers stops being one.
 */
export const FEEDING_CHOICES: Record<FeedingBand, FeedingChoice[]> = {
  pregnancy: [
    { value: "breast", label: "Breastfeeding" },
    { value: "formula", label: "Formula" },
    { value: "both", label: "Both" },
    { value: "undecided", label: "Not decided yet" },
  ],
  milk: [
    { value: "breast", label: "Breastfeeding" },
    { value: "formula", label: "Formula" },
    { value: "both", label: "Both" },
    { value: "undecided", label: "Not decided yet" },
  ],
  weaning: [
    { value: "breast", label: "Breastfeeding, and starting solids" },
    { value: "formula", label: "Formula, and starting solids" },
    { value: "both", label: "Both, and starting solids" },
    { value: "undecided", label: "Still working it out" },
  ],
  solids: [
    { value: "breast", label: "Table food and still breastfeeding" },
    { value: "formula", label: "Table food and formula or toddler milk" },
    { value: "cup", label: "Table food and milk or water from a cup" },
    { value: "both", label: "Table food, breastfeeding and formula" },
  ],
};

export interface FeedingQuestion {
  heading: string;
  note: string;
}

export function feedingQuestion(band: FeedingBand): FeedingQuestion {
  if (band === "pregnancy") {
    return {
      heading: "How do you plan to feed?",
      note: "This only changes what we hide. It never changes what we warn you about.",
    };
  }
  if (band === "milk") {
    return {
      heading: "How are you feeding?",
      note: "This only changes what we hide. It never changes what we warn you about.",
    };
  }
  if (band === "weaning") {
    return {
      heading: "How is feeding going?",
      note: "Milk is still most of it at this age. This only changes what we hide.",
    };
  }
  return {
    heading: "What is your child eating now?",
    note: "Bottles and formula are behind a lot of children by now. This only changes what we hide.",
  };
}

/**
 * Whether breastfeeding support still belongs on this parent's page.
 *
 * Only two answers say no: formula, and a cup. "Both" counts as yes, because
 * a parent doing both is still doing the thing the help is for. "Not
 * decided" counts as yes, because hiding help from someone who has not
 * decided is a way of talking them out of it. An unanswered question counts
 * as yes for the same reason — the cost of showing a step that does not
 * apply is a wasted tap; the cost of hiding one that does is worse.
 */
export function stillBreastfeeding(feeding: Feeding | undefined): boolean {
  return feeding !== "formula" && feeding !== "cup";
}
