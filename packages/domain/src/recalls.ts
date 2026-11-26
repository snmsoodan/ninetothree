import {
  matchRecalls,
  recallKey,
  recallsForAge,
  RECALL_SEVERITY_RANK,
  type Recall,
  type RecallMatch,
  type RecallSubject,
} from "@ninetothree/content";
import { ageInMonths } from "@ninetothree/rules";
import { stageInput } from "./selectors";
import type { AppState } from "./model";

/**
 * What this parent has that a recall could be about.
 *
 * Only two things count: a step they pinned, and a product they chose. A step
 * they merely completed is not a signal — a parent who marked "buy a high
 * chair" done six months ago has a high chair, but they also have a child who
 * has outgrown it, and a notice about a chair they no longer use is noise.
 * Pinning is the parent saying "this is still mine".
 */
export function subjectFrom(state: AppState): RecallSubject {
  const choices: Record<string, { optionId: string }> = {};
  for (const [actionId, choice] of Object.entries(state.choices)) {
    choices[actionId] = { optionId: choice.optionId };
  }
  return {
    choices,
    pins: state.pins.map((pin) => ({ id: pin.id, title: pin.title })),
  };
}

/** Every recall that reaches this parent, strongest reason first. */
export function currentMatches(state: AppState, recalls: Recall[]): RecallMatch[] {
  return matchRecalls(recalls, subjectFrom(state));
}

/**
 * The matches this parent has not been told about yet.
 *
 * A dismissed notice is still a notice, so it is not new. The key carries the
 * reason, which is what lets a parent who put away "you pinned this step"
 * still hear "you chose this product" later.
 */
export function newMatches(state: AppState, recalls: Recall[]): RecallMatch[] {
  return currentMatches(state, recalls).filter((match) => !state.notices[recallKey(match)]);
}

/**
 * Records anything new and returns how many notices were added.
 *
 * Called on the dashboard rather than on a timer: the queue is a thing a
 * parent looks at, not a thing that interrupts them. Idempotent, so a
 * re-render or a second tab cannot double the queue.
 */
export function syncNotices(
  state: AppState,
  recalls: Recall[],
  record: (matches: RecallMatch[], at?: string) => number,
  at?: string,
): number {
  return record(newMatches(state, recalls), at);
}

export interface AgeUpdate {
  recall: Recall;
  /** The reason this is already theirs, if it is. */
  mine: RecallMatch | null;
}

export interface AgeUpdates {
  /** Signed months, negative before birth. */
  months: number;
  items: AgeUpdate[];
}

/**
 * The recalls that apply at this parent's age, with their own matches marked.
 *
 * Two filters run independently and are then unioned, which is the whole point:
 * `matches` finds what they told us about, and the age window finds what is
 * true for a six-month-old whether or not they told us anything. A family
 * should not have to pin the right step to hear that a formula was recalled.
 *
 * Returns null until the dates are known, because an age of zero is a real age
 * and must not stand in for "we do not know yet".
 */
export function updatesFor(state: AppState, recalls: Recall[], today: string): AgeUpdates | null {
  const input = stageInput(state);
  if (!input) return null;

  const months = ageInMonths(input, today);
  const mine = new Map(currentMatches(state, recalls).map((match) => [match.recall.id, match]));

  const byId = new Map<string, AgeUpdate>();
  for (const recall of recallsForAge(recalls, months)) {
    byId.set(recall.id, { recall, mine: mine.get(recall.id) ?? null });
  }
  // A recall this parent matched that falls outside the age window still
  // belongs on the page: they own the thing, so the window is not their window.
  for (const match of mine.values()) {
    if (!byId.has(match.recall.id))
      byId.set(match.recall.id, { recall: match.recall, mine: match });
  }

  const items = [...byId.values()].sort(
    (a, b) =>
      RECALL_SEVERITY_RANK[a.recall.severity] - RECALL_SEVERITY_RANK[b.recall.severity] ||
      b.recall.publishedAt.localeCompare(a.recall.publishedAt),
  );
  return { months, items };
}
