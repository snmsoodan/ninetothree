import raw from "../recalls/recalls.json";
import { assertValidRecalls, type Recall } from "./recalls";

/**
 * Every recall, validated at module load.
 *
 * The feed is a seed, not a sync. A scheduled job that pulls the CPSC API
 * belongs with the backend epic; this file is what that job would write into,
 * and the notice queue in the app is what a parent would see.
 *
 * The date is a parameter so a test can pin it. A recall dated in the future is
 * a typo, and the check should fail the same way on every machine that runs it.
 */
export function loadRecallFeed(today: string): Recall[] {
  return assertValidRecalls(raw, today);
}

export const RECALLS: Recall[] = loadRecallFeed(new Date().toISOString().slice(0, 10));

export const RECALLS_BY_ID: ReadonlyMap<string, Recall> = new Map(
  RECALLS.map((recall) => [recall.id, recall]),
);

export function getRecall(id: string): Recall | undefined {
  return RECALLS_BY_ID.get(id);
}
