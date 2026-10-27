import type { Metadata } from "next";
import Link from "next/link";
import { articleHref } from "@ninetothree/content";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Long reads",
  description: "The things a week cannot fit, written out and sourced.",
};

/**
 * The index of long reads.
 *
 * A server component with no state, so it renders with JavaScript off and it
 * is the same page for everyone. The order is the order a parent meets them.
 */
export default function ReadIndexPage() {
  return (
    <AppShell stage="Long reads">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">Long reads</h1>
        <p className="mt-2 text-base text-ink-muted">
          A week holds three steps and about two hundred characters each. These are the things that
          do not fit: what a test measures, why a seat faces backwards, what the difference is
          between a hard fortnight and something that needs help.
        </p>

        <ul className="mt-8 space-y-6">
          {ARTICLES.map((article) => (
            <li key={article.id}>
              <h2 className="font-display text-xl text-ink">
                <Link
                  href={articleHref(article)}
                  className="underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink"
                >
                  {article.title}
                </Link>
              </h2>
              <p className="mt-1 text-base text-ink-muted">{article.summary}</p>
              <p className="mt-1 text-sm text-ink-faint tabular">
                {article.sources.length} source{article.sources.length === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
