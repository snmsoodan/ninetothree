import { z } from "zod";
import { StageRef, stageOrdinal } from "./links";
import { Domain, Source } from "./schema";

/**
 * A long read.
 *
 * A stage pack says what to do this week in about two hundred characters. An
 * article is where the parent who wants to understand the thing goes next —
 * what the glucose test actually measures, why the car seat has to be
 * rear-facing, what the difference is between the baby blues and something
 * that needs help.
 *
 * Articles are held to the same rules as packs: a source, a review date, the
 * same lint, the same reading-level ceiling. The difference is length, and
 * length is exactly what makes the reading level hard to hold.
 *
 * The body is Markdown, rendered by MDX. It is stored as a string in a typed
 * module rather than as a file on disk so that it is validated at build time
 * and shipped in the bundle — the same way a pack is. A file read at request
 * time would work in development and fail in a deploy.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

export const Article = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, "id must be kebab-case")
      .min(3)
      .max(60),
    title: z.string().min(1).max(80),
    /** One sentence, shown in the index and under the title. */
    summary: z.string().min(1).max(240),
    domain: Domain,
    /** The window this is useful in. Inclusive at both ends. */
    stages: z.object({ from: StageRef, to: StageRef }),
    /**
     * The steps this article explains. A week links to the article from the
     * step, so the parent who asks "why" gets an answer without leaving.
     */
    relatedActions: z.array(z.string().min(1).max(60)).max(6).optional(),
    sources: z.array(Source).min(1),
    reviewedBy: z.string().min(1).max(120),
    reviewedAt: isoDate,
    updatedAt: isoDate,
    /** Markdown. Headings start at `##`; the page owns the `h1`. */
    body: z.string().min(1),
  })
  .superRefine((article, ctx) => {
    if (stageOrdinal(article.stages.to) < stageOrdinal(article.stages.from)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["stages"],
        message: "a stage range cannot run backwards",
      });
    }
  });

export type Article = z.infer<typeof Article>;

export interface ArticleIssue {
  articleId: string;
  path: string;
  message: string;
}

export interface ArticleLoadResult {
  articles: Article[];
  issues: ArticleIssue[];
}

/** Validate a list of raw articles, collecting every problem rather than the first. */
export function loadArticles(raw: unknown[]): ArticleLoadResult {
  const articles: Article[] = [];
  const issues: ArticleIssue[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    const parsed = Article.safeParse(entry);
    if (!parsed.success) {
      const id =
        typeof entry === "object" && entry !== null && "id" in entry
          ? String((entry as { id: unknown }).id)
          : "(no id)";
      for (const issue of parsed.error.issues) {
        issues.push({
          articleId: id,
          path: issue.path.join(".") || "(root)",
          message: issue.message,
        });
      }
      continue;
    }
    if (seen.has(parsed.data.id)) {
      issues.push({
        articleId: parsed.data.id,
        path: "id",
        message: "two articles share this id",
      });
      continue;
    }
    seen.add(parsed.data.id);
    articles.push(parsed.data);
  }

  return { articles, issues };
}

export function assertValidArticles(raw: unknown[]): Article[] {
  const { articles, issues } = loadArticles(raw);
  if (issues.length > 0) {
    const detail = issues.map((i) => `${i.articleId} → ${i.path}: ${i.message}`).join("\n");
    throw new Error(`Invalid articles:\n${detail}`);
  }
  return articles;
}

/**
 * The prose of an article, with the Markdown taken out.
 *
 * The reading level is a measure of the sentences a parent reads, not of the
 * syntax around them. Counting `##` and `](` as words would make every article
 * look harder than it is, and counting a URL as a word would make it look
 * easier.
 */
export function articleProse(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Every article whose window contains this point on the timeline. */
export function articlesForStage(
  articles: Article[],
  kind: StageRef["kind"],
  index: number,
): Article[] {
  const point = stageOrdinal({ kind, index });
  return articles.filter(
    (article) =>
      stageOrdinal(article.stages.from) <= point && point <= stageOrdinal(article.stages.to),
  );
}

/** Every article that explains this step. */
export function articlesForAction(articles: Article[], actionId: string): Article[] {
  return articles.filter((article) => (article.relatedActions ?? []).includes(actionId));
}

export function articleHref(article: Article): string {
  return `/read/${article.id}`;
}
