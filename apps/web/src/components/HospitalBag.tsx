import type { Checklist } from "@ninetothree/content";
import { checklistCount } from "@ninetothree/content";

export interface HospitalBagProps {
  checklist: Checklist;
}

/**
 * A checklist you print and tick with a pen.
 *
 * The squares are drawn, not interactive: this page exists to leave the screen.
 * Every item keeps the author's order, because "paperwork, first" is advice and
 * alphabetising it would throw the advice away.
 */
export function HospitalBag({ checklist }: HospitalBagProps) {
  const total = checklistCount(checklist);

  return (
    <article className="print-sheet">
      <header className="flex items-baseline justify-between border-b border-line pb-2">
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">Nine to Three</p>
        <p className="text-xs text-ink-muted">{total} things</p>
      </header>

      <h1 className="mt-4 text-2xl font-semibold text-ink">{checklist.title}</h1>
      <p className="mt-1 text-sm text-ink-muted">{checklist.summary}</p>

      <div className="print-columns">
        {checklist.sections.map((section) => (
          <section
            key={section.id}
            aria-labelledby={`print-section-${section.id}`}
            className="mt-4"
          >
            <h2
              id={`print-section-${section.id}`}
              className="text-xs font-medium tracking-wide text-ink-muted uppercase"
            >
              {section.title}
            </h2>
            {section.note ? <p className="mt-0.5 text-xs text-ink-muted">{section.note}</p> : null}
            <ul className="mt-1 space-y-1">
              {section.items.map((item) => (
                <li key={item.id} className="flex gap-2 text-sm text-ink">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-block h-3 w-3 shrink-0 border border-ink"
                  />
                  <span>
                    {item.label}
                    {item.optional ? <span className="text-ink-muted"> (optional)</span> : null}
                    {item.detail ? (
                      <span className="block text-xs text-ink-muted">{item.detail}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section
        aria-labelledby="print-checklist-sources-heading"
        className="mt-4 border-t border-line pt-3"
      >
        <h2
          id="print-checklist-sources-heading"
          className="text-xs font-medium tracking-wide text-ink-muted uppercase"
        >
          Where this comes from
        </h2>
        <ul className="mt-1 space-y-0.5">
          {checklist.sources.map((source) => (
            <li key={source.id} className="text-xs text-ink-muted">
              {source.title} — {source.publisher}. {source.url}
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-4 border-t border-line pt-2 text-xs text-ink-faint">
        Reviewed by {checklist.reviewedBy} · {checklist.reviewedAt} · ninetothree.com/print/
        {checklist.id}
      </footer>
    </article>
  );
}
