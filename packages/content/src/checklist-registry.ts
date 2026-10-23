import { assertValidChecklists, type Checklist } from "./checklists";
import hospitalBag from "../checklists/hospital-bag.json";

/**
 * The checklists, in the order they are worth reading.
 *
 * Hand-written, like the article registry: a checklist is a file a person
 * adds, not a directory a build scans. `assertValidChecklists` runs at import
 * time, so a broken checklist fails the build rather than a parent.
 */
const ALL: Checklist[] = assertValidChecklists([hospitalBag]);

export const CHECKLISTS: readonly Checklist[] = ALL;

export const CHECKLISTS_BY_ID: ReadonlyMap<string, Checklist> = new Map(
  ALL.map((checklist) => [checklist.id, checklist]),
);

export function getChecklist(id: string): Checklist | undefined {
  return CHECKLISTS_BY_ID.get(id);
}
