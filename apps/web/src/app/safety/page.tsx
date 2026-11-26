"use client";

import { ESCALATION_COPY } from "@ninetothree/content";
import { PACK_INDEX } from "@ninetothree/content/pack-index";
import {
  HELP_NUMBERS,
  SAFETY_CTA,
  SAFETY_CTA_NOTE,
  SAFETY_FLAGS_HEADING,
  SAFETY_FLAGS_INTRO,
  SAFETY_FOOTER,
  SAFETY_HEADING,
  SAFETY_INTRO,
  SAFETY_MORE,
  SAFETY_MORE_URL,
  SAFETY_NUMBERS_HEADING,
  safetyFlags,
} from "@ninetothree/domain";
import { Card, CardBody, TextLink } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";
import { ButtonLink } from "@/components/ButtonLink";

/**
 * Every warning sign in the guide, and every number worth having.
 *
 * The list is built by `safetyFlags`, which is also what the phone renders, so
 * a flag that names a person to call on one platform names them on the other.
 */
export default function SafetyPage() {
  const flags = safetyFlags(PACK_INDEX);

  return (
    <AppShell stage="Safety" safetyContent showFooter={false}>
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">{SAFETY_HEADING}</h1>
        <p className="mt-2 text-base text-ink-muted">{SAFETY_INTRO}</p>

        <p className="mt-6">
          <ButtonLink href="/triage" variant="primary">
            {SAFETY_CTA}
          </ButtonLink>
        </p>
        <p className="mt-2 text-sm text-ink-muted">{SAFETY_CTA_NOTE}</p>

        <section aria-labelledby="numbers-heading" className="mt-8">
          <h2 id="numbers-heading" className="font-display text-2xl text-ink">
            {SAFETY_NUMBERS_HEADING}
          </h2>
          <ul className="mt-3 space-y-2">
            {HELP_NUMBERS.map(({ key, detail }) => {
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
            {SAFETY_FLAGS_HEADING}
          </h2>
          <p className="mt-2 text-base text-ink-muted">{SAFETY_FLAGS_INTRO}</p>
          <ul className="mt-3 space-y-3">
            {flags.map((flag) => (
              <li key={flag.id} className="rounded-md border border-red/20 bg-red-wash/40 p-4">
                <p className="text-base text-ink">{flag.text}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {flag.action}
                  {flag.phone ? ` · ${flag.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-ink-faint">{flag.packTitle}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-sm text-ink-faint">
          {SAFETY_FOOTER}{" "}
          <TextLink href={SAFETY_MORE_URL} external>
            {SAFETY_MORE}
          </TextLink>
          .
        </p>
      </div>
    </AppShell>
  );
}
