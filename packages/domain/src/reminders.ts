/**
 * Reminders: the two things that are about a date rather than a week.
 *
 * An appointment is tomorrow, or a pin has a day the parent asked to be
 * reminded on. Both are computed from local time, because "tomorrow" is a
 * fact about the parent's calendar, not about UTC.
 */

import type { NotificationPrefs } from "./notifications";
import { shouldSend } from "./notifications";

export const REMINDER_KINDS = ["appointment", "pin"] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export interface Reminder {
  /** Stable across days: the appointment or pin id. */
  id: string;
  kind: ReminderKind;
  title: string;
  /** The line under the title. Never a repeat of it. */
  detail: string;
  /** ISO date, YYYY-MM-DD, the day the reminder is about. */
  on: string;
}

export interface ReminderSources {
  appointments: { id: string; label: string; date: string; who?: string; note?: string }[];
  pins: { id: string; title: string; remindOn?: string }[];
}

const DAY_MS = 86_400_000;

/**
 * The local calendar date, not the UTC one.
 *
 * `toISOString()` would roll over at 7pm in New York and tell a parent their
 * appointment is tomorrow when it is the day after.
 */
export function localDate(now: Date): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Adds whole days to an ISO date. Pure string arithmetic, no timezone. */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * The key a dismissal is recorded under.
 *
 * It carries the date, so putting away "your visit is tomorrow" does not
 * silence the same appointment a week later, and a pin reminder set for a new
 * day is a new reminder.
 */
export function reminderKey(reminder: Reminder): string {
  return `${reminder.kind}:${reminder.id}:${reminder.on}`;
}

/**
 * What is due today and tomorrow.
 *
 * An appointment is a window, not a moment, so the reminder fires on the day
 * before the window opens. A pin reminder fires on the day the parent chose.
 */
export function dueReminders(
  sources: ReminderSources,
  now: Date,
): { today: Reminder[]; tomorrow: Reminder[] } {
  const today = localDate(now);
  const tomorrow = addDays(today, 1);

  const appointments = sources.appointments
    .filter((appointment) => appointment.date === tomorrow)
    .map<Reminder>((appointment) => ({
      id: appointment.id,
      kind: "appointment",
      title: appointment.label,
      detail: appointment.who ? `Tomorrow, with ${appointment.who}.` : "Tomorrow.",
      on: tomorrow,
    }));

  const pins = sources.pins
    .filter((pin) => pin.remindOn === today)
    .map<Reminder>((pin) => ({
      id: pin.id,
      kind: "pin",
      title: pin.title,
      detail: "You asked to be reminded today.",
      on: today,
    }));

  return { today: pins, tomorrow: appointments };
}

/** Drops anything already put away for its own day. */
export function unseen(reminders: Reminder[], reminded: Record<string, string>): Reminder[] {
  return reminders.filter((reminder) => reminded[reminderKey(reminder)] === undefined);
}

/**
 * Whether a reminder would be pushed right now.
 *
 * It goes through the same gate as everything else, so quiet hours and pause
 * all apply without this file knowing what they are. The card on the
 * dashboard is not gated: information a parent opened the app to see is not a
 * notification.
 */
export function wouldPush(
  prefs: NotificationPrefs,
  reminder: Reminder,
  now: Date,
  loss: boolean,
): boolean {
  return (
    shouldSend(prefs, {
      kind: reminder.kind,
      channel: "push",
      hour: now.getHours(),
      weeksSinceLast: null,
      loss,
    }) === "ok"
  );
}
