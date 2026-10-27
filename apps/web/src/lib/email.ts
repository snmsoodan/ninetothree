/**
 * The weekly email: what it says, when it goes, and why it might not.
 *
 * There is no transport in this version. What ships is the content model, the
 * template that renders it, and the two functions a job will call — `nextSendAt`
 * for the timezone and `sendWeeklyEmail` for the idempotency. Both are pure, so
 * the job that eventually exists has nothing left to decide.
 */

import { ESCALATION_COPY } from "@ninetothree/content";
import { findRulePackAtOrBefore, type RuleIndexPack } from "@ninetothree/content/rule-index";
import {
  computeStage,
  personalizeIndexedPack,
  stageLabel,
  suppressesEmail,
} from "@ninetothree/rules";
import { localDate } from "./reminders";
import { shouldSend, type NotificationPrefs, type SendReason } from "./notifications";
import { stageInput, type AppState } from "./store";

/** 8am in the parent's own timezone. Not 3am, not midnight. */
export const EMAIL_HOUR = 8;

/** The issue's ceiling. Three is a week, not a backlog. */
export const EMAIL_ACTIONS = 3;

const DAY_MS = 86_400_000;

export interface EmailAction {
  id: string;
  title: string;
  /** One line on why it is this week. Never a repeat of the title. */
  why: string;
  url: string;
}

export interface EmailSection {
  title: string;
  body: string;
  url: string;
}

export interface WeeklyEmail {
  /** `packId:YYYY-MM-DD`. The idempotency key. */
  key: string;
  subject: string;
  preheader: string;
  weekLabel: string;
  actions: EmailAction[];
  partner: EmailSection;
  /** Never null in practice, but the type says so because a pack may have none. */
  redFlag: EmailSection | null;
  settingsUrl: string;
  unsubscribeUrl: string;
}

export interface BuildEmailOptions {
  state: AppState;
  /**
   * The weekly email needs three steps, their one-line reasons, and the week's
   * subtitle and first red flag — never the prose. So it reads the rule index
   * rather than the guide, which is what keeps 400 kB off this route.
   */
  packs: readonly RuleIndexPack[];
  now: Date;
  baseUrl: string;
}

function settled(state: AppState): Set<string> {
  return new Set(
    Object.entries(state.progress)
      .filter(([, entry]) => entry.status === "done" || entry.status === "skipped")
      .map(([id]) => id),
  );
}

/**
 * Why this week's email would or would not go out.
 *
 * The same shape as `shouldSend`: a reason, not a boolean. A parent who opens
 * the preview and sees nothing deserves to know which of six things stopped it,
 * and so does whoever reads the job log.
 */
export type EmailReason =
  "ok" | "not-onboarded" | "no-stage" | "no-pack" | "nothing-left" | SendReason;

export const EMAIL_REASON_COPY: Record<EmailReason, string> = {
  ok: "This one would go out.",
  "not-onboarded": "There is no week yet.",
  "no-stage": "There is no week yet.",
  "no-pack": "There is nothing written for this week yet.",
  "nothing-left": "You have done everything for this week. Nothing is sent.",
  loss: "Nothing is sent while the guide is paused.",
  paused: "Nothing is sent while everything is paused.",
  off: "The weekly email is off.",
  "quiet-hours": "Push waits until morning.",
  "not-due": "Not due yet at this frequency.",
};

type Resolved =
  | {
      reason: "ok";
      pack: RuleIndexPack;
      lead: EmailAction;
      actions: EmailAction[];
      today: string;
      /** The parent's own week, which is not always the pack's. */
      label: string;
    }
  | { reason: Exclude<EmailReason, "ok"> };

function resolve({ state, packs, now, baseUrl }: BuildEmailOptions): Resolved {
  if (!state.onboarded) return { reason: "not-onboarded" };

  const input = stageInput(state);
  if (!input) return { reason: "no-stage" };

  const today = localDate(now);
  const stage = computeStage(input, today);
  const pack = findRulePackAtOrBefore(stage.kind, stage.index, packs);
  if (!pack) return { reason: "no-pack" };

  const reason = shouldSend(state.notifications, {
    kind: "weekly",
    channel: "email",
    hour: now.getHours(),
    weeksSinceLast: null,
    loss: suppressesEmail(state.profile),
  });
  if (reason !== "ok") return { reason };

  const done = settled(state);
  const personal = personalizeIndexedPack(pack, state.profile);
  const actions = personal.actions
    .filter((action) => !done.has(action.id))
    .slice(0, EMAIL_ACTIONS)
    .map<EmailAction>((action) => ({
      id: action.id,
      title: action.title,
      why: action.why,
      url: `${baseUrl}/week/${pack.id}#${action.id}`,
    }));

  const lead = actions[0];
  if (!lead) return { reason: "nothing-left" };

  return { reason: "ok", pack, lead, actions, today, label: stageLabel(stage) };
}

