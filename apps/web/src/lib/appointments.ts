import { appointmentsFor } from "@ninetothree/content";
import type { AppState } from "./store";

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
