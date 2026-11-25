import type { RecallAges, RecallCategory } from "./recalls";

/**
 * Whether an agency's recall is about a thing a parent of a 0–3 year old owns,
 * and what age it applies to.
 *
 * The agencies publish everything: a thermal laminator, a bicycle lock, a
 * six-drawer dresser. A feed that showed all of it would be accurate and
 * useless, so the first question this answers is "is this ours" — and it
 * answers it by looking for the nouns that name the products this guide covers,
 * not for the word "child". "Risk of child poisoning" appears on a fuel can;
 * "crib" does not.
 *
 * The age window is editorial, and it is a guess with a stated basis: a high
 * chair cannot be used before six months, formula is not used after twelve, and
 * a car seat is bought while pregnant. It is deliberately coarse — the window
 * is per kind of product, not per model — because a precise window would be a
 * precision this data does not have.
 *
 * Two of the words below are deliberately not the obvious ones. "Bottle" alone
 * caught a hair-regrowth treatment, and "space heater" caught an appliance
 * nobody buys for a baby, so the feeding rule asks for a baby bottle and the
 * appliance is denied outright. `NOT_OURS` is a shorter list than `RULES` on
 * purpose: it exists for the records that name a product a parent of a small
 * child does not own, not for a second opinion about the ones they do.
 */

interface Rule {
  category: RecallCategory;
  ages: RecallAges;
  /** Lowercase nouns. A trailing "s" is accepted for each, and nothing else. */
  words: string[];
  /**
   * A second, harder condition. Only the food rule uses it: "pouch" and
   * "puree" are what a baby's food comes in and also what an adult's dinner
   * comes in, so a food record has to name a baby to be ours.
   */
  requires?: RegExp;
}

/**
 * Products for an adult body, or for a room, that a hazard sentence makes sound
 * like a child's. "Adult portable bed rails" is the clearest case: the words
 * "bed rail" are ours and the product is not, and the age window would have put
 * it in front of every parent for the whole three years.
 */
const NOT_OURS = [
  "adult",
  "senior",
  "elderly",
  "hair regrowth",
  "minoxidil",
  "space heater",
  "mower",
  "leaf blower",
];

/**
 * Ordered: the first rule that matches wins, so the specific kinds of product
 * come before the categories they sit inside. A "car seat" is travel before it
 * is a seat; a "baby bath seat" is care and never travel.
 */
/**
 * What makes a food recall ours. A pouch is how a baby's food is sold and also
 * how an adult's dinner is sold, so a pouch on its own proves nothing; a puree
 * does, because it is a baby's food and not an adult's. "Child" and "children"
 * are deliberately absent: an FDA reason for recall says "can cause serious
 * reactions in children" about an adult product with an undeclared allergen.
 */
const BABY_FOOD =
  /(?:^|[^a-z0-9])(?:infant|baby|babies|toddler|weaning|breastfed|puree)s?(?:[^a-z0-9]|$)/;

