import {
  CATEGORY_LABELS,
  RECALLS,
  RECALL_SEVERITY_RANK,
  ageWindowLabel,
  type Recall,
  type RecallBecause,
  type RecallCategory,
  type RecallSeverity,
} from "@ninetothree/content";

import type { RecallFeed, RecallSourceStatus } from "@ninetothree/contracts";

import type { AppState } from "./model";
import { updatesFor } from "./recalls";

/**
 * The updates page, decided once.
 *
 * The browser and the phone read the same registers and must not draw
 * different conclusions from them: whether the list is live or curated,
 * whether it is narrowed to an age, how many of how many are shown, and what
 * the page says when there is nothing to say. All of that is a function of the
 * feed and the parent's dates, so it lives here rather than in either screen.
 */

/** A feed source that did or did not answer, as `/api/updates` reports it. */
export type FeedSource = RecallSourceStatus;

/** What `/api/updates` returns. */
export type Feed = RecallFeed;

/**
 * The list before the request lands — and after it fails.
 *
 * A parent never sees a spinner where a recall should be, and never sees the
 * list change from empty to full: the curated nine are already correct, and
 * the live ones are added when they arrive.
 */
export function curatedFeed(): Feed {
  return { recalls: RECALLS, sources: [], live: false, fetchedAt: "" };
}

/** The four places a parent can check for themselves. */
export const OFFICIAL_SEARCHES = [
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
export const SHOW_AT_MOST = 12;

export const SEVERITY_LABEL: Record<RecallSeverity, string> = {
  "stop-use": "Stop using it",
  check: "Check yours",
  info: "Worth knowing",
};

/** `age` is the window saying this applies now; `list` is the unfiltered list. */
export type NoticeReason = RecallBecause | "age" | "list";

/**
 * Why this reached them, in the parent's own terms.
 *
 * A recall that arrives with no explanation reads as a mailing list. "You
 * pinned this step" is the product saying "I remembered what you told me".
 */
export const BECAUSE_COPY: Record<NoticeReason, string> = {
  option: "You chose this.",
  step: "You pinned this step.",
  keyword: "You pinned a step about this.",
  age: "Worth knowing at this age.",
  list: "On the list we keep.",
};

/** The page's words. */
export const UPDATES_HEADING = "Updates";
export const UPDATES_INTRO =
  "Recalls from the product and food registers, and which of them apply where you are.";
export const UPDATES_CHECKING = "Checking the registers.";
export const UPDATES_LIVE = "Checked against the official registers every hour.";
export const UPDATES_OFFLINE =
  "The registers are not answering us right now, so this is the list we have read and checked ourselves.";
export const UPDATES_HOW =
  "The CPSC and the FDA are polled for anything that could reach a baby, and we write what to do about each one ourselves. Car-seat campaigns are added by hand: NHTSA publishes no list we can read. Every entry links to the register it came from, so you can read the original.";
export const UPDATES_CHECK_LINK = "Check it yourself";
export const UPDATES_FOR_AGE = "For this age";
export const UPDATES_EVERYTHING = "Everything we know";
export const UPDATES_EMPTY_TITLE = "Nothing right now.";
export const UPDATES_EMPTY_BODY =
  "No recall on our list applies at this age. We add to it as agencies publish, and you can search them yourself below.";
export const UPDATES_NO_DATES =
  "Once you tell us your due date or your baby’s birthday, this page narrows to the ages that matter.";
export const UPDATES_SEARCHES_HEADING = "Check it yourself";
export const UPDATES_SEARCHES_INTRO =
  "Four registers, all free, all searchable by product name. A recall reaches these before it reaches us.";
export const UPDATES_REPORT_LEAD = "Something wrong with a product that is not on this list?";
export const UPDATES_REPORT_LINK = "Report it at saferproducts.gov";
export const UPDATES_REPORT_TAIL = ". It is how most recalls start.";
export const UPDATES_REPORT_URL = "https://www.saferproducts.gov/IncidentReporting";

export function monthsLabel(months: number): string {
  if (months < 0) return `${Math.abs(months)} months to go`;
  if (months === 0) return "just born";
  return `${months} months old`;
}

function formatCalendarDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ] as const;
  return `${months[month - 1]} ${day}, ${year}`;
}

