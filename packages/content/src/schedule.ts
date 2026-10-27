import { DEFAULT_LOCALE, type Locale } from "./locales";
import type { Source } from "./schema";

/**
 * The appointment schedule, generated from the due date.
 *
 * The cadence is the content here, not a list of dates: a parent's due date
 * moves, and a schedule that cannot move with it is a calendar, not a guide.
 * Weeks are gestational — week 28 starts 12 weeks before the due date.
 *
 * US is the shipped locale. UK is behind a flag: NICE schedules fewer visits
 * for a second pregnancy, which is a real difference and not a translation.
 */

export type { Locale } from "./locales";

export interface ScheduleEntry {
  id: string;
  label: string;
  /** Gestational week the window opens. */
  from: number;
  /** Gestational week the window closes, inclusive. */
  to: number;
  who?: string;
  note?: string;
  /** NICE schedules fewer visits when this is not a first pregnancy. */
  firstBabyOnly?: boolean;
}

export interface Schedule {
  locale: Locale;
  label: string;
  entries: ScheduleEntry[];
  sources: Source[];
}

export type AppointmentStatus = "past" | "now" | "upcoming";

export interface DatedAppointment {
  id: string;
  label: string;
  /** ISO date, YYYY-MM-DD. The first day of the window. */
  from: string;
  /** ISO date, YYYY-MM-DD. The last day of the window, inclusive. */
  to: string;
  who?: string;
  note?: string;
  status: AppointmentStatus;
}

const DAY_MS = 86_400_000;
const GESTATION_WEEKS = 40;

function utc(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The first day of a gestational week, counted back from the due date. */
export function dateForWeek(dueDate: string, week: number): string {
  return iso(utc(dueDate) - (GESTATION_WEEKS - week) * 7 * DAY_MS);
}

/** Routine visits at a fixed interval, inclusive of both ends. */
function routine(from: number, to: number, step: number, who: string): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  for (let week = from; week <= to; week += step) {
    entries.push({
      id: `visit-w${week}`,
      label: "Prenatal visit",
      from: week,
      to: week,
      who,
    });
  }
  return entries;
}

const ACOG: Source = {
  id: "acog-visits",
  title: "Prenatal care: visits and tests",
  publisher: "ACOG",
  url: "https://www.acog.org/womens-health/faqs/prenatal-care",
  kind: "clinical",
  accessed: "2026-10-20",
};

const NICE: Source = {
  id: "nice-antenatal",
  title: "Antenatal care (NG201)",
  publisher: "NICE",
  url: "https://www.nice.org.uk/guidance/ng201",
  kind: "clinical",
  accessed: "2026-10-20",
};

/**
 * ACOG's cadence for an uncomplicated pregnancy: every four weeks to 28,
 * every two weeks to 36, then weekly. The named visits sit on top of it.
 */
export const US_SCHEDULE: Schedule = {
  locale: "en-US",
  label: "United States",
  entries: [
    {
      id: "us-first-visit",
      label: "First prenatal visit",
      from: 6,
      to: 8,
      who: "OB or midwife",
      note: "Dating ultrasound, health history, and a first set of labs.",
    },
    {
      id: "us-genetic-screening",
      label: "Genetic screening window",
      from: 10,
      to: 13,
      note: "Cell-free DNA from 10 weeks. A nuchal translucency scan is done between 11 and 13 weeks.",
    },
    ...routine(12, 28, 4, "OB or midwife"),
    {
      id: "us-anatomy-scan",
      label: "Anatomy scan",
      from: 18,
      to: 22,
      note: "The detailed ultrasound, usually around 20 weeks.",
    },
    {
      id: "us-glucose",
      label: "Glucose screening",
      from: 24,
      to: 28,
      note: "A one-hour test for gestational diabetes.",
    },
    {
      id: "us-tdap",
      label: "Tdap vaccine",
      from: 27,
      to: 36,
      note: "One dose in every pregnancy, ideally between 27 and 36 weeks.",
    },
    {
      id: "us-rhogam",
      label: "Rh immunoglobulin, if you are Rh negative",
      from: 28,
      to: 28,
      note: "Given at 28 weeks, and again within 72 hours of birth if your baby is Rh positive.",
    },
    ...routine(30, 36, 2, "OB or midwife"),
    {
      id: "us-gbs",
      label: "Group B strep swab",
      from: 36,
      to: 37,
      note: "A quick swab, usually at 36 or 37 weeks.",
    },
    ...routine(37, 39, 1, "OB or midwife"),
    {
      id: "us-40-week",
      label: "Due date visit",
      from: 40,
      to: 40,
      who: "OB or midwife",
      note: "If labor has not started, your team will talk through monitoring and induction.",
    },
    {
      id: "us-41-week",
      label: "Post-dates monitoring",
      from: 41,
      to: 41,
      note: "A nonstress test or biophysical profile, and a conversation about induction.",
    },
    {
      id: "us-42-week",
      label: "Induction",
      from: 42,
      to: 42,
      note: "Most teams recommend induction by 42 weeks.",
    },
  ],
  sources: [ACOG],
};