const RULES: Rule[] = [
  {
    category: "travel",
    ages: { fromMonths: -9, toMonths: 24 },
    words: [
      "car seat",
      "car-seat",
      "carseat",
      "travel system",
      "infant carrier",
      "carrier base",
      "booster seat",
      "car seat base",
    ],
  },
  {
    category: "travel",
    ages: { fromMonths: -9, toMonths: 36 },
    words: ["stroller", "pushchair", "pram", "baby carrier", "baby sling", "baby wrap"],
  },
  {
    category: "sleep",
    ages: { fromMonths: 0, toMonths: 6 },
    words: [
      "lounger",
      "baby nest",
      "rocking sleeper",
      "baby swing",
      "bouncer",
      "baby hammock",
      "sleep wedge",
    ],
  },
  {
    category: "sleep",
    ages: { fromMonths: 0, toMonths: 12 },
    words: [
      "crib",
      "cot",
      "bassinet",
      "bedside sleeper",
      "travel crib",
      "play yard",
      "playard",
      "playpen",
      "crib mattress",
      "crib bumper",
      "sleep sack",
      "swaddle",
      "changing table",
      "sleep machine",
      "sound machine",
      "white noise",
    ],
  },
  {
    category: "feeding",
    ages: { fromMonths: 0, toMonths: 12 },
    words: [
      "infant formula",
      "baby formula",
      "follow-on formula",
      "baby bottle",
      "feeding bottle",
      "bottle warmer",
      "breast pump",
      "nursing pillow",
      "breast milk",
    ],
  },
  {
    category: "feeding",
    ages: { fromMonths: 4, toMonths: 36 },
    words: ["high chair", "hook-on chair", "sippy cup", "bib", "baby spoon", "plate and bowl"],
  },
  {
    category: "food",
    ages: { fromMonths: 4, toMonths: 36 },
    requires: BABY_FOOD,
    words: [
      "baby food",
      "puree",
      "pouch",
      "infant cereal",
      "teething biscuit",
      "yogurt melt",
      "toddler snack",
      "baby snack",
    ],
  },
  {
    category: "care",
    ages: { fromMonths: -9, toMonths: 36 },
    words: [
      "diaper",
      "baby wipe",
      "baby lotion",
      "baby shampoo",
      "baby powder",
      "sunscreen",
      "thermometer",
      "nasal aspirator",
      "pacifier",
      "teether",
      "bath seat",
      "baby bath",
      "baby monitor",
      "nail clipper",
      "medicine dropper",
      "humidifier",
    ],
  },
  {
    category: "play",
    ages: { fromMonths: 0, toMonths: 36 },
    words: [
      "toy",
      "rattle",
      "plush",
      "stuffed animal",
      "building block",
      "toy block",
      "puzzle",
      "water bead",
      "magnet",
      "glass marble",
      "ride-on",
      "baby walker",
      "activity board",
      "busy board",
      "teething toy",
      "doll",
      "slime",
      "putty",
      "play mat",
    ],
  },
  {
    category: "home",
    ages: { fromMonths: -9, toMonths: 36 },
    words: [
      "dresser",
      "chest of drawers",
      "bookcase",
      "tv stand",
      "bed rail",
      "safety gate",
      "baby gate",
      "night light",
      "outlet cover",
      "furniture",
      "wardrobe",
    ],
  },
];

/**
 * Whole words only, so "adult" does not fire on "adulthood" and "cot" not on
 * "cotton". A trailing "s" is the only inflection accepted.
 */
function words(list: string[]): RegExp {
  const alternation = list
    .map((word) => `${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?`)
    .join("|");
  return new RegExp(`(?:^|[^a-z0-9])(?:${alternation})(?:[^a-z0-9]|$)`);
}

/** Built once rather than per record: a feed is a few hundred of them. */
const NOT_OURS_PATTERN = words(NOT_OURS);

const PATTERNS = RULES.map((rule) => ({ rule, pattern: words(rule.words) }));

export interface RecallText {
  title: string;
  product?: string;
  hazard?: string;
  description?: string;
}

export interface RecallGuess {
  category: RecallCategory;
  ages: RecallAges;
}

/**
 * The category and age window, or null when this is not a baby product.
 *
 * Only the title, the product name and the hazard are searched. The description
 * is left out on purpose: CPSC descriptions run to several hundred words and
 * mention everything the product is sold next to, so including it turned a
 * thermal laminator into a toy because the page listed a retailer that sells
 * both.
 */
export function classifyRecall(text: RecallText): RecallGuess | null {
  const haystack = [text.title, text.product ?? "", text.hazard ?? ""].join(" \n ").toLowerCase();

  if (NOT_OURS_PATTERN.test(haystack)) return null;

  for (const { rule, pattern } of PATTERNS) {
    if (rule.requires && !rule.requires.test(haystack)) continue;
    if (pattern.test(haystack)) {
      return { category: rule.category, ages: { ...rule.ages } };
    }
  }
  return null;
}
