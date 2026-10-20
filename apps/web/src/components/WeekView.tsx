"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PACKS, type StagePack } from "@ninetothree/content";
import { Badge, ButtonLink, Card, CardBody, Progress } from "@ninetothree/ui";
import { catchUp, completion, personalizePack } from "@ninetothree/rules";
import { ActionItem } from "./ActionItem";
import { CatchUp } from "./CatchUp";
import { RedFlagList } from "./RedFlagList";
import { SourceList } from "./SourceList";
import { AppShell } from "./AppShell";
import { useAppState } from "@/lib/store";

export interface WeekViewProps {
  pack: StagePack;
  nextId?: string;
  previousId?: string;
}

export function WeekView({ pack, nextId, previousId }: WeekViewProps) {
  const state = useAppState();

  const { pack: personalized, hidden } = useMemo(
    () => personalizePack(pack, state.profile),
    [pack, state.profile],
  );

  const doneIds = personalized.coreActions
    .filter((a) => state.progress[a.id]?.status === "done")
    .map((a) => a.id);

  const done = completion(personalized, doneIds);
  const allDone = done === 1;

  const doneEverywhere = useMemo(
    () =>
      Object.entries(state.progress)
        .filter(([, entry]) => entry.status === "done")
        .map(([id]) => id),
    [state.progress],
  );

  const catchUpResult = useMemo(() => catchUp(PACKS, pack, doneEverywhere), [pack, doneEverywhere]);

  return (
    <AppShell stage={pack.title}>
      <div className="measure">
        <header>
          <Link
            href="/"
            className="text-sm text-ink-muted underline underline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            Back to this week
          </Link>
          <p className="mt-3 text-sm text-ink-muted">{pack.title}</p>
          <h1 className="mt-1 font-display text-3xl text-ink">{pack.subtitle ?? pack.title}</h1>
        </header>

        <div className="mt-5">
          <Progress
            value={done * 100}
            label={
              allDone
                ? "All three done"
                : `${doneIds.length} of ${personalized.coreActions.length} done`
            }
            hideValue
          />
        </div>

        {pack.baby || pack.you ? (
          <Card tone="sunken" className="mt-6">
            <CardBody className="space-y-4 pt-5">
              {pack.baby ? (
                <div>
                  <h2 className="text-sm font-medium text-ink-muted">The baby</h2>
                  {pack.baby.size ? (
                    <p className="mt-1 text-sm text-ink-faint">{pack.baby.size}</p>
                  ) : null}
                  <p className="mt-1 text-base text-ink">{pack.baby.development}</p>
                </div>
              ) : null}
              {pack.you?.body ? (
                <div>
                  <h2 className="text-sm font-medium text-ink-muted">You</h2>
                  <p className="mt-1 text-base text-ink">{pack.you.body}</p>
                </div>
              ) : null}
              {pack.you?.mind ? <p className="text-base text-ink-muted">{pack.you.mind}</p> : null}
            </CardBody>
          </Card>
        ) : null}

        <section aria-labelledby="actions-heading" className="mt-8">
          <h2 id="actions-heading" className="font-display text-2xl text-ink">
            {personalized.coreActions.length === 1
              ? "The one thing"
              : `The ${personalized.coreActions.length} things`}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            That is the whole week. Everything else can wait.
          </p>
          <div className="mt-4 space-y-3">
            {personalized.coreActions.map((action) => (
              <ActionItem key={action.id} action={action} packId={pack.id} packTitle={pack.title} />
            ))}
          </div>
          {hidden.length > 0 ? (
            <p className="mt-3 text-sm text-ink-faint">
              {hidden.length} step{hidden.length === 1 ? "" : "s"} hidden because of what you told
              us.{" "}
              <Link href="/settings" className="underline underline-offset-2">
                Change that
              </Link>
            </p>
          ) : null}
        </section>

        <CatchUp items={catchUpResult.items} stageLabel={pack.title} />

        {pack.alsoKnow.length > 0 ? (
          <section aria-labelledby="also-heading" className="mt-8">
            <h2 id="also-heading" className="font-display text-2xl text-ink">
              Also worth knowing
            </h2>
            <dl className="mt-3 space-y-4">
              {pack.alsoKnow.map((item) => (
                <div key={item.id}>
                  <dt className="text-base font-medium text-ink">{item.title}</dt>
                  <dd className="mt-1 text-base text-ink-muted">{item.body}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {pack.appointments.length > 0 ? (
          <section aria-labelledby="appointments-heading" className="mt-8">
            <h2 id="appointments-heading" className="font-display text-2xl text-ink">
              Appointments
            </h2>
            <ul className="mt-3 space-y-2">
              {pack.appointments.map((appointment) => (
                <li
                  key={appointment.id}
                  className="rounded-md border border-line bg-paper-raised p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base text-ink">{appointment.label}</span>
                    <Badge tone="neutral" className="tabular">
                      {appointment.from === appointment.to
                        ? `${appointment.from}`
                        : `${appointment.from}–${appointment.to}`}
                    </Badge>
                  </div>
                  {appointment.who ? (
                    <p className="mt-1 text-sm text-ink-muted">{appointment.who}</p>
                  ) : null}
                  {appointment.note ? (
                    <p className="mt-1 text-sm text-ink-faint">{appointment.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-8">
          <RedFlagList flags={pack.redFlags} />
        </div>

        <div className="mt-8">
          <SourceList
            sources={pack.sources}
            reviewedBy={pack.reviewedBy}
            reviewedAt={pack.reviewedAt}
          />
        </div>

        <nav
          aria-label="Other weeks"
          className="no-print mt-8 flex items-center justify-between gap-3 border-t border-line pt-5"
        >
          {previousId ? (
            <ButtonLink href={`/week/${previousId}`} variant="quiet" size="sm">
              ← Last one
            </ButtonLink>
          ) : (
            <span />
          )}
          {nextId ? (
            <ButtonLink href={`/week/${nextId}`} variant="secondary" size="sm">
              Next →
            </ButtonLink>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </AppShell>
  );
}
