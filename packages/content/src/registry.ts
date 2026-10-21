import { assertValidPacks } from "./loader";
import type { StagePack } from "./schema";

import pregnancyW4 from "../packs/pregnancy-w4.json";
import pregnancyW5 from "../packs/pregnancy-w5.json";
import pregnancyW6 from "../packs/pregnancy-w6.json";
import pregnancyW7 from "../packs/pregnancy-w7.json";
import pregnancyW8 from "../packs/pregnancy-w8.json";
import pregnancyW9 from "../packs/pregnancy-w9.json";
import pregnancyW10 from "../packs/pregnancy-w10.json";
import pregnancyW11 from "../packs/pregnancy-w11.json";
import pregnancyW12 from "../packs/pregnancy-w12.json";
import pregnancyW13 from "../packs/pregnancy-w13.json";
import pregnancyW14 from "../packs/pregnancy-w14.json";
import pregnancyW15 from "../packs/pregnancy-w15.json";
import pregnancyW16 from "../packs/pregnancy-w16.json";
import pregnancyW17 from "../packs/pregnancy-w17.json";
import pregnancyW18 from "../packs/pregnancy-w18.json";
import pregnancyW19 from "../packs/pregnancy-w19.json";
import pregnancyW20 from "../packs/pregnancy-w20.json";
import pregnancyW21 from "../packs/pregnancy-w21.json";
import pregnancyW22 from "../packs/pregnancy-w22.json";
import pregnancyW23 from "../packs/pregnancy-w23.json";
import pregnancyW24 from "../packs/pregnancy-w24.json";
import pregnancyW25 from "../packs/pregnancy-w25.json";
import pregnancyW26 from "../packs/pregnancy-w26.json";
import pregnancyW27 from "../packs/pregnancy-w27.json";
import pregnancyW28 from "../packs/pregnancy-w28.json";
import pregnancyW29 from "../packs/pregnancy-w29.json";
import pregnancyW30 from "../packs/pregnancy-w30.json";
import pregnancyW31 from "../packs/pregnancy-w31.json";
import pregnancyW32 from "../packs/pregnancy-w32.json";
import pregnancyW33 from "../packs/pregnancy-w33.json";
import pregnancyW34 from "../packs/pregnancy-w34.json";
import pregnancyW35 from "../packs/pregnancy-w35.json";
import pregnancyW36 from "../packs/pregnancy-w36.json";
import pregnancyW37 from "../packs/pregnancy-w37.json";
import pregnancyW38 from "../packs/pregnancy-w38.json";
import pregnancyW39 from "../packs/pregnancy-w39.json";
import pregnancyW40 from "../packs/pregnancy-w40.json";
import pregnancyW41 from "../packs/pregnancy-w41.json";
import pregnancyW42 from "../packs/pregnancy-w42.json";
import postpartumWeek1 from "../packs/postpartum-week-1.json";
import postpartumWeek2 from "../packs/postpartum-week-2.json";
import postpartumWeek3 from "../packs/postpartum-week-3.json";
import postpartumWeek4 from "../packs/postpartum-week-4.json";
import postpartumWeek5 from "../packs/postpartum-week-5.json";
import postpartumWeek6 from "../packs/postpartum-week-6.json";
import postpartumWeek7 from "../packs/postpartum-week-7.json";
import postpartumWeek8 from "../packs/postpartum-week-8.json";
import postpartumWeek9 from "../packs/postpartum-week-9.json";
import postpartumWeek10 from "../packs/postpartum-week-10.json";
import postpartumWeek11 from "../packs/postpartum-week-11.json";
import postpartumWeek12 from "../packs/postpartum-week-12.json";
import infantMonth3 from "../packs/infant-month-3.json";
import infantMonth4 from "../packs/infant-month-4.json";
import infantMonth5 from "../packs/infant-month-5.json";
import infantMonth6 from "../packs/infant-month-6.json";
import infantMonth7 from "../packs/infant-month-7.json";
import infantMonth8 from "../packs/infant-month-8.json";
import infantMonth9 from "../packs/infant-month-9.json";
import infantMonth10 from "../packs/infant-month-10.json";
import infantMonth11 from "../packs/infant-month-11.json";
import infantMonth12 from "../packs/infant-month-12.json";
import toddlerMonth13 from "../packs/toddler-month-13.json";
import toddlerMonth14 from "../packs/toddler-month-14.json";
import toddlerMonth15 from "../packs/toddler-month-15.json";
import toddlerMonth16 from "../packs/toddler-month-16.json";
import toddlerMonth17 from "../packs/toddler-month-17.json";
import toddlerMonth18 from "../packs/toddler-month-18.json";
import toddlerMonth19 from "../packs/toddler-month-19.json";
import toddlerMonth20 from "../packs/toddler-month-20.json";
import toddlerMonth21 from "../packs/toddler-month-21.json";
import toddlerMonth22 from "../packs/toddler-month-22.json";
import toddlerMonth23 from "../packs/toddler-month-23.json";
import toddlerMonth24 from "../packs/toddler-month-24.json";
import toddlerMonth25 from "../packs/toddler-month-25.json";
import toddlerMonth26 from "../packs/toddler-month-26.json";
import toddlerMonth27 from "../packs/toddler-month-27.json";
import toddlerMonth28 from "../packs/toddler-month-28.json";
import toddlerMonth29 from "../packs/toddler-month-29.json";
import toddlerMonth30 from "../packs/toddler-month-30.json";
import toddlerMonth31 from "../packs/toddler-month-31.json";
import toddlerMonth32 from "../packs/toddler-month-32.json";
import toddlerMonth33 from "../packs/toddler-month-33.json";
import toddlerMonth34 from "../packs/toddler-month-34.json";
import toddlerMonth35 from "../packs/toddler-month-35.json";
import toddlerMonth36 from "../packs/toddler-month-36.json";

