import { RECALL_BECAUSES, type RecallBecause } from "@ninetothree/content/core";
import {
  DEFAULT_NOTIFICATIONS,
  NOTIFICATION_FREQUENCIES,
  type NotificationFrequency,
  type NotificationPrefs,
} from "./notifications";
import { migrateReading } from "./reading";
import { migrateHumour, migratePersona } from "./persona";
import {
  DRAFT_TTL_DAYS,
  EMPTY_STATE,
  stepsFor,
  type AppState,
  type Choice,
  type CustomAppointment,
  type Notice,
  type OnboardingDraft,
  type OnboardingStep,
  type Pin,
  type SnoozedEntry,
  type WeekCompletion,
} from "./model";

/**
 * Everything a stored object can be, read back safely.
 *
 * The stored JSON is the one input this product cannot control: it is written
 * by an older version of ourselves, or by a browser extension, or by a parent
 * who edited it. Every migration here is therefore "keep what is still
 * meaningful, drop what is not", never a repair — a repaired entry would
 * silently answer a question the parent never answered.
 */

/**
 * v1 stored pins as bare ids. They are upgraded in place with an empty
 * snapshot, which the shelf resolves from the live registry; a legacy pin whose
 * action is gone is dropped rather than shown as a blank row.
 */
export function migratePins(raw: unknown): Pin[] {
  if (!Array.isArray(raw)) return [];
  const pins: Pin[] = [];
  for (const entry of raw) {
    if (typeof entry === "string") {
      pins.push({ id: entry, title: "", packId: "", packTitle: "", at: "" });
    } else if (entry && typeof entry === "object" && typeof (entry as Pin).id === "string") {
      const pin = entry as Partial<Pin>;
      pins.push({
        id: pin.id as string,
        title: pin.title ?? "",
        packId: pin.packId ?? "",
        packTitle: pin.packTitle ?? "",
        at: pin.at ?? "",
        ...(typeof pin.remindOn === "string" ? { remindOn: pin.remindOn } : {}),
      });
    }
  }
  return pins;
}

export function migrateAppointments(raw: unknown): CustomAppointment[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is CustomAppointment =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof (entry as CustomAppointment).id === "string" &&
      typeof (entry as CustomAppointment).label === "string" &&
      typeof (entry as CustomAppointment).date === "string",
  );
}

export function migrateSnoozed(raw: unknown): Record<string, SnoozedEntry> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const snoozed: Record<string, SnoozedEntry> = {};
  for (const [id, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const value = entry as Partial<SnoozedEntry>;
    if (typeof value.until !== "string") continue;
    snoozed[id] = {
      id,
      title: value.title ?? "",
      packId: value.packId ?? "",
      packTitle: value.packTitle ?? "",
      until: value.until,
      at: value.at ?? "",
    };
  }
  return snoozed;
}

export function migrateCompleted(raw: unknown): Record<string, WeekCompletion> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const completed: Record<string, WeekCompletion> = {};
  for (const [packId, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const value = entry as Partial<WeekCompletion>;
    if (typeof value.at !== "string") continue;
    completed[packId] = { at: value.at, forced: value.forced === true };
  }
  return completed;
}

export function migrateChoices(raw: unknown): Record<string, Choice> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const choices: Record<string, Choice> = {};
  for (const [actionId, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const value = entry as Partial<Choice>;
    if (typeof value.optionId !== "string" || typeof value.label !== "string") continue;
    choices[actionId] = { optionId: value.optionId, label: value.label, at: value.at ?? "" };
  }
  return choices;
}

export function migrateNotices(raw: unknown): Record<string, Notice> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const notices: Record<string, Notice> = {};
  for (const [id, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object") continue;
    const value = entry as Partial<Notice>;
    if (typeof value.recallId !== "string" || typeof value.title !== "string") continue;
    if (typeof value.product !== "string" || typeof value.matchedOn !== "string") continue;
    if (!RECALL_BECAUSES.includes(value.because as RecallBecause)) continue;
    notices[id] = {
      id,
      recallId: value.recallId,
      title: value.title,
      product: value.product,
      because: value.because as RecallBecause,
      matchedOn: value.matchedOn,
      at: value.at ?? "",
      ...(typeof value.dismissedAt === "string" ? { dismissedAt: value.dismissedAt } : {}),
    };
  }
  return notices;
}

