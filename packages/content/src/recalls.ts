import { z } from "zod";
import { Source } from "./schema";

/**
 * A recall has two halves, and they come from different places.
 *
 * The **fact** comes from an agency: CPSC and the FDA publish what was recalled
 * and when, and `apps/web` polls both registers. The **advice** comes from us:
 * what a parent should actually do, in one sentence, and which step or choice
 * it touches. Discovery is live; the writing is not, and should not be — no
 * register can tell a parent whether the cot in the spare room is one of these.
 *
 * So the same shape covers both. A live record is normalized into this schema
 * with an empty `matches` and an age window from `classifyRecall`, and
 * `mergeRecalls` lets the nine curated entries win any collision, which is how a
 * parent ends up reading a sentence a person wrote rather than a remedy clause.
 */

export const RECALL_SEVERITIES = ["stop-use", "check", "info"] as const;
export type RecallSeverity = (typeof RECALL_SEVERITIES)[number];

/** How a recall came to be about this parent. Strongest first. */
export const RECALL_BECAUSES = ["option", "step", "keyword"] as const;
export type RecallBecause = (typeof RECALL_BECAUSES)[number];

/**
 * What kind of thing was recalled.
 *
 * Deliberately coarse. A parent scanning updates wants to know whether this is
 * about the cot, the car or the food, and a longer list would only produce
 * categories with one entry in them.
 */
