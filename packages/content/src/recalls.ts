import { z } from "zod";
import { Source } from "./schema";

/**
 * A recall is content, not a feed.
 *
 * There is no backend, no cron and no email transport in this product, so a
 * "daily sync" cannot be built honestly. What can be built is the part that
 * matters to a parent: a small, reviewed set of recalls, each one saying which
 * step or which choice it touches, and a matcher that tells a parent when one
 * of them is about something they already have.
 *
 * The feed is a seed. A scheduled job that pulls the CPSC API belongs with the
 * backend epic, and the notice queue below is what that job would write into.
 */

export const RECALL_SEVERITIES = ["stop-use", "check", "info"] as const;
export type RecallSeverity = (typeof RECALL_SEVERITIES)[number];

/** How a recall came to be about this parent. Strongest first. */
export const RECALL_BECAUSES = ["option", "step", "keyword"] as const;
export type RecallBecause = (typeof RECALL_BECAUSES)[number];

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
 */
export const RecallMatches = z
  .object({
    optionIds: z.array(Id).max(8).default([]),
    actionIds: z.array(Id).max(8).default([]),
    keywords: z.array(z.string().min(3).max(30)).max(8).default([]),
  })
  .refine(
    (m) => m.optionIds.length + m.actionIds.length + m.keywords.length > 0,
    "a recall that matches nothing can never reach a parent",
  );
export type RecallMatches = z.infer<typeof RecallMatches>;

export const Recall = z.object({
  id: Id,
  /** The recall in the parent's words, not the agency's. Under 120 characters. */
  title: z.string().min(1).max(120),
  /** What the thing is. Under 80 characters. */
  product: z.string().min(1).max(80),
  brand: z.string().min(1).max(60).optional(),
  /** What can happen. Plain words, no adjectives. Under 240 characters. */
  hazard: z.string().min(1).max(240),
  /** What to do about it. Under 400 characters. */
  action: z.string().min(1).max(400),
  severity: z.enum(RECALL_SEVERITIES),
  /** The day the agency published it. */
  publishedAt: IsoDate,
  source: Source,
  matches: RecallMatches,
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
