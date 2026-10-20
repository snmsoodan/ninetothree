import { compileMDX } from "next-mdx-remote/rsc";

/**
 * The article body.
 *
 * The body is Markdown, compiled by MDX at build time. It is deliberately
 * given no components: an article is prose, and the moment content can render
 * a component it can render a carousel, a spinner, or a modal — the three
 * things the calm rules exist to keep out. Headings, paragraphs, lists, links
 * and emphasis are the whole vocabulary.
 *
 * Styling lives in `globals.css` under `.article-body`, so the Markdown stays
 * plain and a content edit never has to carry a class name.
 */
export async function ArticleBody({ body }: { body: string }) {
  const { content } = await compileMDX({
    source: body,
    options: { parseFrontmatter: false },
  });

  return <div className="article-body measure">{content}</div>;
}
