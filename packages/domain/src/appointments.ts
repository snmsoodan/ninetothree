import { appointmentsFor, type AppointmentStatus } from "@ninetothree/content";
import type { AppState } from "./model";

export interface DatedItem {
  id: string;
  label: string;
  /** ISO date, YYYY-MM-DD. The first day of the window. */
  date: string;
  who?: string;
  note?: string;
  /** True when the parent typed it rather than the schedule generating it. */
  own: boolean;
}

/**
 * Every appointment the parent has, generated and typed, in one list.
 *
 * The schedule is derived from the due date and never stored; only what a
 * parent typed is. Both the appointments page and the dashboard's reminders
 * need the same merged list, so it is built once here.
 */
export function datedAppointments(state: AppState, today: string): DatedItem[] {
  const generated: DatedItem[] = state.dueDate
    ? appointmentsFor({
        dueDate: state.dueDate,
        today,
        firstBaby: state.profile.firstBaby ?? true,
      }).map((appointment) => ({
        id: appointment.id,
        label: appointment.label,
        date: appointment.from,
        ...(appointment.who ? { who: appointment.who } : {}),
        ...(appointment.note ? { note: appointment.note } : {}),
        own: false,
      }))
    : [];

  const own: DatedItem[] = state.appointments.map((appointment) => ({
    id: appointment.id,
    label: appointment.label,
    date: appointment.date,
    ...(appointment.who ? { who: appointment.who } : {}),
    ...(appointment.note ? { note: appointment.note } : {}),
    own: true,
  }));

  return [...generated, ...own].sort((a, b) => a.date.localeCompare(b.date));
}

/** One row in a dated list. A window has the same first and last day. */
export interface ScheduleItem {
  id: string;
  label: string;
  /** ISO date, YYYY-MM-DD. The first day of the window. */
  from: string;
  /** ISO date, YYYY-MM-DD, inclusive. */
  to: string;
  who?: string;
  note?: string;
  status: AppointmentStatus;
  /** True for an appointment the parent added themselves. */
  own?: boolean;
}

export interface Schedule {
  /** Everything not yet past, soonest first. */
  coming: ScheduleItem[];
  /** Everything already past, most recent first. */
  past: ScheduleItem[];
}

/** The page's words, so the phone and the browser cannot drift. */
export const APPOINTMENTS_HEADING = "Appointments";
export const APPOINTMENTS_INTRO =
  "Worked out from your due date, so you are not counting weeks in your head. Add your own and they sit in the same list.";
export const APPOINTMENTS_COMING = "Coming up";
export const APPOINTMENTS_EMPTY_COMING =
  "Nothing left on the schedule. If something comes up, add it here.";
export const APPOINTMENTS_OWN = "Add your own";
export const APPOINTMENTS_ADD = "Add an appointment";
export const APPOINTMENTS_EMPTY_OWN =
  "Nothing of your own yet. A scan you booked, a class, a pediatrician visit — they all go here.";
export const APPOINTMENTS_PAST = "Already past";
export const APPOINTMENTS_PAST_INTRO = "Kept so you can see what you have already done.";
export const APPOINTMENTS_LABEL = "What is it";
export const APPOINTMENTS_DATE = "When";
export const APPOINTMENTS_WHO = "Who with, if you know";
export const APPOINTMENTS_NOTE = "Anything to remember";
export const APPOINTMENTS_SAVE = "Save";
export const APPOINTMENTS_CREATE = "Add it";
export const APPOINTMENTS_CANCEL = "Cancel";
export const APPOINTMENTS_CALENDAR = "Add to calendar";
export const APPOINTMENTS_WINDOW_BADGE = "This is the window you are in";
export const APPOINTMENTS_WITH = "With ";
export const APPOINTMENTS_EDIT = "Edit";
export const APPOINTMENTS_DELETE = "Delete";
export const APPOINTMENTS_ICS_FILENAME = "nine-to-three-appointments.ics";

/** "A calendar file with the 3 still to come." */
export function calendarLine(count: number): string {
  return `A calendar file with the ${count} still to come.`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Formatted by hand rather than with Intl, so the server and the client
 * cannot disagree about a date and re-render the list on hydration.
 */
export function formatDate(date: string): string {
  const [, month, day] = date.split("-");
  const name = MONTHS[Number(month) - 1] ?? month;
  return `${name} ${Number(day)}`;
}

export function formatWindow(from: string, to: string): string {
  if (from === to) return formatDate(from);
  return `${formatDate(from)} – ${formatDate(to)}`;
}

/** Several windows can overlap at once; only the first is marked as now. */
export function firstNowIndex(items: readonly ScheduleItem[]): number {
  return items.findIndex((item) => item.status === "now");
}

/**
 * The same union of generated and typed appointments the dashboard uses,
 * with each row's status decided once against `today`.
 */
export function scheduleItems(state: AppState, today: string): ScheduleItem[] {
  return datedAppointments(state, today).map((item) => ({
    id: item.id,
    label: item.label,
    from: item.date,
    to: item.date,
    ...(item.who ? { who: item.who } : {}),
    ...(item.note ? { note: item.note } : {}),
    status: item.date < today ? "past" : item.date === today ? "now" : "upcoming",
    own: item.own,
  }));
}

export function splitSchedule(items: readonly ScheduleItem[]): Schedule {
  return {
    coming: items.filter((item) => item.status !== "past"),
    past: items.filter((item) => item.status === "past").reverse(),
  };
}

/** `20261020T121500Z` — what an ICS DTSTAMP wants. */
export function icsStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}
