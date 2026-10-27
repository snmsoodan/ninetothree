import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articleHref, articlesForAction, nextPack, previousPack } from "@ninetothree/content";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { PACKS } from "@ninetothree/content/registry";
import { catchUpCandidates } from "@ninetothree/rules";
import { WeekView, type ReadMoreLink } from "@/components/WeekView";

export function generateStaticParams() {
  return PACKS.map((pack) => ({ id: pack.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pack = PACKS.find((p) => p.id === id);
  return { title: pack ? pack.title : "Not found" };
}

/**
 * The week page is the only route that reads the whole guide, and it reads it
 * here, on the server. Everything the client needs is flattened into props:
 * the stage, the two neighbours, the catch-up list, and one link per step.
 */
export default async function WeekPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pack = PACKS.find((p) => p.id === id);
  if (!pack) notFound();

  const readMore: Record<string, ReadMoreLink> = {};
  for (const action of pack.coreActions) {
    const [article] = articlesForAction(ARTICLES, action.id);
    if (article) readMore[action.id] = { href: articleHref(article), title: article.title };
  }

  return (
    <WeekView
      pack={pack}
      nextId={nextPack(PACKS, pack)?.id}
      previousId={previousPack(PACKS, pack)?.id}
      catchUpCandidates={catchUpCandidates(PACKS, pack).candidates}
      readMore={readMore}
    />
  );
}
