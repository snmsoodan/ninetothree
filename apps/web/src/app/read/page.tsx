import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@ninetothree/content/article-registry";
import { READ_HEADING, READ_INTRO, readIndex } from "@ninetothree/domain";
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
        <h1 className="font-display text-3xl text-ink">{READ_HEADING}</h1>
        <p className="mt-2 text-base text-ink-muted">{READ_INTRO}</p>

        <ul className="mt-8 space-y-6">
          {readIndex(ARTICLES).map((article) => (
            <li key={article.id}>
              <h2 className="font-display text-xl text-ink">
                <Link
                  href={article.href}
                  className="underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink"
                >
                  {article.title}
                </Link>
              </h2>
              <p className="mt-1 text-base text-ink-muted">{article.summary}</p>
              <p className="mt-1 text-sm text-ink-faint tabular">{article.sourceLine}</p>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