export const RECALL_CATEGORIES = [
  "sleep",
  "feeding",
  "food",
  "travel",
  "play",
  "care",
  "home",
] as const;
export type RecallCategory = (typeof RECALL_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<RecallCategory, string> = {
  sleep: "Sleep",
  feeding: "Feeding",
  food: "Food",
  travel: "Travel",
  play: "Play",
  care: "Care",
  home: "Home",
};

/**
 * The ages a recall applies to, in months.
 *
 * Signed, and negative means before birth: `-9` is the start of the third
 * trimester, `0` is the due date, and `36` is the third birthday. A car seat
 * bought at 16 weeks and a cot bought at 30 weeks both need to be in the window
 * before the baby exists, which is why this is not simply an age.
 */
export const RecallAges = z
  .object({
    fromMonths: z.number().int().min(-9).max(36),
    toMonths: z.number().int().min(-9).max(36),
  })
  .refine((a) => a.toMonths >= a.fromMonths, "the age window ends before it starts");
export type RecallAges = z.infer<typeof RecallAges>;

/** Stop-use first, then check, then info. Used for ordering, not for hiding. */
export const RECALL_SEVERITY_RANK: Record<RecallSeverity, number> = {
  "stop-use": 0,
  check: 1,
  info: 2,
};

const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ids are kebab-case")
  .min(3)
  .max(60);

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dates are YYYY-MM-DD");

/**
 * What a recall is about, in the app's own vocabulary.
 *
 * `optionIds` is the strongest signal: the parent picked this exact thing in a
 * chooser. `actionIds` is a step they pinned. `keywords` is a word in the title
 * of a step they pinned, for a recall that is about a category rather than a
 * named product.
 *
 * All three can be empty. A recall pulled from an agency feed knows nothing
 * about what this particular parent owns, so it reaches them through `ages`
 * instead — and an empty match is the honest way to say "we are not claiming
 * you have this".
 */
export const RecallMatches = z.object({
  optionIds: z.array(Id).max(8).default([]),
  actionIds: z.array(Id).max(8).default([]),
  keywords: z.array(z.string().min(3).max(30)).max(8).default([]),
});
export type RecallMatches = z.infer<typeof RecallMatches>;

export const Recall = z.object({
  id: Id,
  /** The recall in the parent's words, not the agency's. Under 120 characters. */
  title: z.string().min(1).max(120),
  /** What the thing is. Under 80 characters. */
  product: z.string().min(1).max(80),
  brand: z.string().min(1).max(60).optional(),
  /** What kind of thing it is, for the chips on the updates page. */
  category: z.enum(RECALL_CATEGORIES),
  /** What can happen. Plain words, no adjectives. Under 240 characters. */
  hazard: z.string().min(1).max(240),
  /** What to do about it. Under 400 characters. */
  action: z.string().min(1).max(400),
  severity: z.enum(RECALL_SEVERITIES),
  /** The months this applies to. Signed; negative is before birth. */
  ages: RecallAges,
  /** The day the agency published it. */
  publishedAt: IsoDate,
  source: Source,
  /**
   * Other addresses the same recall is published at.
   *
   * An agency often says one thing twice: the FDA writes a recall notice in
   * sentences and files the same event in its enforcement database under a
   * product description. Both are true and both are the same recall, so a
   * curated entry lists the second address here and the live record collapses
   * into it rather than appearing beside it.
   */
  alsoAt: z.array(z.string().url()).max(4).optional(),
  matches: RecallMatches.default({}),
});
export type Recall = z.infer<typeof Recall>;

export interface RecallIssue {
  recallId: string;
  path: string;
  message: string;
}

/**
 * Structural problems a schema cannot see: two recalls with the same id, and a
 * publish date in the future, which is always a typo.
 */
export function recallIssues(recalls: Recall[], today: string): RecallIssue[] {
  const issues: RecallIssue[] = [];
  const seen = new Set<string>();

  for (const recall of recalls) {
    if (seen.has(recall.id)) {
      issues.push({
        recallId: recall.id,
        path: "id",
        message: "two recalls share this id",
      });
    }
    seen.add(recall.id);

    if (recall.publishedAt > today) {
      issues.push({
        recallId: recall.id,
        path: "publishedAt",
        message: `published ${recall.publishedAt}, which is in the future`,
      });
    }
  }

  return issues;
}

export function loadRecalls(raw: unknown[]): { recalls: Recall[]; issues: RecallIssue[] } {
  const recalls: Recall[] = [];
  const issues: RecallIssue[] = [];

  raw.forEach((entry, index) => {
    const parsed = Recall.safeParse(entry);
    if (parsed.success) {
      recalls.push(parsed.data);
      return;
    }
    const recallId =
      typeof entry === "object" && entry !== null && "id" in entry && typeof entry.id === "string"
        ? entry.id
        : `(recall ${index})`;
    for (const issue of parsed.error.issues) {
      issues.push({ recallId, path: issue.path.join(".") || "(root)", message: issue.message });
    }
  });

  return { recalls, issues };
}

export function assertValidRecalls(raw: unknown[], today: string): Recall[] {
  const { recalls, issues } = loadRecalls(raw);
  const all = [...issues, ...recallIssues(recalls, today)];
  if (all.length > 0) {
    const lines = all.map((i) => `  ${i.recallId} → ${i.path}: ${i.message}`);
    throw new Error(`recall feed is not valid:\n${lines.join("\n")}`);
  }
  return recalls;
}

/** What the app knows about a parent, as far as a recall is concerned. */
export interface RecallSubject {
  /** The option the parent chose, keyed by action id. */
  choices: Record<string, { optionId: string }>;
  /** The steps the parent pinned, with the title they were pinned under. */
  pins: { id: string; title: string }[];
}

export interface RecallMatch {
  recall: Recall;
  because: RecallBecause;
  /** The option id, the action id, or the keyword that made the match. */
  matchedOn: string;
}

const STRENGTH: Record<RecallBecause, number> = { option: 3, step: 2, keyword: 1 };

/**
 * Every recall that is about something this parent has, strongest reason first.
 *
 * One match per recall: a parent who pinned the high chair step and also chose
 * a chair in it should see one notice, not two.
 */
export function matchRecalls(recalls: Recall[], subject: RecallSubject): RecallMatch[] {
  const chosen = new Set(Object.values(subject.choices).map((c) => c.optionId));
  const pinnedIds = new Set(subject.pins.map((p) => p.id));
  const pinnedTitles = subject.pins.map((p) => p.title.toLowerCase());

  const matches: RecallMatch[] = [];

  for (const recall of recalls) {
    const candidates: RecallMatch[] = [];

    for (const optionId of recall.matches.optionIds) {
      if (chosen.has(optionId)) {
        candidates.push({ recall, because: "option", matchedOn: optionId });
      }
    }
    for (const actionId of recall.matches.actionIds) {
      if (pinnedIds.has(actionId)) {
        candidates.push({ recall, because: "step", matchedOn: actionId });
      }
    }
    for (const keyword of recall.matches.keywords) {
      const needle = keyword.toLowerCase();
      if (pinnedTitles.some((title) => title.includes(needle))) {
        candidates.push({ recall, because: "keyword", matchedOn: keyword });
      }
    }

    if (candidates.length === 0) continue;

    candidates.sort((a, b) => STRENGTH[b.because] - STRENGTH[a.because]);
    const best = candidates[0] as RecallMatch;
    matches.push(best);
  }

  return matches.sort((a, b) => b.recall.publishedAt.localeCompare(a.recall.publishedAt));
}

/**
 * The key a notice is stored under.
 *
 * It carries the reason as well as the recall, so a parent who dismisses a
 * notice about a pinned step still gets one if they later choose the exact
 * product that was recalled.
 */
export function recallKey(match: RecallMatch): string {
  return `${match.recall.id}:${match.matchedOn}`;
}

/** Whether a recall's window covers this age, in months. Inclusive both ends. */
export function isForAge(recall: Recall, months: number): boolean {
  return months >= recall.ages.fromMonths && months <= recall.ages.toMonths;
}

/**
 * The recalls that apply at this age, most serious first and then newest.
 *
 * This is the second filter, and it is deliberately independent of what the
 * parent has pinned: a car-seat recall is worth knowing at 16 weeks whether or
 * not they told us they were looking at car seats.
 */
export function recallsForAge(recalls: Recall[], months: number): Recall[] {
  return recalls
    .filter((recall) => isForAge(recall, months))
    .sort(
      (a, b) =>
        RECALL_SEVERITY_RANK[a.severity] - RECALL_SEVERITY_RANK[b.severity] ||
        b.publishedAt.localeCompare(a.publishedAt),
    );
}

/** "Before birth", "Birth to 6 months", "6 months to 3 years". */
export function ageWindowLabel(ages: RecallAges): string {
  const { fromMonths: from, toMonths: to } = ages;
  if (to <= 0) return "Before birth";
  const start = from <= 0 ? "Birth" : `${from} months`;
  const end = to >= 36 ? "3 years" : `${to} months`;
  return `${start} to ${end}`;
}

/**
 * Two records of the same recall, from different places.
 *
 * The curated feed and an agency feed both know about the same event, and the
 * parent should see it once. Identity is the id when the ids were derived from
 * the agency's own number, the URL when both point at the same page, a curated
 * `alsoAt` when the curator knows the second address, and otherwise the product:
 * a curated entry is written by hand and rarely reuses
 * the agency's wording, so `cpsc-26099` from the seed and `cpsc-26099` from the
 * CPSC API collapse, while "CooCooBaby baby loungers" from the seed and the
 * same product from the API collapse on the words they share.
 */
export function sameRecall(a: Recall, b: Recall): boolean {
  if (a.id === b.id) return true;
  if (a.source.url === b.source.url) return true;
  if (a.alsoAt?.includes(b.source.url) || b.alsoAt?.includes(a.source.url)) return true;
  return productWords(a.product) === productWords(b.product) && productWords(a.product) !== "";
}

const PRODUCT_STOPWORDS = new Set([
  "and",
  "the",
  "for",
  "with",
  "recall",
  "recalls",
  "baby",
  "infant",
  "children",
  "child",
  "toddler",
  "kids",
]);

function productWords(product: string): string {
  return product
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 2 && !PRODUCT_STOPWORDS.has(word))
    .sort()
    .join(" ");
}

/**
 * The curated feed, then whatever the agencies published that it does not
 * already cover.
 *
 * Curated wins, and that is deliberate: its action is a sentence a person
 * wrote for a parent, and the agency's remedy text is a paragraph of legal
 * prose. The feed supplies discovery; the curated entry supplies the advice.
 */
export function mergeRecalls(curated: Recall[], live: Recall[]): Recall[] {
  const merged = [...curated];
  for (const recall of live) {
    if (merged.some((existing) => sameRecall(existing, recall))) continue;
    merged.push(recall);
  }
  return merged;
}
