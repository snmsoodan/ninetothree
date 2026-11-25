"use client";

import { useMemo } from "react";
import {
  CATEGORY_LABELS,
  RECALL_SEVERITY_RANK,
  ageWindowLabel,
  type Recall,
  type RecallCategory,
} from "@ninetothree/content";
import { Card, CardBody, TextLink } from "@ninetothree/ui";
import { AppShell } from "@/components/AppShell";
import { RecallNotice, type RecallNoticeItem } from "@/components/RecallNotice";
import { updatesFor } from "@/lib/recalls";
import { useAppState } from "@/lib/store";
import { useRecallFeed } from "@/lib/use-recall-feed";

/** The four places a parent can check for themselves. */
const OFFICIAL_SEARCHES = [
  {
    name: "Consumer Product Safety Commission",
    host: "cpsc.gov",
    detail: "Car seats, cots, high chairs, toys — everything that is not food or medicine.",
    url: "https://www.cpsc.gov/Recalls",
  },
  {
    name: "Food and Drug Administration",
    host: "fda.gov",
    detail: "Formula, baby food, medicines and anything that is eaten or swallowed.",
    url: "https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts",
  },
  {
    name: "National Highway Traffic Safety Administration",
    host: "nhtsa.gov",
    detail: "Car seats and vehicles, by make, model and year.",
    url: "https://www.nhtsa.gov/recalls",
  },
  {
    name: "Food Safety and Inspection Service",
    host: "fsis.usda.gov",
    detail: "Meat, poultry and egg products, which matters once a child is eating solids.",
    url: "https://www.fsis.usda.gov/recalls",
  },
] as const;

/**
 * How many recalls the page will show before it stops.
 *
 * The registers publish a few hundred records a quarter. That is a useful
 * database and a useless page: a parent scrolling two hundred entries learns
 * nothing about the twelve that could reach their child. The list is sorted by
 * severity, so the cut is at the calm end, and the count is stated rather than
 * hidden — "we are showing you the worst of these" is honest, a silent `slice`
 * is not.
 */
const SHOW_AT_MOST = 12;

function monthsLabel(months: number): string {
  if (months < 0) return `${Math.abs(months)} months to go`;
  if (months === 0) return "just born";
  return `${months} months old`;
}

type Reason = RecallNoticeItem["because"];

function toItem(recall: Recall, because: Reason, matchedOn = ""): RecallNoticeItem {
  return {
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
  };
}

/** Stop-use first, then the most recent. The same order the age filter uses. */
function bySeverityThenDate(a: Recall, b: Recall): number {
  return (
    RECALL_SEVERITY_RANK[a.severity] - RECALL_SEVERITY_RANK[b.severity] ||
    b.publishedAt.localeCompare(a.publishedAt)
  );
}

export default function UpdatesPage() {
  const state = useAppState();
  const today = new Date().toISOString().slice(0, 10);
  const { feed, loading } = useRecallFeed();
  const updates = useMemo(
    () => updatesFor(state, feed.recalls, today),
    [state, feed.recalls, today],
  );

  const categories = useMemo(() => {
    const seen = new Set<RecallCategory>();
    for (const item of updates?.items ?? []) seen.add(item.recall.category);
    return [...seen];
  }, [updates]);

  // No dates means no window, not an empty page: a parent deciding whether to
  // sign up should be able to read the list, and "Everything we know" has to
  // mean what it says.
  const items = useMemo(
    () =>
      updates
        ? updates.items
        : [...feed.recalls].sort(bySeverityThenDate).map((recall) => ({ recall, mine: null })),
    [updates, feed.recalls],
  );
  const shown = items.slice(0, SHOW_AT_MOST);
  const missing = feed.sources.filter((source) => !source.ok);
  const checked = feed.live ? feed.fetchedAt.slice(0, 10) : "";

  return (
    <AppShell stage="Updates">
      <div className="measure">
        <h1 className="font-display text-3xl text-ink">Updates</h1>
        <p className="mt-2 text-base text-ink-muted">
          Recalls from the product and food registers, and which of them apply where you are.
        </p>

        <Card tone="sunken" className="mt-6">
          <CardBody className="pt-5">
            {loading ? (
              <p className="text-base text-ink">Checking the registers.</p>
            ) : feed.live ? (
              <p className="text-base text-ink">
                Checked against the official registers every hour.
              </p>
            ) : (
              <p className="text-base text-ink">
                The registers are not answering us right now, so this is the list we have read and
                checked ourselves.
              </p>
            )}
            <p className="mt-1 text-base text-ink-muted">
              The CPSC and the FDA are polled for anything that could reach a baby, and we write
              what to do about each one ourselves. Car-seat campaigns are added by hand: NHTSA
              publishes no list we can read. Every entry links to the register it came from, so you
              can read the original.
            </p>
            <TextLink href="#check-it-yourself" className="mt-3 inline-block text-sm">
              Check it yourself
            </TextLink>
          </CardBody>
        </Card>

        {checked ? (
          <p className="mt-3 text-sm text-ink-faint">
            {checked === today ? "Registers checked today." : `Registers checked on ${checked}.`}
            {missing.length > 0
              ? ` ${missing.map((source) => source.name).join(" and ")} did not answer, so some recalls may be missing until we try again.`
              : ""}
          </p>
        ) : null}

        {updates === null ? (
          <p className="mt-8 text-base text-ink-muted">
            Once you tell us your due date or your baby&rsquo;s birthday, this page narrows to the
            ages that matter.
          </p>
        ) : (
          <p className="mt-6 text-sm text-ink-faint">
            Showing what applies at {monthsLabel(updates.months)}.
            {items.length > shown.length
              ? ` The ${SHOW_AT_MOST} most serious of ${items.length}.`
              : ""}
          </p>
        )}

        {categories.length > 0 ? (
          <p className="mt-2 text-sm text-ink-faint">
            {categories.map((category) => CATEGORY_LABELS[category]).join(" · ")}
          </p>
        ) : null}

        <section aria-labelledby="relevant-heading" className="mt-8">
          <h2 id="relevant-heading" className="font-display text-2xl text-ink">
            {updates === null ? "Everything we know" : "For this age"}
          </h2>

          {shown.length === 0 ? (
            <Card tone="sunken" className="mt-3">
              <CardBody className="pt-5">
                <p className="text-base text-ink">Nothing right now.</p>
                <p className="mt-1 text-base text-ink-muted">
                  No recall on our list applies at this age. We add to it as agencies publish, and
                  you can search them yourself below.
                </p>
              </CardBody>
            </Card>
          ) : (
            <ul className="mt-3 space-y-3">
              {shown.map(({ recall, mine }) => (
                <li key={recall.id}>
                  <RecallNotice
                    notice={toItem(recall, mine?.because ?? "list", mine?.matchedOn)}
                    meta={`${CATEGORY_LABELS[recall.category]} · ${ageWindowLabel(recall.ages)}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="check-it-yourself" className="mt-10">
          <h2 id="check-it-yourself" className="font-display text-2xl text-ink">
            Check it yourself
          </h2>
          <p className="mt-2 text-base text-ink-muted">
            Four registers, all free, all searchable by product name. A recall reaches these before
            it reaches us.
          </p>
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
          Something wrong with a product that is not on this list?{" "}
          <TextLink href="https://www.saferproducts.gov/IncidentReporting" external>
            Report it at saferproducts.gov
          </TextLink>
          . It is how most recalls start.
        </p>
      </div>
    </AppShell>
  );
}
