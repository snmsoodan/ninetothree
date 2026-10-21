"use client";

import { Card, CardBody, TextLink } from "@ninetothree/ui";
import { ButtonLink } from "./ButtonLink";
import { EMAIL_REASON_COPY, type EmailReason, type WeeklyEmail } from "@/lib/email";

export interface EmailPreviewProps {
  email: WeeklyEmail | null;
  reason: EmailReason;
  sendAt: Date;
  timeZone: string;
}

/**
 * The email, shown in the app's own type.
 *
 * The real send renders `src/emails/WeeklyEmail.tsx`, which cannot use the
 * app's CSS — an email has to carry its own styles. Both read the same
 * `WeeklyEmail` model, so the words cannot drift; only the styling differs,
 * and it has to.
 */
export function EmailPreview({ email, reason, sendAt, timeZone }: EmailPreviewProps) {
  return (
    <div className="measure">
      <h1 className="font-display text-3xl text-ink">The weekly email</h1>
      <p className="mt-2 text-base text-ink-muted">
        This is exactly what we would send you this week. Nothing is sent yet — there is no mail
        server in this version, and the settings say so.
      </p>

      <p className="mt-4 text-sm text-ink-faint">
        Next one would go at{" "}
        <time dateTime={sendAt.toISOString()}>
          {sendAt.toLocaleString(undefined, {
            weekday: "long",
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>{" "}
        in {timeZone}.
      </p>

      {email ? (
        <Card className="mt-6">
          <CardBody className="pt-5">
            <p className="text-xs uppercase tracking-wide text-ink-faint">{email.weekLabel}</p>
            <h2 className="mt-1 font-display text-2xl text-ink">{email.subject}</h2>
            <p className="mt-1 text-sm text-ink-muted">{email.preheader}</p>

            <ul className="mt-5 space-y-4">
              {email.actions.map((action) => (
                <li key={action.id}>
                  <p className="text-base font-medium text-ink">{action.title}</p>
                  <p className="text-sm text-ink-muted">{action.why}</p>
                </li>
              ))}
            </ul>

            <hr className="my-6 border-line" />

            <h3 className="text-sm font-medium text-ink">{email.partner.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{email.partner.body}</p>

            {email.redFlag ? (
              <div className="mt-5 border-l-2 border-clay pl-3">
                <h3 className="text-sm font-medium text-ink">{email.redFlag.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{email.redFlag.body}</p>
              </div>
            ) : null}

            <hr className="my-6 border-line" />

            <p className="text-sm text-ink-faint">
              You get this because you asked for it.{" "}
              <TextLink href="/settings#notify-heading">Turn it off</TextLink> — one click, no
              questions.
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card className="mt-6" tone="sunken">
          <CardBody className="pt-5">
            <h2 className="font-display text-xl text-ink">Nothing would be sent this week</h2>
            <p className="mt-2 text-base text-ink-muted">{EMAIL_REASON_COPY[reason]}</p>
            <p className="mt-4">
              <ButtonLink href="/settings#notify-heading" variant="secondary">
                What we send you
              </ButtonLink>
            </p>
          </CardBody>
        </Card>
      )}

      <p className="mt-8 text-sm text-ink-faint">
        <TextLink href="/settings">Back to settings</TextLink>
      </p>
    </div>
  );
}
