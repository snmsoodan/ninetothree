import {
  CATEGORY_LABELS,
  ageWindowLabel,
  type Recall,
  type RecallBecause,
} from "@ninetothree/content";
import { ACTION_INDEX } from "@ninetothree/content/action-index";
import { PACK_INDEX, findPackAtOrBefore, nextPackIndex } from "@ninetothree/content/pack-index";
import { lensFor } from "@ninetothree/content/core";
import { findPersonaViews } from "@ninetothree/content/persona-index";
import {
  datedAppointments,
  dueReminders,
  localDate,
  reminderKey,
  resolvePins,
  stageInput,
  unseen,
  updatesFor,
  visibleNotices,
  weekProgress,
  type AppState,
} from "@ninetothree/domain";
import { computeStage, stageLabel } from "@ninetothree/rules";

/**
 * Today, as data.
 *
 * The web dashboard is a React component and the phone cannot render it, so
 * what both clients actually owe the parent is spelled out here instead: the
 * eleven blocks, in order, with the copy each one carries when it is full and
 * the copy it carries when it is empty. The screen is then mechanical.
 *
 * Everything in this file is a pure function of `AppState` and the date. There
 * is no fetch, no clock read and no `window`: a test can say "it is the ninth
 * of March, this parent is in week 28, and the visit is today" and assert on
 * the list that comes back.
 */

export interface TodayJob {
  id: string;
  title: string;
  packTitle: string | null;
}

export interface TodayInput {
  state: AppState;
  /** ISO date, YYYY-MM-DD. The parent's local day, not UTC. */
  today: string;
  /** The moment the screen was opened, for the reminder window. */
  now: Date;
  /** The feed in hand. The curated set until the live one arrives. */
  recalls: Recall[];
  /** Household members including this parent. Zero until the server answers. */
  people?: number;
  jobs?: TodayJob[];
  sharedIds?: string[];
}

export interface ReminderItem {
  id: string;
  title: string;
  detail: string;
}

export interface RecallItem {
  id: string;
  title: string;
  product: string;
  hazard: string;
  action: string;
  /** "stop-use" | "check" | "info", in the feed's own words. */
  severity: Recall["severity"];
  because: string;
  matchedOn: string;
  publishedAt: string;
  sourceUrl: string;
  sourceTitle: string;
}

export interface UpdateItem {
  id: string;
  title: string;
  product: string;
  severity: Recall["severity"];
  category: string;
  window: string;
  sourceUrl: string;
}

export interface PinRow {
  id: string;
  title: string;
  packId: string;
  packTitle: string;
  stale: boolean;
  remindOn: string | null;
  shared: boolean;
}

export interface AppointmentRow {
  id: string;
  label: string;
  window: string;
  who: string | null;
  note: string | null;
}

export type TodayBlock =
  | {
      kind: "reminders";
      heading: string;
      groups: { label: string; items: ReminderItem[] }[];
    }
  | {
      kind: "quiet";
      heading: string;
      lines: string[];
      primary: string;
      secondary: string;
    }
  | {
      kind: "week";
      packId: string;
      badge: string;
      count: string;
      title: string;
      subtitle: string | null;
      percent: number;
      progressLabel: string;
      finished: boolean;
      finishedHeading: string;
      finishedBody: string;
      primary: string;
      secondary: string;
    }
  | {
      kind: "lens";
      packId: string;
      band: string | null;
      heading: string;
      body: string;
      actions: { id: string; title: string }[];
      suggestions: { id: string; title: string; minutes: number | null; why: string }[];
      light: string | null;
      link: string;
    }
  | {
      kind: "recalls";
      heading: string;
      items: RecallItem[];
      empty: { heading: string; body: string; link: string };
    }
  | {
      kind: "updates";
      heading: string;
      at: string;
      items: UpdateItem[];
      more: string;
    }
  | {
      kind: "pins";
      heading: string;
      seeAll: string;
      items: PinRow[];
      hidden: number;
      empty: { heading: string; body: string; link: string };
    }
  | {
      kind: "jobs";
      heading: string;
      items: { id: string; title: string; packTitle: string | null }[];
      link: string;
    }
  | { kind: "together"; heading: string; body: string; link: string }
  | {
      kind: "appointments";
      heading: string;
      link: string;
      items: AppointmentRow[];
      empty: { heading: string; body: string };
    }
  | { kind: "share"; heading: string; body: string; button: string }
  | { kind: "progress"; heading: string; line: string };

