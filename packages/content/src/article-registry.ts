import { assertValidArticles, type Article } from "./articles";
import { carSeatRearFacing } from "../articles/car-seat-rear-facing";
import { formulaFeeding } from "../articles/formula-feeding";
import { glucoseTest } from "../articles/glucose-test";
import { postpartumMood } from "../articles/postpartum-mood";
import { safeSleep } from "../articles/safe-sleep";
import { startingSolids } from "../articles/starting-solids";

/**
 * Every article, validated at module load.
 *
 * A broken article fails the build, the same way a broken pack does. The
 * order here is the order the index shows, so it is roughly the order a
 * parent meets them.
 */
export const ARTICLES: Article[] = assertValidArticles([
  glucoseTest,
  carSeatRearFacing,
  safeSleep,
  formulaFeeding,
  startingSolids,
  postpartumMood,
]);

export const ARTICLES_BY_ID: ReadonlyMap<string, Article> = new Map(
  ARTICLES.map((article) => [article.id, article]),
);

export function getArticle(id: string): Article | undefined {
  return ARTICLES_BY_ID.get(id);
}
