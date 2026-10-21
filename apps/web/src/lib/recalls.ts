import {
  matchRecalls,
  recallKey,
  type Recall,
  type RecallMatch,
  type RecallSubject,
} from "@ninetothree/content";
import { recordNotices, type AppState } from "./store";

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
export function syncNotices(state: AppState, recalls: Recall[], at?: string): number {
  return recordNotices(newMatches(state, recalls), at);
}