export function migrateReminded(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const reminded: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") reminded[key] = value;
  }
  return reminded;
}

export function migrateNotifications(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_NOTIFICATIONS;
  const value = raw as Partial<NotificationPrefs>;
  const frequency = NOTIFICATION_FREQUENCIES.includes(value.frequency as NotificationFrequency)
    ? (value.frequency as NotificationFrequency)
    : DEFAULT_NOTIFICATIONS.frequency;
  const hour = (input: unknown, fallback: number): number =>
    typeof input === "number" && Number.isInteger(input) && input >= 0 && input <= 23
      ? input
      : fallback;
  return {
    email: value.email === true,
    push: value.push === true,
    frequency,
    paused: value.paused === true,
    quietFrom: hour(value.quietFrom, DEFAULT_NOTIFICATIONS.quietFrom),
    quietTo: hour(value.quietTo, DEFAULT_NOTIFICATIONS.quietTo),
  };
}

/**
 * A stored state, or nothing.
 *
 * `null` means "there is nothing here worth keeping", and the caller keeps the
 * empty state. It is not an error path: a corrupt string, a future version and
 * an empty store all land here, and the parent sees a working product either
 * way.
 */
export function decodeState(raw: string | null): AppState | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const stored = parsed as Partial<AppState>;
  if (stored.version !== 1) return null;
  return {
    ...EMPTY_STATE,
    ...stored,
    profile: stored.profile ?? {},
    pins: migratePins(stored.pins),
    appointments: migrateAppointments(stored.appointments),
    snoozed: migrateSnoozed(stored.snoozed),
    completed: migrateCompleted(stored.completed),
    choices: migrateChoices(stored.choices),
    notices: migrateNotices(stored.notices),
    notifications: migrateNotifications(stored.notifications),
    reminded: migrateReminded(stored.reminded),
    reading: migrateReading(stored.reading),
    persona: migratePersona(stored.persona),
    humour: migrateHumour(stored.humour),
  };
}

/**
 * A half-finished onboarding, or nothing.
 *
 * Every field is checked, because this is the one place a parent's own storage
 * can hand us a shape we did not write. A draft that fails any check is treated
 * as absent rather than repaired — a repaired form is a form that silently
 * answers a question the parent did not.
 */
export function decodeDraft(raw: string | null, now: Date): OnboardingDraft | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const draft = parsed as Partial<OnboardingDraft>;
  // A draft written before V2 has no persona. It was a parent's draft.
  const persona = migratePersona(draft.persona);
  if (typeof draft.step !== "string" || !stepsFor(persona).includes(draft.step as OnboardingStep)) {
    return null;
  }
  if (typeof draft.at !== "string") return null;

  // A draft that only reached the persona question has no status or date yet,
  // so those two checks cannot apply to it. The TTL still does, and it is
  // checked first, so an expired draft never reaches the relaxed branch.
  const age = now.getTime() - Date.parse(draft.at);
  if (!Number.isFinite(age) || age > DRAFT_TTL_DAYS * 86_400_000) return null;

  const atPersona = draft.step === "persona";
  if (draft.status !== "pregnant" && draft.status !== "parent") {
    if (!atPersona) return null;
  }
  if (typeof draft.date !== "string" || draft.date === "") {
    if (!atPersona) return null;
  }

  return {
    step: draft.step as OnboardingStep,
    persona,
    status: draft.status === "parent" ? "parent" : "pregnant",
    date: typeof draft.date === "string" ? draft.date : "",
    country: typeof draft.country === "string" ? draft.country : "",
    feeding: typeof draft.feeding === "string" ? draft.feeding : "",
    firstBaby: typeof draft.firstBaby === "string" ? draft.firstBaby : "",
    at: draft.at,
  };
}
