import type { StagePack } from "@ninetothree/content";
import { ESCALATION_COPY } from "@ninetothree/content";

export interface PrintWeekProps {
  pack: StagePack;
}

/** The pack's own unit, not a computed stage: a printed sheet has no "today". */
function packLabel(pack: StagePack): string {
  const unit = pack.stageUnit === "week" ? "Week" : pack.stageUnit === "month" ? "Month" : "Day";
  return `${unit} ${pack.stageIndex}`;
}

const KIND_LABEL: Record<StagePack["kind"], string> = {
  pregnancy: "Pregnancy",
  postpartum: "After birth",
  infant: "First year",
  toddler: "Toddler",
  event: "One-off",
};

/**
 * One week, on one sheet of paper.
 *
 * This is deliberately not the week view with the buttons removed. A printed
 * page cannot be tapped, so it carries only what a parent needs when the phone
 * is in the other room: what this week is, the three things worth doing, the
 * reasons to call someone, and where the claims came from. The `detail` and
 * `skipIf` copy stays on screen — it is the part that needs a link.
 */
export function PrintWeek({ pack }: PrintWeekProps) {
  const label = packLabel(pack);

  return (
    <article className="print-sheet">
      <header className="flex items-baseline justify-between border-b border-line pb-2">
        <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">Nine to Three</p>
        <p className="text-xs text-ink-muted">
          {KIND_LABEL[pack.kind]} · {label}
        </p>
      </header>

      <h1 className="mt-4 text-2xl font-semibold text-ink">{pack.title}</h1>
      {pack.subtitle ? <p className="mt-1 text-sm text-ink-muted">{pack.subtitle}</p> : null}

      {pack.baby || pack.you ? (
        <section aria-labelledby="print-body-heading" className="mt-4">
          <h2
            id="print-body-heading"
            className="text-xs font-medium tracking-wide text-ink-muted uppercase"
          >
            This week
          </h2>
          <div className="mt-1 space-y-1 text-sm text-ink">
            {pack.baby ? (
              <p>
                <span className="font-medium">Baby. </span>
                {pack.baby.size ? <span className="text-ink-muted">{pack.baby.size}. </span> : null}
                {pack.baby.development}
              </p>
            ) : null}
            {pack.you?.body ? (
              <p>
                <span className="font-medium">You. </span>
                {pack.you.body}
              </p>
            ) : null}
            {pack.you?.mind ? <p>{pack.you.mind}</p> : null}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="print-actions-heading" className="mt-4">
        <h2
          id="print-actions-heading"
          className="text-xs font-medium tracking-wide text-ink-muted uppercase"
        >
          Three things this week
        </h2>
        <ol className="mt-1 space-y-1.5">
          {pack.coreActions.map((action, index) => (
            <li key={action.id} className="text-sm text-ink">
              <span className="font-medium">
                {index + 1}. {action.title}
              </span>
              <span className="text-ink-muted"> — {action.why}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="print-red-flags-heading" className="mt-4 border-t border-line pt-3">
        <h2
          id="print-red-flags-heading"
          className="text-xs font-medium tracking-wide text-ink-muted uppercase"
        >
          Call now, not later
        </h2>
        <ul className="mt-1 space-y-1">
          {pack.redFlags.map((flag) => {
            const copy = ESCALATION_COPY[flag.escalation];
            const phone = flag.phone ?? copy.phone;
            return (
              <li key={flag.id} className="text-sm text-ink">
                {flag.text}
                <span className="font-medium">
                  {" "}
                  — {copy.label}
                  {phone ? ` ${phone}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {pack.appointments.length > 0 ? (
        <section aria-labelledby="print-appointments-heading" className="mt-4">
          <h2
            id="print-appointments-heading"
            className="text-xs font-medium tracking-wide text-ink-muted uppercase"
          >
            Appointments
          </h2>
          <ul className="mt-1 space-y-1">
            {pack.appointments.map((appointment) => (
              <li key={appointment.id} className="text-sm text-ink">
                <span className="font-medium">{appointment.label}</span>
                {appointment.who ? (
                  <span className="text-ink-muted"> · {appointment.who}</span>
                ) : null}
                {appointment.note ? (
                  <span className="text-ink-muted"> — {appointment.note}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="print-sources-heading" className="mt-4 border-t border-line pt-3">
        <h2
          id="print-sources-heading"
          className="text-xs font-medium tracking-wide text-ink-muted uppercase"
        >
          Where this comes from
        </h2>
        <ul className="mt-1 space-y-0.5">
          {pack.sources.map((source) => (
            <li key={source.id} className="text-xs text-ink-muted">
              {source.title} — {source.publisher}. {source.url}
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-4 border-t border-line pt-2 text-xs text-ink-faint">
        Reviewed by {pack.reviewedBy} · {pack.reviewedAt} · ninetothree.com/print/week/{pack.id}
      </footer>
    </article>
  );
}
