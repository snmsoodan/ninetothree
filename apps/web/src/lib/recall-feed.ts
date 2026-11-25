import { RECALLS, mergeRecalls, type Recall } from "@ninetothree/content";

import { FEED_WINDOW_DAYS, daysBefore, normalizeCpsc, normalizeFda } from "./recall-sources";

/**
 * The updates feed: two agency registers, polled, cached, and merged with the
 * recalls a person read and wrote up by hand.
 *
 * The shape is deliberate. **Discovery is live, advice is curated.** The
 * agencies are the only ones who can tell us a product was recalled this
 * morning, and they do it well; nobody at an agency can tell a parent what to
 * do about a cot in the same breath. So the feed takes facts from CPSC and the
 * FDA, and the nine curated entries — with their written actions and their
 * pinned-step matches — stay in front of it, winning any collision.
 *
 * **It never fails.** If both registers are unreachable the feed is the
 * curated list, `live` is false, and the page says so; a parent looking for a
 * recall gets the nine we know rather than an error page. That also makes the
 * whole thing testable without a network, which is what `RECALLS_OFFLINE` is
 * for.
 *
 * **No user input reaches a URL.** Both addresses are built from constants, so
 * there is nothing here to point somewhere else.
 */

export const FEED_REVALIDATE_SECONDS = 3600;

const USER_AGENT = "NineToThreeRecallFeed/1.0 (+https://ninetothree.com; recall monitoring)";
const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 8_000_000;

export type RecallSourceId = "cpsc" | "fda";

export interface RecallSourceStatus {
  id: RecallSourceId;
  name: string;
  ok: boolean;
  /** How many records this source contributed after filtering. */
  count: number;
  /** Why it failed, in words a support engineer can act on. */
  error?: string;
}

export interface RecallFeed {
  recalls: Recall[];
  sources: RecallSourceStatus[];
  /** False when at least one register did not answer and the list is partial. */
  live: boolean;
  /** ISO timestamp the feed was assembled, or empty when it was not. */
  fetchedAt: string;
}

/** Whether the feed is allowed to touch the network. Read per call, not per module. */
export function isOffline(): boolean {
  return process.env.RECALLS_OFFLINE === "1";
}

export function cpscUrl(today: string): string {
  const start = daysBefore(today, FEED_WINDOW_DAYS);
  return `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=${start}`;
}

export function fdaUrl(today: string): string {
  const start = daysBefore(today, FEED_WINDOW_DAYS).replace(/-/g, "");
  const end = today.replace(/-/g, "");
  return `https://api.fda.gov/food/enforcement.json?search=report_date:[${start}+TO+${end}]&limit=100`;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    // Cached for an hour on the server: the registers publish a handful of
    // recalls a week, and hammering a public API on every page view is how a
    // useful endpoint becomes a blocked one.
    next: { revalidate: FEED_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.text();
  if (body.length > MAX_BYTES) throw new Error("response was too large to be a recall list");
  return JSON.parse(body) as unknown;
}

interface SourcePlan {
  id: RecallSourceId;
  name: string;
  url: (today: string) => string;
  normalize: (body: unknown, today: string) => Recall[];
}

const SOURCES: SourcePlan[] = [
  {
    id: "cpsc",
    name: "Consumer Product Safety Commission",
    url: cpscUrl,
    normalize: normalizeCpsc,
  },
  {
    id: "fda",
    name: "Food and Drug Administration",
    url: fdaUrl,
    normalize: normalizeFda,
  },
];

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.name === "TimeoutError" ? "the register did not answer in time" : error.message;
  }
  return "the register could not be read";
}

export interface FeedOptions {
  today: string;
  /** Overrides the environment flag; used by tests. */
  offline?: boolean;
}

/**
 * Both registers at once, then merged with the curated list.
 *
 * One register failing does not fail the feed — it is reported per source so
 * the page can say which one is missing rather than quietly showing less.
 */
export async function getRecallFeed({ today, offline }: FeedOptions): Promise<RecallFeed> {
  if (offline ?? isOffline()) {
    return { recalls: RECALLS, sources: [], live: false, fetchedAt: "" };
  }

  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const body = await fetchJson(source.url(today));
      return source.normalize(body, today);
    }),
  );

  const sources: RecallSourceStatus[] = [];
  const live: Recall[] = [];

  results.forEach((result, index) => {
    const source = SOURCES[index] as SourcePlan;
    if (result.status === "fulfilled") {
      live.push(...result.value);
      sources.push({ id: source.id, name: source.name, ok: true, count: result.value.length });
      return;
    }
    sources.push({
      id: source.id,
      name: source.name,
      ok: false,
      count: 0,
      error: errorMessage(result.reason),
    });
  });

  const anyLive = sources.some((source) => source.ok);
  return {
    recalls: mergeRecalls(RECALLS, live),
    sources,
    live: anyLive,
    // Only claim a check when a register actually answered.
    fetchedAt: anyLive ? new Date().toISOString() : "",
  };
}
