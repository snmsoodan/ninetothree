import { buildIcs } from "@ninetothree/content";
import {
  APPOINTMENTS_ADD,
  APPOINTMENTS_CALENDAR,
  APPOINTMENTS_CANCEL,
  APPOINTMENTS_COMING,
  APPOINTMENTS_CREATE,
  APPOINTMENTS_DATE,
  APPOINTMENTS_EMPTY_COMING,
  APPOINTMENTS_EMPTY_OWN,
  APPOINTMENTS_HEADING,
  APPOINTMENTS_ICS_FILENAME,
  APPOINTMENTS_INTRO,
  APPOINTMENTS_LABEL,
  APPOINTMENTS_NOTE,
  APPOINTMENTS_OWN,
  APPOINTMENTS_PAST,
  APPOINTMENTS_PAST_INTRO,
  APPOINTMENTS_SAVE,
  APPOINTMENTS_WHO,
  APPOINTMENTS_WINDOW_BADGE,
  APPOINTMENTS_WITH,
  APPOINTMENTS_EDIT,
  APPOINTMENTS_DELETE,
  calendarLine,
  firstNowIndex,
  formatWindow,
  icsStamp,
  scheduleItems,
  splitSchedule,
  type AppState,
  type ScheduleItem,
} from "@ninetothree/domain";

/**
 * Appointments, decided once.
 *
 * The phone shows the same union of generated and typed appointments as the
 * website, in the same order, with the same words. The calendar file is built
 * here rather than in the screen so a test can read it without a share sheet.
 */

export interface AppointmentRow extends ScheduleItem {
  /** "21 October – 27 October", from the shared formatter. */
  window: string;
  /** The first open window gets the badge, and only the first. */
  marked: boolean;
  withLine: string | null;
}

export interface AppointmentsView {
  heading: string;
  intro: string;
  comingHeading: string;
  coming: AppointmentRow[];
  emptyComing: string;
  ownHeading: string;
  ownEmpty: string;
  pastHeading: string;
  pastIntro: string;
  past: AppointmentRow[];
  calendar: { label: string; line: string; filename: string; ics: string; available: boolean };
  form: {
    add: string;
    create: string;
    save: string;
    cancel: string;
    label: string;
    date: string;
    who: string;
    note: string;
  };
  edit: string;
  delete: string;
  badge: string;
}

export function appointmentsView(
  state: AppState,
  today: string,
  now = new Date(),
): AppointmentsView {
  const { coming, past } = splitSchedule(scheduleItems(state, today));
  const firstNow = firstNowIndex(coming);

  const row = (item: ScheduleItem, index: number): AppointmentRow => ({
    ...item,
    window: formatWindow(item.from, item.to),
    marked: item.status === "now" && index === firstNow,
    withLine: item.who ? `${APPOINTMENTS_WITH}${item.who}` : null,
  });

  return {
    heading: APPOINTMENTS_HEADING,
    intro: APPOINTMENTS_INTRO,
    comingHeading: APPOINTMENTS_COMING,
    coming: coming.map(row),
    emptyComing: APPOINTMENTS_EMPTY_COMING,
    ownHeading: APPOINTMENTS_OWN,
    ownEmpty: APPOINTMENTS_EMPTY_OWN,
    pastHeading: APPOINTMENTS_PAST,
    pastIntro: APPOINTMENTS_PAST_INTRO,
    past: past.map(row),
    calendar: {
      label: APPOINTMENTS_CALENDAR,
      line: calendarLine(coming.length),
      filename: APPOINTMENTS_ICS_FILENAME,
      ics: buildIcs(coming, icsStamp(now)),
      available: Boolean(state.dueDate) && coming.length > 0,
    },
    form: {
      add: APPOINTMENTS_ADD,
      create: APPOINTMENTS_CREATE,
      save: APPOINTMENTS_SAVE,
      cancel: APPOINTMENTS_CANCEL,
      label: APPOINTMENTS_LABEL,
      date: APPOINTMENTS_DATE,
      who: APPOINTMENTS_WHO,
      note: APPOINTMENTS_NOTE,
    },
    edit: APPOINTMENTS_EDIT,
    delete: APPOINTMENTS_DELETE,
    badge: APPOINTMENTS_WINDOW_BADGE,
  };
}

export interface AppointmentDraft {
  id?: string;
  label: string;
  date: string;
  who: string;
  note: string;
}

export const EMPTY_DRAFT: AppointmentDraft = { label: "", date: "", who: "", note: "" };

/** A draft is saveable when it has the two things the list needs to show it. */
export function canSave(draft: AppointmentDraft): boolean {
  return draft.label.trim() !== "" && draft.date !== "";
}

/** The payload the store takes, trimmed and without empty extras. */
export function draftPayload(draft: AppointmentDraft): {
  label: string;
  date: string;
  who?: string;
  note?: string;
} {
  return {
    label: draft.label.trim(),
    date: draft.date,
    ...(draft.who.trim() ? { who: draft.who.trim() } : {}),
    ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
  };
}

/** The draft an edit starts from. Missing appointments are not editable. */
export function draftFor(state: AppState, id: string): AppointmentDraft | null {
  const appointment = state.appointments.find((candidate) => candidate.id === id);
  if (!appointment) return null;
  return {
    id: appointment.id,
    label: appointment.label,
    date: appointment.date,
    who: appointment.who ?? "",
    note: appointment.note ?? "",
  };
}
