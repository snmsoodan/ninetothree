import type { History } from "./history";
import type { AppState } from "./store";

/**
 * The export is a history document, not a state dump.
 *
 * A parent asking for their history wants something they can read, print, or
 * hand to a clinician — not a serialised localStorage blob. The restorable
 * form belongs with the data-portability work in #41; this is the record.
 */

export const EXPORT_VERSION = 1;

export interface ExportStep {
  title: string;
  status: string;
  at: string;
  reason?: string;
  retired?: boolean;
}

export interface ExportWeek {
  week: string;
  packId: string;
  complete: boolean;
  steps: ExportStep[];
}

export interface ExportDocument {
  app: "ninetothree";
  version: number;
  exportedAt: string;
  profile: {
    status: "pregnant" | "parent";
    dueDate: string | null;
    birthDate: string | null;
  };
  summary: {
    steps: number;
    done: number;
    skipped: number;
    weeks: number;
    pins: number;
    appointments: number;
  };
  weeks: ExportWeek[];
  pins: { title: string; week: string; at: string }[];
  appointments: { label: string; date: string; who: string | null; note: string | null }[];
}

export function buildExport(
  state: AppState,
  history: History,
  exportedAt = new Date().toISOString(),
): ExportDocument {
  return {
    app: "ninetothree",
    version: EXPORT_VERSION,
    exportedAt,
    profile: {
      status: state.status,
      dueDate: state.dueDate ?? null,
      birthDate: state.birthDate ?? null,
    },
    summary: {
      steps: history.total,
      done: history.actions.filter((action) => action.status === "done").length,
      skipped: history.actions.filter((action) => action.status === "skipped").length,
      weeks: history.weeks.length,
      pins: history.pins.length,
      appointments: state.appointments.length,
    },
    weeks: history.weeks.map((week) => ({
      week: week.packTitle,
      packId: week.packId,
      complete: week.complete,
      steps: week.actions.map((action) => ({
        title: action.title,
        status: action.status,
        at: action.at,
        ...(action.reason ? { reason: action.reason } : {}),
        ...(action.retired ? { retired: true } : {}),
      })),
    })),
    pins: history.pins.map((pin) => ({ title: pin.title, week: pin.packTitle, at: pin.at })),
    appointments: state.appointments.map((appointment) => ({
      label: appointment.label,
      date: appointment.date,
      who: appointment.who ?? null,
      note: appointment.note ?? null,
    })),
  };
}

export function toJson(
  state: AppState,
  history: History,
  exportedAt = new Date().toISOString(),
): string {
  return `${JSON.stringify(buildExport(state, history, exportedAt), null, 2)}\n`;
}

export const CSV_HEADER = ["kind", "week", "item", "status", "date", "note"] as const;

/**
 * A cell that begins with one of these is a formula to Excel, Sheets and
 * Numbers. A skip reason is free text a parent typed, so it can begin with
 * anything — including `=`. Prefixing with an apostrophe makes the cell text
 * without changing what it reads as.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

export function csvCell(value: string): string {
  const guarded = FORMULA_LEAD.test(value) ? `'${value}` : value;
  if (/[",\r\n]/.test(guarded) || /^\s|\s$/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

function row(cells: readonly string[]): string {
  return cells.map(csvCell).join(",");
}

/**
 * One table, long format. Actions, pins and appointments are different things,
 * but a parent opening this in a spreadsheet wants one sheet, and a `kind`
 * column is what makes that honest rather than three files.
 */
export function toCsv(state: AppState, history: History): string {
  const lines: string[] = [row(CSV_HEADER)];

  for (const action of history.actions) {
    lines.push(
      row([
        "action",
        action.packTitle,
        action.title,
        action.status,
        action.at,
        action.reason ?? "",
      ]),
    );
  }

  for (const pin of history.pins) {
    lines.push(row(["pin", pin.packTitle, pin.title, "pinned", pin.at, ""]));
  }

  for (const appointment of state.appointments) {
    lines.push(
      row([
        "appointment",
        "",
        appointment.label,
        "yours",
        appointment.date,
        [appointment.who, appointment.note].filter(Boolean).join(" — "),
      ]),
    );
  }

  return `${lines.join("\r\n")}\r\n`;
}