export function weeklyEmailReason(options: BuildEmailOptions): EmailReason {
  return resolve(options).reason;
}

/**
 * The email, or nothing.
 *
 * It returns `null` rather than an empty email in four cases, and each one is a
 * promise: not onboarded, no pack for this week, the gate said no, and — the
 * one that matters most — there is nothing left to do. An email that says
 * "you're all done" is a re-engagement drip wearing a friendly face.
 */
export function buildWeeklyEmail(options: BuildEmailOptions): WeeklyEmail | null {
  const { baseUrl } = options;
  const resolved = resolve(options);
  if (resolved.reason !== "ok") return null;

  const { pack, lead, actions, today, label } = resolved;
  const redFlag = pack.redFlags[0];

  return {
    key: `${pack.id}:${today}`,
    subject: `${label}: ${lead.title}`,
    preheader: pack.subtitle ?? lead.why,
    weekLabel: label,
    actions,
    partner: {
      title: "If someone is helping you this week",
      body: `This is the one to hand them: ${lead.title.toLowerCase()}.`,
      url: `${baseUrl}/week/${pack.id}`,
    },
    redFlag: redFlag
      ? {
          title: ESCALATION_COPY[redFlag.escalation].label,
          body: redFlag.text,
          url: `${baseUrl}/week/${pack.id}#red-flags`,
        }
      : null,
    settingsUrl: `${baseUrl}/settings#notify-heading`,
    unsubscribeUrl: `${baseUrl}/settings#notify-heading`,
  };
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
  /* Pinned to en-US on purpose, and not through `LANG`: these parts are parsed
     with `Number()`, so a locale with non-ASCII digits would turn every send
     time into NaN. This is arithmetic on a clock, not a date shown to a parent. */
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  // Intl always returns every part that was asked for; the fallback is here
  // so a missing one can never become NaN in a send time.
  /* v8 ignore next */
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  // Some engines report midnight as hour 24 under `hour12: false`.
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
  };
}

/** How far the zone is from UTC at this instant, in milliseconds. */
function offsetMs(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - (date.getTime() - (date.getTime() % 1000));
}

/**
 * The instant a wall-clock time happens in a zone.
 *
 * Two passes, because the offset at the guessed instant can differ from the
 * offset at the real one — that is what a DST boundary is.
 */
function wallToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  timeZone: string,
): Date {
  const wall = Date.UTC(year, month - 1, day, hour, 0, 0);
  const first = wall - offsetMs(new Date(wall), timeZone);
  return new Date(wall - offsetMs(new Date(first), timeZone));
}

/**
 * The next 8am in the parent's timezone.
 *
 * A single UTC send time would put the email at 3am in California and 11am in
 * London. The hour is the parent's, so the arithmetic has to be too.
 */
export function nextSendAt(now: Date, timeZone: string, hour: number = EMAIL_HOUR): Date {
  const parts = zonedParts(now, timeZone);
  if (parts.hour < hour) {
    return wallToInstant(parts.year, parts.month, parts.day, hour, timeZone);
  }
  const tomorrow = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) + DAY_MS);
  return wallToInstant(
    tomorrow.getUTCFullYear(),
    tomorrow.getUTCMonth() + 1,
    tomorrow.getUTCDate(),
    hour,
    timeZone,
  );
}

export interface Transport {
  send(email: WeeklyEmail): Promise<void>;
}

export type SendOutcome = "sent" | "already-sent" | "failed";

export interface SendResult {
  outcome: SendOutcome;
  /** The key to record when the outcome is `sent`. */
  key: string;
}

/**
 * Sends once, and only once.
 *
 * The key is recorded by the caller *after* a successful send, so a transport
 * that throws leaves the email sendable on the next run rather than silently
 * dropped. A retry that arrives after a success is refused by the key, which is
 * the whole point: a parent must never get the same week twice.
 */
export async function sendWeeklyEmail({
  email,
  transport,
  sent,
}: {
  email: WeeklyEmail;
  transport: Transport;
  sent: Record<string, string>;
}): Promise<SendResult> {
  if (sent[email.key] !== undefined) return { outcome: "already-sent", key: email.key };
  try {
    await transport.send(email);
  } catch {
    return { outcome: "failed", key: email.key };
  }
  return { outcome: "sent", key: email.key };
}

/** Whether the parent has asked for the weekly email at all. */
export function wantsWeeklyEmail(prefs: NotificationPrefs): boolean {
  return prefs.email && !prefs.paused;
}
