import { ESCALATION_COPY, type RedFlag } from "@ninetothree/content";

export interface RedFlagListProps {
  flags: RedFlag[];
  /** Compact mode is used on the week card; full mode on the safety page. */
  compact?: boolean;
}

/**
 * Red flags are never collapsed, never behind a paywall, and never
 * softened. They are the one part of the product that is allowed to be
 * loud, and even then only in the wash colour, not full red.
 */
export function RedFlagList({ flags, compact = false }: RedFlagListProps) {
  if (flags.length === 0) return null;

  return (
    <section
      aria-labelledby="red-flags-heading"
      className="rounded-lg border border-red-wash bg-red-wash/60 p-5"
    >
      <h2 id="red-flags-heading" className="font-display text-lg text-ink">
        Call now if
      </h2>
      <ul className="mt-3 space-y-3">
        {flags.map((flag) => {
          const copy = ESCALATION_COPY[flag.escalation];
          const phone = flag.phone ?? copy.phone;
          return (
            <li key={flag.id} className="text-base text-ink">
              <span>{flag.text}</span>
              <span className="mt-1 block text-sm text-ink-muted">
                {copy.href && phone ? (
                  <a
                    href={copy.href}
                    className="font-medium text-red underline decoration-red/40 underline-offset-2"
                  >
                    {copy.label} — {phone}
                  </a>
                ) : (
                  <>
                    {copy.label}
                    {phone ? ` — ${phone}` : null}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {compact ? null : (
        <p className="mt-4 text-sm text-ink-muted">
          If you are not sure whether it is serious, call. You will not be wasting anyone&apos;s
          time.
        </p>
      )}
    </section>
  );
}
