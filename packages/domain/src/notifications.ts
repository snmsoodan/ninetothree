/**
 * What we are allowed to send, and when.
 *
 * There is no email and no push in this version. These preferences exist so
 * that the first send that ever happens is the one the parent asked for, and
 * so that every future job has exactly one function to consult rather than
 * its own idea of who wants what.
 */

export const NOTIFICATION_KINDS = ["weekly", "appointment", "pin"] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const NOTIFICATION_FREQUENCIES = ["weekly", "fortnightly", "monthly"] as const;
export type NotificationFrequency = (typeof NOTIFICATION_FREQUENCIES)[number];

/** How many weeks apart each cadence is. */
export const FREQUENCY_WEEKS: Record<NotificationFrequency, number> = {
  weekly: 1,
  fortnightly: 2,
  monthly: 4,
};

export interface NotificationPrefs {
  email: boolean;
  push: boolean;
  frequency: NotificationFrequency;
  /** The parent's own off switch. It outranks every other setting. */
  paused: boolean;
  /** Push is silent between these two local hours. */
  quietFrom: number;
  quietTo: number;
}

/**
 * Off by default, and quiet overnight.
 *
 * A product that has never sent anything should not start switched on. The
 * parent turns it on, and until they do, nothing is due.
 */
export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  email: false,
  push: false,
  frequency: "weekly",
  paused: false,
  quietFrom: 21,
  quietTo: 8,
};

export type SendReason = "ok" | "loss" | "paused" | "off" | "quiet-hours" | "not-due";

export interface SendContext {
  kind: NotificationKind;
  channel: "email" | "push";
  /** The parent's local hour, 0–23. */
  hour: number;
  /** Whole weeks since the last send of this kind. `null` means never sent. */
  weeksSinceLast: number | null;
  /** The parent is in loss mode. */
  loss: boolean;
}

/**
 * True when `hour` falls inside the quiet window, which may wrap midnight.
 *
 * `from === to` is not a window: it would be either nothing or everything,
 * and neither is what a parent means by "quiet overnight".
 */
export function isQuietHour(hour: number, from: number, to: number): boolean {
  if (from === to) return false;
  if (from < to) return hour >= from && hour < to;
  return hour >= from || hour < to;
}

/**
 * The one gate every job must call before it sends anything.
 *
 * The order of the checks is the order of the promises. Loss mode comes
 * first, because a bereaved parent must never be emailed about a week they
 * are not having — not even if they forgot they had paused. Then the
 * parent's own off switch, then the channel, then the hour, then the cadence.
 *
 * Quiet hours apply to push only. An email at 3am waits in an inbox; a push
 * at 3am wakes someone.
 */
export function shouldSend(prefs: NotificationPrefs, ctx: SendContext): SendReason {
  if (ctx.loss) return "loss";
  if (prefs.paused) return "paused";
  if (ctx.channel === "email" && !prefs.email) return "off";
  if (ctx.channel === "push" && !prefs.push) return "off";
  if (ctx.channel === "push" && isQuietHour(ctx.hour, prefs.quietFrom, prefs.quietTo)) {
    return "quiet-hours";
  }
  if (ctx.kind === "weekly") {
    const gap = FREQUENCY_WEEKS[prefs.frequency];
    if (ctx.weeksSinceLast !== null && ctx.weeksSinceLast < gap) return "not-due";
  }
  return "ok";
}

/** The sentence a settings screen shows, so the reason is never a mystery. */
export const SEND_REASON_COPY: Record<SendReason, string> = {
  ok: "This one would go out.",
  loss: "Nothing is sent while the guide is paused.",
  paused: "Nothing is sent while everything is paused.",
  off: "This channel is off.",
  "quiet-hours": "Push waits until morning.",
  "not-due": "Not due yet at this frequency.",
};