/**
 * Every pack, validated at module load. A broken pack fails the build
 * rather than reaching a parent at 3am.
 *
 * Generated by scripts/gen-registry.mjs. Do not edit by hand — run
 * `pnpm content:registry` after adding or removing a pack.
 */
export const PACKS: StagePack[] = assertValidPacks([
  pregnancyW4,
  pregnancyW5,
  pregnancyW6,
  pregnancyW7,
  pregnancyW8,
  pregnancyW9,
  pregnancyW10,
  pregnancyW11,
  pregnancyW12,
  pregnancyW13,
  pregnancyW14,
  pregnancyW15,
  pregnancyW16,
  pregnancyW17,
  pregnancyW18,
  pregnancyW19,
  pregnancyW20,
  pregnancyW21,
  pregnancyW22,
  pregnancyW23,
  pregnancyW24,
  pregnancyW25,
  pregnancyW26,
  pregnancyW27,
  pregnancyW28,
  pregnancyW29,
  pregnancyW30,
  pregnancyW31,
  pregnancyW32,
  pregnancyW33,
  pregnancyW34,
  pregnancyW35,
  pregnancyW36,
  pregnancyW37,
  pregnancyW38,
  pregnancyW39,
  pregnancyW40,
  pregnancyW41,
  pregnancyW42,
  postpartumWeek1,
  postpartumWeek2,
  postpartumWeek3,
  postpartumWeek4,
  postpartumWeek5,
  postpartumWeek6,
  postpartumWeek7,
  postpartumWeek8,
  postpartumWeek9,
  postpartumWeek10,
  postpartumWeek11,
  postpartumWeek12,
  infantMonth3,
  infantMonth4,
  infantMonth5,
  infantMonth6,
  infantMonth7,
  infantMonth8,
  infantMonth9,
  infantMonth10,
  infantMonth11,
  infantMonth12,
  toddlerMonth13,
  toddlerMonth14,
  toddlerMonth15,
  toddlerMonth16,
  toddlerMonth17,
  toddlerMonth18,
  toddlerMonth19,
  toddlerMonth20,
  toddlerMonth21,
  toddlerMonth22,
  toddlerMonth23,
  toddlerMonth24,
  toddlerMonth25,
  toddlerMonth26,
  toddlerMonth27,
  toddlerMonth28,
  toddlerMonth29,
  toddlerMonth30,
  toddlerMonth31,
  toddlerMonth32,
  toddlerMonth33,
  toddlerMonth34,
  toddlerMonth35,
  toddlerMonth36,
]);

export const PACKS_BY_ID: ReadonlyMap<string, StagePack> = new Map(
  PACKS.map((pack) => [pack.id, pack]),
);

export function getPack(id: string): StagePack | undefined {
  return PACKS_BY_ID.get(id);
}
