import { ESCALATION_COPY, articleHref, type Article, type Source } from "@ninetothree/content";

/**
 * A long read, decided once.
 *
 * The browser compiles the Markdown with MDX; the phone cannot, and shipping
 * a Markdown compiler to a phone to render eight articles would be a strange
 * trade. So the body is parsed into a small block list here — headings,
 * paragraphs, lists — and the native screen draws those. It is the same
 * vocabulary the schema allows, so a body the browser can render and the
 * phone cannot is a body the schema would have refused.
 */

export const READ_HEADING = "Long reads";
export const READ_INTRO =
  "A week holds three steps and about two hundred characters each. These are the things that do not fit: what a test measures, why a seat faces backwards, what the difference is between a hard fortnight and something that needs help.";
export const READ_BACK = "Long reads";
export const READ_RELATED_HEADING = "The step this goes with";
export const READ_SOURCES_HEADING = "Where this comes from";
export const READ_OPEN_NOTE = " (opens in a new tab)";
export const READ_NOT_FOUND = "Not found";

/** "1 source", "4 sources". */
export function sourceLine(count: number): string {
  return `${count} source${count === 1 ? "" : "s"}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** A review date is a fact about the page, so it carries the year. */
export function formatReviewDate(date: string): string {
  const [year, month, day] = date.split("-");
  const name = MONTHS[Number(month) - 1] ?? month;
  return `${name} ${Number(day)}, ${year}`;
}

export const SOURCE_KIND_LABEL: Record<Source["kind"], string> = {
  clinical: "Clinical",
  government: "Government",
  charity: "Charity",
  editorial: "Editorial",
  vendor: "Vendor",
};

/** "Reviewed by Ada Lovelace on October 1, 2026. Last changed November 2, 2026." */
export function reviewLine(reviewedBy: string, reviewedAt: string, updatedAt: string): string {
  return `Reviewed by ${reviewedBy} on ${formatReviewDate(reviewedAt)}. Last changed ${formatReviewDate(updatedAt)}.`;
}

/** "Source — Publisher, Clinical" */
export function sourceMeta(source: Source): string {
  return `${source.publisher}, ${SOURCE_KIND_LABEL[source.kind]}`;
}

export interface RelatedAction {
  id: string;
  title: string;
  packTitle: string;
  href: string;
}

/** What `findAction` from the content package returns, without importing the packs. */
export type ActionFinder = (
  id: string,
) => { pack: { id: string; title: string }; action: { id: string; title: string } } | undefined;

/** Resolve an article's `relatedActions` against the packs, dropping ids that no longer exist. */
export function relatedActions(article: Article, find: ActionFinder): RelatedAction[] {
  return (article.relatedActions ?? []).flatMap((id) => {
    const hit = find(id);
    if (!hit) return [];
    return [
      {
        id: hit.action.id,
        title: hit.action.title,
        packTitle: hit.pack.title,
        href: `/week/${hit.pack.id}#${hit.action.id}-title`,
      },
    ];
  });
}

export interface ReadIndexRow {
  id: string;
  title: string;
  summary: string;
  href: string;
  sourceLine: string;
}

/** The index, in the order a parent meets the articles. */
export function readIndex(articles: readonly Article[]): ReadIndexRow[] {
  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.summary,
    href: articleHref(article),
    sourceLine: sourceLine(article.sources.length),
  }));
}

export type ArticleBlock =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] };

/**
 * Emphasis and links keep their words and lose their punctuation. The phone
 * has one weight of type per block, so `**this**` would otherwise reach the
 * parent as `**this**`.
 */
export function plainInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|\W)[*_]([^*_]+)[*_](?=\W|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

export function articleBlocks(body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "paragraph", text: plainInline(paragraph.join(" ")) });
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    blocks.push({ kind: "list", ordered: list.ordered, items: list.items });
    list = null;
  };
  const flush = () => {
    flushParagraph();
    flushList();
  };

  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "") {
      flush();
      continue;
    }
    const heading = /^(#{2,3})\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({
        kind: "heading",
        level: heading[1] === "###" ? 3 : 2,
        text: plainInline(heading[2] as string),
      });
      continue;
    }
    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(plainInline(ordered[1] as string));
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(plainInline(bullet[1] as string));
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flush();
  return blocks;
}

/** Both crisis numbers, read straight from the escalation table. */
export const CRISIS = ESCALATION_COPY["call-988"];
export const SUPPORT = ESCALATION_COPY["call-psi"];

export const CRISIS_HEADING = "If you are thinking about hurting yourself";
export const CRISIS_LEAD = "Call or text";
export const CRISIS_TAIL =
  ". It is free, it is answered day and night, and calling it is not an overreaction.";
export const SUPPORT_LEAD = "For how you feel when it is not an emergency, the PSI Helpline is";
export const SUPPORT_TAIL = ".";

export interface ArticleView {
  id: string;
  title: string;
  summary: string;
  blocks: ArticleBlock[];
  related: RelatedAction[];
  sources: Source[];
  /** "Source — Publisher, Clinical", one per source. */
  sourceMeta: string[];
  reviewLine: string;
  /** True for a page about how a parent feels, which always carries the numbers. */
  crisis: boolean;
}

export function articleView(article: Article, find: ActionFinder): ArticleView {
  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    blocks: articleBlocks(article.body),
    related: relatedActions(article, find),
    sources: article.sources,
    sourceMeta: article.sources.map(sourceMeta),
    reviewLine: reviewLine(article.reviewedBy, article.reviewedAt, article.updatedAt),
    crisis: article.domain === "mind",
  };
}
