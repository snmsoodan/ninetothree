import { assertValidPacks } from "./loader";
import type { StagePack } from "./schema";

import pregnancyW8 from "../packs/pregnancy-w8.json";
import pregnancyW12 from "../packs/pregnancy-w12.json";
import pregnancyW20 from "../packs/pregnancy-w20.json";
import pregnancyW28 from "../packs/pregnancy-w28.json";
import pregnancyW36 from "../packs/pregnancy-w36.json";
import pregnancyW39 from "../packs/pregnancy-w39.json";
import postpartumWeek1 from "../packs/postpartum-week-1.json";
import infantMonth2 from "../packs/infant-month-2.json";
import infantMonth6 from "../packs/infant-month-6.json";

/**
 * Every pack, validated at module load. A broken pack fails the build
 * rather than reaching a parent at 3am.
 */
export const PACKS: StagePack[] = assertValidPacks([
  pregnancyW8,
  pregnancyW12,
  pregnancyW20,
  pregnancyW28,
  pregnancyW36,
  pregnancyW39,
  postpartumWeek1,
  infantMonth2,
  infantMonth6,
]);

export const PACKS_BY_ID: ReadonlyMap<string, StagePack> = new Map(
  PACKS.map((pack) => [pack.id, pack]),
);

export function getPack(id: string): StagePack | undefined {
  return PACKS_BY_ID.get(id);
}
