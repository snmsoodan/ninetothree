import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findAction } from "@ninetothree/content";
import { ARTICLES, getArticle } from "@ninetothree/content/article-registry";
import { PACKS } from "@ninetothree/content/registry";
import { AppShell } from "@/components/AppShell";
import { ArticleBody } from "@/components/ArticleBody";
import { CrisisFooter } from "@/components/CrisisFooter";
import { RelatedActions, resolveRelated } from "@/components/RelatedActions";
import { SourceBlock } from "@/components/SourceBlock";

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  return article ? { title: article.title, description: article.summary } : { title: "Not found" };
}

/**
 * One article.
 *
 * A server component, so the whole page is in the first response: the title,
 * the body, the sources and the review date. A parent who prints it gets the
 * same page, and a parent with JavaScript off gets the same page.
 */
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = resolveRelated(article, (id) => findAction(PACKS, id));

  return (
    <AppShell stage="Long reads">
      <article className="measure">
        <p className="text-sm text-ink-faint">
          <Link href="/read" className="underline underline-offset-2 hover:text-ink">
            Long reads
          </Link>
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink">{article.title}</h1>
        <p className="mt-2 text-lg text-ink-muted">{article.summary}</p>

        <div className="mt-8">
          <ArticleBody body={article.body} />
        </div>

        <RelatedActions actions={related} />

        <SourceBlock
          sources={article.sources}
          reviewedBy={article.reviewedBy}
          reviewedAt={article.reviewedAt}
          updatedAt={article.updatedAt}
        />

        {/* A page about how a parent feels carries the numbers, every time,
            whether or not the article happens to mention them. */}
        {article.domain === "mind" ? <CrisisFooter /> : null}
      </article>
    </AppShell>
  );
}