export interface TodayModel {
  /**
   * `loading` until the state has been read once and the dates are known;
   * `empty` when the guide has nothing at this stage; `ready` otherwise.
   */
  status: "loading" | "empty" | "ready";
  /** The stage label, e.g. "Week 28". Null while loading. */
  stage: string | null;
  blocks: TodayBlock[];
}

/** How many pins the dashboard shows before pointing at the shelf. */
export const PIN_LIMIT = 6;
/** How many age-matched recalls the card shows before the rest go to Updates. */
export const UPDATE_LIMIT = 3;

export const UNKNOWN: TodayModel = { status: "loading", stage: null, blocks: [] };

export const EMPTY_WEEK: TodayModel = {
  status: "empty",
  stage: null,
  blocks: [
    {
      kind: "progress",
      heading: "Nothing for this week yet",
      line: "We are still writing this one. Your last guide is still on your shelf.",
    },
  ],
};

/** "9 Mar", for a pin's reminder day. */
export function formatDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(year, month - 1, day),
  );
}

/** "9 months old", or "3 months to go" before birth. */
export function monthsLabel(months: number): string {
  if (months < 0) return `${Math.abs(months)} months to go`;
  if (months === 0) return "just born";
  return `${months} months old`;
}

function plural(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

/**
 * The reason a recall reached this parent, in the web's own words.
 *
 * A pin is not a reason here: a recall reaches a parent through something they
 * chose, a step they pinned, or a word in a step. `RecallBecause` is the
 * closed list, and typing this record against it stops the two drifting.
 */
const BECAUSE: Record<RecallBecause, string> = {
  option: "You chose this.",
  step: "You pinned this step.",
  keyword: "You pinned a step about this.",
};

function toRecallItem(
  notice: { id: string; recallId: string; because: RecallBecause; matchedOn: string },
  recall: Recall,
): RecallItem {
  return {
    id: notice.id,
    title: recall.title,
    product: recall.product,
    hazard: recall.hazard,
    action: recall.action,
    severity: recall.severity,
    because: BECAUSE[notice.because] ?? "This is yours",
    matchedOn: notice.matchedOn,
    publishedAt: recall.publishedAt,
    sourceUrl: recall.source.url,
    sourceTitle: recall.source.title,
  };
}

export function windowLabel(from: number, to: number, unit: "week" | "month" | "day"): string {
  const noun = unit === "month" ? "month" : unit === "day" ? "day" : "week";
  if (from === to) return `${noun} ${from}`;
  return `${noun}s ${from}–${to}`;
}

/**
 * The screen, block by block.
 *
 * The order is the page: a date that is almost here, then what this week asks
 * of you, then everything that is quieter. Only the week card has a filled
 * button, so a parent scanning at 3am sees one thing to press.
 */
export function todayModel(input: TodayInput): TodayModel {
  const { state, today, now, recalls } = input;
  const people = input.people ?? 0;
  const jobs = input.jobs ?? [];
  const sharedIds = input.sharedIds ?? [];

  const stageOf = stageInput(state);
  if (!stageOf) return UNKNOWN;

  const stage = computeStage(stageOf, today);
  const label = stageLabel(stage);
  const pack = findPackAtOrBefore(stage.kind, stage.index);
  if (!pack) return { ...EMPTY_WEEK, stage: label };

  const blocks: TodayBlock[] = [];

  const reminders = dueReminders(
    { appointments: datedAppointments(state, localDate(now)), pins: state.pins },
    now,
  );
  const groups = [
    { label: "Tomorrow", items: unseen(reminders.tomorrow, state.reminded) },
    { label: "Today", items: unseen(reminders.today, state.reminded) },
  ].filter((group) => group.items.length > 0);
  if (groups.length > 0) {
    blocks.push({
      kind: "reminders",
      heading: "Coming up",
      groups: groups.map((group) => ({
        label: group.label,
        items: group.items.map((reminder) => ({
          // The id is the reminder's key, so dismissing the card writes the
          // same string `unseen` filters on rather than the bare pin id.
          id: reminderKey(reminder),
          title: reminder.title,
          detail: reminder.detail,
        })),
      })),
    });
  }

  const quiet = state.profile.loss !== undefined;
  const progress = weekProgress(pack, state);

  if (quiet) {
    blocks.push({
      kind: "quiet",
      heading: "The weekly guide is paused.",
      lines: [
        "You told us about a loss. We have stopped showing the week, and we have stopped sending the weekly email.",
        "Nothing you wrote down has been deleted. The safety page is still here, and so is everything you pinned.",
      ],
      primary: "Open the safety page",
      secondary: "Change this in settings",
    });
  } else if (state.persona === "parent") {
    blocks.push({
      kind: "week",
      packId: pack.id,
      badge: label,
      count: `${progress.settled} of ${progress.total}`,
      title: pack.title,
      subtitle: pack.subtitle ?? null,
      percent: progress.percent,
      progressLabel: `${progress.settled} of ${progress.total} steps done or skipped`,
      finished: progress.finished,
      finishedHeading: "That's this week.",
      finishedBody: "Nothing else to do until Monday.",
      primary: "Open this week",
      secondary: progress.finished ? "Read it again" : "Look ahead",
    });
  } else {
    const lens = lensFor({ ...pack, personas: findPersonaViews(pack.id) }, state.persona, {
      enabled: state.humour && !quiet,
    });
    blocks.push({
      kind: "lens",
      packId: pack.id,
      band: lens.source === "track" ? lens.bandLabel : null,
      heading: lens.headline,
      body: lens.body,
      actions: lens.actions.map((action) => ({ id: action.id, title: action.title })),
      suggestions: lens.suggestions.map((suggestion) => ({
        id: suggestion.id,
        title: suggestion.title,
        minutes: suggestion.minutes ?? null,
        why: suggestion.why,
      })),
      light: lens.light ?? null,
      link: "Read this week in full",
    });
  }

  const byId = new Map(recalls.map((recall) => [recall.id, recall]));
  const notices = visibleNotices(state)
    .map((notice) => {
      const recall = byId.get(notice.recallId);
      return recall ? toRecallItem(notice, recall) : null;
    })
    .filter((item): item is RecallItem => item !== null);
  blocks.push({
    kind: "recalls",
    heading: "Recalls",
    items: notices,
    empty: {
      heading: "Nothing recalled.",
      body: "We check the things you pinned and chose against new recalls. If one of them is affected, it shows up here.",
      link: "See what you can pin",
    },
  });

  const updates = updatesFor(state, recalls, today);
  if (updates) {
    // Anything already in the queue above is not repeated: the same recall
    // twice on one screen reads as a system that is not paying attention.
    const theirs = updates.items.filter((item) => item.mine === null);
    if (theirs.length > 0) {
      const shown = theirs.slice(0, UPDATE_LIMIT);
      const rest = theirs.length - shown.length;
      blocks.push({
        kind: "updates",
        heading: "Worth knowing now",
        at: `at ${monthsLabel(updates.months)}`,
        items: shown.map(({ recall }) => ({
          id: recall.id,
          title: recall.title,
          product: recall.product,
          severity: recall.severity,
          category: CATEGORY_LABELS[recall.category],
          window: ageWindowLabel(recall.ages),
          sourceUrl: recall.source.url,
        })),
        more: rest > 0 ? `And ${rest} more in Updates` : "All updates",
      });
    }
  }

  const pins: PinRow[] = resolvePins(state.pins, ACTION_INDEX).map((pin) => ({
    id: pin.id,
    title: pin.title,
    packId: pin.packId,
    packTitle: pin.packTitle,
    stale: pin.stale,
    remindOn: pin.remindOn ?? null,
    shared: sharedIds.includes(pin.id),
  }));
  const shownPins = pins.slice(0, PIN_LIMIT);
  blocks.push({
    kind: "pins",
    heading: "Pinned",
    seeAll: "See all",
    items: shownPins,
    hidden: pins.length - shownPins.length,
    empty: {
      heading: "Nothing pinned yet.",
      body: "Pin the things you keep needing — the pediatrician's number, your birth preferences, the safe-sleep checklist.",
      link: "See what you can pin",
    },
  });

  if (jobs.length > 0) {
    blocks.push({
      kind: "jobs",
      heading: jobs.length === 1 ? "One thing for you" : `${jobs.length} things for you`,
      items: jobs.map((job) => ({ id: job.id, title: job.title, packTitle: job.packTitle })),
      link: "Open Together",
    });
  }

  if (people > 1) {
    blocks.push({
      kind: "together",
      heading: "Together",
      body: `${people} people share these dates. See what this week asks of them, and what you have chosen to share.`,
      link: "Open Together",
    });
  }

  blocks.push({
    kind: "appointments",
    heading: "Appointments",
    link: "See the whole schedule",
    items: pack.appointments.map((appointment) => ({
      id: appointment.id,
      label: appointment.label,
      window: windowLabel(appointment.from, appointment.to, pack.stageUnit),
      who: appointment.who ?? null,
      note: appointment.note ?? null,
    })),
    empty: {
      heading: "Nothing booked in this stretch.",
      body: "We will add them here as they come up, so you are not counting weeks in your head.",
    },
  });

  blocks.push({
    kind: "share",
    heading: "Bringing someone with you",
    body: "Send them this week. They will see the same page you do — no account, nothing to set up.",
    button: `Share ${label}`,
  });

  const settled = Object.values(state.progress).filter(
    (entry) => entry.status === "done" || entry.status === "skipped",
  ).length;
  const weeksDone = PACK_INDEX.filter(
    (candidate) =>
      candidate.coreActionIds.length > 0 &&
      candidate.coreActionIds.every((id) => {
        const status = state.progress[id]?.status;
        return status === "done" || status === "skipped";
      }),
  ).length;

  blocks.push({
    kind: "progress",
    heading: "So far",
    line:
      weeksDone === 0 && settled === 0
        ? "Nothing yet. That is fine — this is the first one."
        : `You have finished ${plural(weeksDone, "week")} and ${plural(settled, "step")}.`,
  });

  return { status: "ready", stage: label, blocks };
}

/** The week the parent would look at next, when this one is finished. */
export function aheadOf(state: AppState, today: string): string | null {
  const stageOf = stageInput(state);
  if (!stageOf) return null;
  const stage = computeStage(stageOf, today);
  const pack = findPackAtOrBefore(stage.kind, stage.index);
  if (!pack) return null;
  const ahead = nextPackIndex(pack);
  return ahead ? ahead.id : null;
}

/**
 * How the eleven blocks are arranged.
 *
 * `compact` stacks them; `medium` puts the short cards two across so a tablet
 * does not look like a stretched phone; `expanded` splits the page into the
 * week and everything else, the way a book opens. The blocks themselves are
 * identical in all three — only the frame moves.
 */
export type TodayLayout = "compact" | "regular" | "medium" | "expanded";

export interface Arrangement {
  /** Blocks whose width is shared with a neighbour. */
  single: TodayBlock[];
  /** Blocks that pair up two across. */
  paired: TodayBlock[];
  /** The blocks in the second pane on an unfolded screen. */
  second: TodayBlock[];
  columns: 1 | 2;
}

const FIRST_PANE = new Set<TodayBlock["kind"]>([
  "reminders",
  "week",
  "quiet",
  "lens",
  "recalls",
  "updates",
]);

export function arrange(blocks: TodayBlock[], layout: TodayLayout): Arrangement {
  if (layout === "expanded") {
    return {
      single: blocks.filter((block) => FIRST_PANE.has(block.kind)),
      paired: [],
      second: blocks.filter((block) => !FIRST_PANE.has(block.kind)),
      columns: 1,
    };
  }
  if (layout === "medium") {
    return {
      single: blocks,
      paired: blocks.filter((block) => !FIRST_PANE.has(block.kind)),
      second: [],
      columns: 2,
    };
  }
  return { single: blocks, paired: [], second: [], columns: 1 };
}
