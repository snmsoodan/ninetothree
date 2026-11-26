"use client";

import { useMemo } from "react";
import {
  OFFICIAL_SEARCHES,
  UPDATES_CHECK_LINK,
  UPDATES_EMPTY_BODY,
  UPDATES_EMPTY_TITLE,
  UPDATES_HEADING,
  UPDATES_HOW,
  UPDATES_INTRO,
  UPDATES_REPORT_LEAD,
  UPDATES_REPORT_LINK,
  UPDATES_REPORT_TAIL,
  UPDATES_REPORT_URL,
  UPDATES_SEARCHES_HEADING,
  UPDATES_SEARCHES_INTRO,
  updatesModel,
} from "@ninetothree/domain";
import { Card, CardBody, TextLink } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";
import { RecallNotice } from "@/components/RecallNotice";
import { useAppState } from "@/lib/store";
import { useRecallFeed } from "@/lib/use-recall-feed";

export default function UpdatesPage() {
  const state = useAppState();
  const today = new Date().toISOString().slice(0, 10);
  const { feed, loading } = useRecallFeed();
  const model = useMemo(
    () => updatesModel({ state, feed, loading, today }),
    [state, feed, loading, today],
  );

  return (
    <AppShell stage="Updates">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">{UPDATES_HEADING}</h1>
        <p className="mt-2 text-base text-ink-muted">{UPDATES_INTRO}</p>

        <Card tone="sunken" className="mt-6">
          <CardBody className="pt-5">
            <p className="text-base text-ink">{model.status}</p>
            <p className="mt-1 text-base text-ink-muted">{UPDATES_HOW}</p>
            <TextLink href="#check-it-yourself" className="mt-3 inline-block text-sm">
              {UPDATES_CHECK_LINK}
            </TextLink>
          </CardBody>
        </Card>

        {model.checkedLine ? (
          <p className="mt-3 text-sm text-ink-faint">{model.checkedLine}</p>
        ) : null}

        {model.scopeLine ? (
          <p className="mt-8 text-base text-ink-muted">{model.scopeLine}</p>
        ) : (
          <p className="mt-6 text-sm text-ink-faint">{model.windowLine}</p>
        )}

        {model.categoriesLine ? (
          <p className="mt-2 text-sm text-ink-faint">{model.categoriesLine}</p>
        ) : null}

        <section aria-labelledby="relevant-heading" className="mt-8">
          <h2 id="relevant-heading" className="font-display text-2xl text-ink">
            {model.heading}
          </h2>

          {model.shown.length === 0 ? (
            <Card tone="sunken" className="mt-3">
              <CardBody className="pt-5">
                <p className="text-base text-ink">{UPDATES_EMPTY_TITLE}</p>
                <p className="mt-1 text-base text-ink-muted">{UPDATES_EMPTY_BODY}</p>
              </CardBody>
            </Card>
          ) : (
            <ul className="mt-3 space-y-3">
              {model.shown.map(({ recall, because, matchedOn, meta }) => (
                <li key={recall.id}>
                  <RecallNotice
                    notice={{
                      id: recall.id,
                      title: recall.title,
                      product: recall.product,
                      hazard: recall.hazard,
                      action: recall.action,
                      severity: recall.severity,
                      because,
                      matchedOn,
                      publishedAt: recall.publishedAt,
                      source: recall.source,
                    }}
                    meta={meta}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="check-it-yourself" className="mt-10">
          <h2 id="check-it-yourself" className="font-display text-2xl text-ink">
            {UPDATES_SEARCHES_HEADING}
          </h2>
          <p className="mt-2 text-base text-ink-muted">{UPDATES_SEARCHES_INTRO}</p>
          <ul className="mt-3 space-y-2">
            {OFFICIAL_SEARCHES.map((source) => (
              <li key={source.url}>
                <Card tone="sunken">
                  <CardBody className="pt-5">
                    <TextLink href={source.url} external className="text-base">
                      {source.name} · {source.host}
                    </TextLink>
                    <p className="mt-1 text-sm text-ink-muted">{source.detail}</p>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-sm text-ink-faint">
          {UPDATES_REPORT_LEAD}{" "}
          <TextLink href={UPDATES_REPORT_URL} external>
            {UPDATES_REPORT_LINK}
          </TextLink>
          {UPDATES_REPORT_TAIL}
        </p>
      </div>
    </AppShell>
  );
}
