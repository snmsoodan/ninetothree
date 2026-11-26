import { findAction } from "@ninetothree/content";
import { ARTICLES, getArticle } from "@ninetothree/content/article-registry";
import { PACKS } from "@ninetothree/content/registry";
import {
  CRISIS,
  CRISIS_HEADING,
  CRISIS_LEAD,
  CRISIS_TAIL,
  READ_BACK,
  READ_HEADING,
  READ_INTRO,
  READ_NOT_FOUND,
  READ_OPEN_NOTE,
  READ_RELATED_HEADING,
  READ_SOURCES_HEADING,
  SOURCE_KIND_LABEL,
  SUPPORT,
  SUPPORT_LEAD,
  SUPPORT_TAIL,
  articleView,
  formatReviewDate,
  readIndex,
  sourceLine,
  type ArticleView,
  type ReadIndexRow,
} from "@ninetothree/domain";

/**
 * The long reads, on the phone.
 *
 * The articles are Markdown on the web and MDX is not shipped here, so the body
 * is parsed once into headings, paragraphs and lists by `articleBlocks`. That
 * parser is shared, which is the point: the phone cannot quietly show a
 * different sentence from the browser.
 */

export interface ReadIndexView {
  heading: string;
  intro: string;
  rows: ReadIndexRow[];
}

export interface ReadIndexProps {
  articles?: typeof ARTICLES;
}

export function readIndexView(articles: typeof ARTICLES = ARTICLES): ReadIndexView {
  return { heading: READ_HEADING, intro: READ_INTRO, rows: readIndex(articles) };
}

export interface SourceRow {
  label: string;
  publisher: string;
  meta: string;
  url: string;
}

export interface RelatedRow {
  id: string;
  title: string;
  packTitle: string;
  href: string;
}

export interface ReadArticleView {
  found: true;
  back: string;
  title: string;
  summary: string;
  blocks: ArticleView["blocks"];
  reviewLine: string;
  sourcesHeading: string;
  sources: SourceRow[];
  sourcesLabel: string;
  relatedHeading: string;
  related: RelatedRow[];
  crisis: boolean;
  crisisHeading: string;
  crisisLead: string;
  crisisTail: string;
  crisisNumber: string;
  supportLead: string;
  supportTail: string;
  supportNumber: string;
  openNote: string;
}

export interface ReadNotFound {
  found: false;
  back: string;
  title: string;
}

export type ReadArticleModel = ReadArticleView | ReadNotFound;

export function readArticleView(id: string): ReadArticleModel {
  const article = getArticle(id);
  if (!article) return { found: false, back: READ_BACK, title: READ_NOT_FOUND };

  const view = articleView(article, (actionId) => findAction(PACKS, actionId));
  return {
    found: true,
    back: READ_BACK,
    title: view.title,
    summary: view.summary,
    blocks: view.blocks,
    reviewLine: view.reviewLine,
    sourcesHeading: READ_SOURCES_HEADING,
    sources: view.sources.map((source, index) => ({
      label: view.sourceMeta[index] ?? source.publisher,
      publisher: source.publisher,
      meta: SOURCE_KIND_LABEL[source.kind],
      url: source.url,
    })),
    sourcesLabel: sourceLine(view.sources.length),
    relatedHeading: READ_RELATED_HEADING,
    related: view.related.map((action) => ({
      id: action.id,
      title: action.title,
      packTitle: action.packTitle,
      href: action.href,
    })),
    crisis: view.crisis,
    crisisHeading: CRISIS_HEADING,
    crisisLead: CRISIS_LEAD,
    crisisTail: CRISIS_TAIL,
    crisisNumber: CRISIS.phone ?? "",
    supportLead: SUPPORT_LEAD,
    supportTail: SUPPORT_TAIL,
    supportNumber: SUPPORT.phone ?? "",
    openNote: READ_OPEN_NOTE,
  };
}

export { formatReviewDate };