export function announcedOn(iso: string): string {
  return formatCalendarDay(iso);
}

/** Stop-use first, then the most recent. The same order the age filter uses. */
export function bySeverityThenDate(a: Recall, b: Recall): number {
  return (
    RECALL_SEVERITY_RANK[a.severity] - RECALL_SEVERITY_RANK[b.severity] ||
    b.publishedAt.localeCompare(a.publishedAt)
  );
}

export interface UpdatesItem {
  recall: Recall;
  because: NoticeReason;
  /** The option id, action id, or keyword that made the match. */
  matchedOn: string;
  /** `Category · birth to 6 months`. */
  meta: string;
}

export interface UpdatesModel {
  /** The sentence at the top of the card. */
  status: string;
  /** "Registers checked today." plus anything that did not answer. */
  checkedLine: string;
  /** "Showing what applies at 3 months old. The 12 most serious of 40." */
  windowLine: string;
  /** Which ages the list covers, or the invitation to add dates. */
  scopeLine: string;
  /** "Sleep · Travel", deduplicated. */
  categoriesLine: string;
  heading: string;
  items: UpdatesItem[];
  shown: UpdatesItem[];
  total: number;
  /** True when the page is showing fewer than it has, and says so. */
  truncated: boolean;
  /** True when there are no dates, so the list is the whole list. */
  unfiltered: boolean;
}

/**
 * Everything the updates screen needs, or null while there is nothing to say
 * beyond the status card.
 */
export function updatesModel(input: {
  state: AppState;
  feed: Feed;
  loading: boolean;
  today: string;
}): UpdatesModel {
  const { state, feed, loading, today } = input;
  const updates = updatesFor(state, feed.recalls, today);

  const categories = new Set<RecallCategory>();
  for (const item of updates?.items ?? []) categories.add(item.recall.category);

  // No dates means no window, not an empty page: a parent deciding whether to
  // sign up should be able to read the list, and "Everything we know" has to
  // mean what it says.
  const items: UpdatesItem[] = updates
    ? updates.items.map((item) => ({
        recall: item.recall,
        because: item.mine?.because ?? "list",
        matchedOn: item.mine?.matchedOn ?? "",
        meta: `${CATEGORY_LABELS[item.recall.category]} · ${ageWindowLabel(item.recall.ages)}`,
      }))
    : [...feed.recalls].sort(bySeverityThenDate).map((recall) => ({
        recall,
        because: "list" as const,
        matchedOn: "",
        meta: `${CATEGORY_LABELS[recall.category]} · ${ageWindowLabel(recall.ages)}`,
      }));

  const shown = items.slice(0, SHOW_AT_MOST);
  const missing = feed.sources.filter((source) => !source.ok);
  const checked = feed.live ? feed.fetchedAt.slice(0, 10) : "";

  let checkedLine = "";
  if (checked) {
    const when =
      checked === today ? "Registers checked today." : `Registers checked on ${checked}.`;
    checkedLine =
      missing.length > 0
        ? `${when} ${missing.map((source) => source.name).join(" and ")} did not answer, so some recalls may be missing until we try again.`
        : when;
  }

  let windowLine = "";
  if (updates) {
    const cut =
      items.length > shown.length ? ` The ${SHOW_AT_MOST} most serious of ${items.length}.` : "";
    windowLine = `Showing what applies at ${monthsLabel(updates.months)}.${cut}`;
  }

  return {
    status: loading ? UPDATES_CHECKING : feed.live ? UPDATES_LIVE : UPDATES_OFFLINE,
    checkedLine,
    windowLine,
    scopeLine: updates ? "" : UPDATES_NO_DATES,
    categoriesLine: [...categories].map((category) => CATEGORY_LABELS[category]).join(" · "),
    heading: updates ? UPDATES_FOR_AGE : UPDATES_EVERYTHING,
    items,
    shown,
    total: items.length,
    truncated: items.length > shown.length,
    unfiltered: updates === null,
  };
}
