"use client";

import { ESCALATION_COPY, PACKS, type Escalation } from "@ninetothree/content";
import { Card, CardBody, TextLink } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";

const NUMBERS: { key: Escalation; detail: string }[] = [
  { key: "call-911", detail: "Anything that feels like an emergency. Trust that." },
  {
    key: "call-poison-control",
    detail: "Swallowed something, or a question about a dose.",
  },
  { key: "call-988", detail: "If you are thinking about hurting yourself." },
  { key: "call-psi", detail: "Someone to talk to about how you feel." },
  { key: "call-dv-hotline", detail: "Free, confidential, 24 hours." },
];

export default function SafetyPage() {
  const flags = PACKS.flatMap((pack) =>
    pack.redFlags.map((flag) => ({ ...flag, packTitle: pack.title, packId: pack.id })),
  );

  return (
    <AppShell stage="Safety">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">If something is wrong</h1>
        <p className="mt-2 text-base text-ink-muted">
          This page is always here, always free, and never behind a sign-in.
        </p>

        <section aria-labelledby="numbers-heading" className="mt-8">
          <h2 id="numbers-heading" className="font-display text-2xl text-ink">
            Who to call
          </h2>
          <ul className="mt-3 space-y-2">
            {NUMBERS.map(({ key, detail }) => {
              const copy = ESCALATION_COPY[key];
              return (
                <li key={key}>
                  <Card tone="sunken">
                    <CardBody className="pt-5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-base font-medium text-ink">{copy.label}</span>
                        {copy.phone ? (
                          <a
                            href={copy.href ?? `tel:${copy.phone.replace(/[^0-9+]/g, "")}`}
                            className="text-base text-ink tabular underline underline-offset-2"
                          >
                            {copy.phone}
                          </a>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-ink-muted">{detail}</p>
                    </CardBody>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="flags-heading" className="mt-10">
          <h2 id="flags-heading" className="font-display text-2xl text-ink">
            Every warning sign we know
          </h2>
          <p className="mt-2 text-base text-ink-muted">
            Collected from every week, in one place, so you never have to hunt for it.
          </p>
          <ul className="mt-3 space-y-3">
            {flags.map((flag) => {
              const copy = ESCALATION_COPY[flag.escalation];
              return (
                <li
                  key={`${flag.packId}-${flag.id}`}
                  className="rounded-md border border-red/20 bg-red-wash/40 p-4"
                >
                  <p className="text-base text-ink">{flag.text}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {copy.label}
                    {flag.phone ? ` · ${flag.phone}` : copy.phone ? ` · ${copy.phone}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">{flag.packTitle}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="mt-10 text-sm text-ink-faint">
          We are a guide, not a doctor. If you are worried, call.{" "}
          <TextLink href="https://www.acog.org/womens-health" external>
            ACOG has more
          </TextLink>
          .
        </p>
      </div>
    </AppShell>
  );
}