/** NICE's cadence. Fewer visits when this is not a first pregnancy. */
export const UK_SCHEDULE: Schedule = {
  locale: "en-GB",
  label: "United Kingdom",
  entries: [
    {
      id: "uk-booking",
      label: "Booking appointment",
      from: 8,
      to: 10,
      who: "Midwife",
      note: "A long first appointment: history, bloods, and a plan for the rest of the pregnancy.",
    },
    {
      id: "uk-dating-scan",
      label: "Dating scan",
      from: 11,
      to: 14,
      note: "Confirms the due date. The nuchal translucency measurement is done at the same scan.",
    },
    { id: "uk-16-week", label: "Midwife appointment", from: 16, to: 16, who: "Midwife" },
    {
      id: "uk-anomaly-scan",
      label: "Anomaly scan",
      from: 18,
      to: 21,
      note: "The detailed ultrasound, done between 18 and 21 weeks.",
    },
    {
      id: "uk-25-week",
      label: "Midwife appointment",
      from: 25,
      to: 25,
      who: "Midwife",
      firstBabyOnly: true,
    },
    {
      id: "uk-28-week",
      label: "Midwife appointment and bloods",
      from: 28,
      to: 28,
      who: "Midwife",
      note: "Blood tests, and anti-D if you are Rh negative.",
    },
    {
      id: "uk-31-week",
      label: "Midwife appointment",
      from: 31,
      to: 31,
      who: "Midwife",
      firstBabyOnly: true,
    },
    { id: "uk-34-week", label: "Midwife appointment", from: 34, to: 34, who: "Midwife" },
    {
      id: "uk-36-week",
      label: "Midwife appointment",
      from: 36,
      to: 36,
      who: "Midwife",
      note: "Your baby's position is checked, and you will talk through birth preferences.",
    },
    { id: "uk-38-week", label: "Midwife appointment", from: 38, to: 38, who: "Midwife" },
    { id: "uk-40-week", label: "Midwife appointment", from: 40, to: 40, who: "Midwife" },
    {
      id: "uk-41-week",
      label: "Membrane sweep offered",
      from: 41,
      to: 41,
      who: "Midwife",
      note: "Offered at 40 or 41 weeks. You can say no.",
    },
    {
      id: "uk-42-week",
      label: "Induction offered",
      from: 42,
      to: 42,
      note: "Offered by 42 weeks. You can ask what happens if you wait.",
    },
  ],
  sources: [NICE],
};

/**
 * A locale with no reviewed schedule is absent, not approximated.
 *
 * `Partial` rather than `Record` on purpose: a `Record` would force a schedule
 * for every row in the locale table, including the ones nobody has reviewed,
 * and the cheapest way to satisfy it is to copy the US one. The invariant that
 * actually matters — every *enabled* locale has a schedule — is a unit test,
 * because it is a claim about the data rather than about the types.
 */
export const SCHEDULES: Partial<Record<Locale, Schedule>> = {
  "en-US": US_SCHEDULE,
  "en-GB": UK_SCHEDULE,
};

export { ENABLED_LOCALES } from "./locales";

/**
 * The appointment schedule for a locale, or an error.
 *
 * There is no fallback, and that is the point. Handing a UK parent ACOG's
 * cadence would be a clinical claim nobody made, in a product whose whole
 * promise is that a number here is one a midwife would give. A locale reaches
 * this function only through the country gate, which refuses a locale that is
 * not enabled — so a throw here means a caller skipped the gate, which is a
 * bug worth failing loudly for.
 */
export function scheduleFor(locale: Locale): Schedule {
  const schedule = SCHEDULES[locale];
  if (!schedule) {
    throw new Error(
      `No reviewed appointment schedule for ${locale}. Add one to SCHEDULES in ` +
        `packages/content/src/schedule.ts, or keep the locale disabled in LOCALES.`,
    );
  }
  return schedule;
}

export interface AppointmentsOptions {
  dueDate: string;
  today: string;
  locale?: Locale;
  /** NICE drops the 25 and 31 week visits when this is false. */
  firstBaby?: boolean;
}

/**
 * The schedule, dated. `today` is a parameter so this stays pure and testable
 * without freezing the clock.
 */
export function appointmentsFor({
  dueDate,
  today,
  locale = DEFAULT_LOCALE,
  firstBaby = true,
}: AppointmentsOptions): DatedAppointment[] {
  const schedule = scheduleFor(locale);
  const now = utc(today);

  return schedule.entries
    .filter((entry) => firstBaby || !entry.firstBabyOnly)
    .map((entry) => {
      const from = dateForWeek(dueDate, entry.from);
      const to = iso(utc(dateForWeek(dueDate, entry.to)) + 6 * DAY_MS);
      const status: AppointmentStatus =
        utc(to) < now ? "past" : utc(from) > now ? "upcoming" : "now";
      return {
        id: entry.id,
        label: entry.label,
        from,
        to,
        ...(entry.who ? { who: entry.who } : {}),
        ...(entry.note ? { note: entry.note } : {}),
        status,
      };
    })
    .sort((a, b) => a.from.localeCompare(b.from));
}

/** RFC 5545 text escaping. A comma in a summary breaks the file otherwise. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold at 75 octets, continuation lines start with a single space. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

function nextDay(date: string): string {
  return iso(utc(date) + DAY_MS);
}

/**
 * An all-day calendar file. All-day because a prenatal visit is a day, not a
 * time, and inventing a time would put a fake 9am in a parent's calendar.
 */
export function buildIcs(appointments: DatedAppointment[], stamp: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nine to Three//Appointments//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const appointment of appointments) {
    const description = [appointment.who ? `With ${appointment.who}.` : "", appointment.note ?? ""]
      .filter(Boolean)
      .join(" ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${appointment.id}@ninetothree.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${appointment.from.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${nextDay(appointment.to).replace(/-/g, "")}`,
      fold(`SUMMARY:${escapeText(appointment.label)}`),
      ...(description ? [fold(`DESCRIPTION:${escapeText(description)}`)] : []),
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
