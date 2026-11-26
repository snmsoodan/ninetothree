import Link from "next/link";
import { READ_RELATED_HEADING, type RelatedAction } from "@ninetothree/domain";

export interface RelatedActionsProps {
  /** The steps this article explains, already resolved to titles. */
  actions: RelatedAction[];
}

/**
 * The way back from an article to the thing it explains.
 *
 * An article is reached from a step, so it has to lead back to that step.
 * Without this the parent reads a page and has to remember where they were,
 * which is the exact failure the product exists to avoid.
 */
export function RelatedActions({ actions }: RelatedActionsProps) {
  if (actions.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-10">
      <h2 id="related-heading" className="font-display text-xl text-ink">
        {READ_RELATED_HEADING}
      </h2>
      <ul className="mt-3 space-y-2">
        {actions.map((action) => (
          <li key={action.id}>
            <Link
              href={action.href}
              className="text-base text-ink underline decoration-line-strong decoration-1 underline-offset-[3px] hover:decoration-ink"
            >
              {action.title}
            </Link>
            <span className="text-sm text-ink-muted"> — {action.packTitle}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
