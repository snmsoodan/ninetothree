import type { StageKind, StageUnit } from "@ninetothree/content";

/**
 * Where a parent is, right now.
 *
 * Everything in the product hangs off this one calculation, so it is
 * pure, tested, and has no dependency on the clock — the caller passes
 * "today" in. That makes it reproducible in tests and in the weekly email
 * job, which runs at a different time than the page render.
 */

export const GESTATION_DAYS = 280;
export const DAY_MS = 86_400_000;

export interface Stage {
  kind: StageKind;
  index: number;
  unit: StageUnit;
  /** Whole days into the stage. Negative before it starts. */
  dayInStage: number;
  /** 0–1 through the current stage. Used for the quiet progress line. */
  progress: number;
}

export type StageInput =
  { status: "pregnant"; dueDate: string } | { status: "parent"; birthDate: string };

function toUtcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) throw new Error(`Invalid date: ${iso}`);
  return new Date(Date.UTC(year, month - 1, day));
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Gestational age in days, from the due date. A due date is 280 days
 * after the last menstrual period, so this is exact rather than an
 * estimate of the estimate.
 */
export function gestationalDays(dueDate: string, today: string): number {
  return GESTATION_DAYS - daysBetween(toUtcDate(today), toUtcDate(dueDate));
}

/**
 * The stage a parent is in.
 *
 * Pregnancy is weekly from week 4. After birth it is weekly for the first
 * twelve weeks, then monthly. The boundaries are inclusive at the start
 * and exclusive at the end, so there is never a day with no stage.
 */
export function computeStage(input: StageInput, today: string): Stage {
  if (input.status === "pregnant") {
    const days = gestationalDays(input.dueDate, today);
    const rawWeek = Math.floor(days / 7);
    // Clamp: before week 4 there is nothing useful to say, and after
    // week 42 the baby is late and the answer is "call your OB".
    const week = Math.min(42, Math.max(4, rawWeek));
    const dayInStage = days - week * 7;
    return {
      kind: "pregnancy",
      index: week,
      unit: "week",
      dayInStage,
      progress: Math.min(1, Math.max(0, dayInStage / 7)),
    };
  }

  const days = daysBetween(toUtcDate(input.birthDate), toUtcDate(today));
  const safeDays = Math.max(0, days);

  if (safeDays < 7) {
    return {
      kind: "postpartum",
      index: 1,
      unit: "week",
      dayInStage: safeDays,
      progress: safeDays / 7,
    };
  }

  if (safeDays < 84) {
    const week = Math.floor(safeDays / 7) + 1;
    const dayInStage = safeDays % 7;
    return {
      kind: "postpartum",
      index: week,
      unit: "week",
      dayInStage,
      progress: dayInStage / 7,
    };
  }

  // Months are calendar months, not 30-day blocks, because that is what
  // every pediatric schedule and every parent means by "six months".
  const birth = toUtcDate(input.birthDate);
  const now = toUtcDate(today);
  let months =
    (now.getUTCFullYear() - birth.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birth.getUTCMonth());
  if (now.getUTCDate() < birth.getUTCDate()) months -= 1;
  const month = Math.max(3, months);

  const monthStart = new Date(
    Date.UTC(birth.getUTCFullYear(), birth.getUTCMonth() + month, birth.getUTCDate()),
  );
  const monthEnd = new Date(
    Date.UTC(birth.getUTCFullYear(), birth.getUTCMonth() + month + 1, birth.getUTCDate()),
  );
  const span = daysBetween(monthStart, monthEnd);
  const dayInStage = daysBetween(monthStart, now);

  return {
    kind: month <= 12 ? "infant" : "toddler",
    index: month,
    unit: "month",
    dayInStage,
    // span is 28–31 for any real date; the guard is here so a bad input
    // can never produce NaN in the progress bar.
    /* v8 ignore next */
    progress: span > 0 ? Math.min(1, Math.max(0, dayInStage / span)) : 0,
  };
}

/** Human label for a stage. Used in the header and the email subject. */
export function stageLabel(stage: Stage): string {
  if (stage.kind === "pregnancy") return `Week ${stage.index}`;
  if (stage.kind === "postpartum") return `Week ${stage.index}`;
  if (stage.kind === "infant") return `Month ${stage.index}`;
  return `Month ${stage.index}`;
}

/** Days until the due date. Negative once it has passed. */
export function daysUntilDue(dueDate: string, today: string): number {
  return daysBetween(toUtcDate(today), toUtcDate(dueDate));
}

/** Age in days since birth. */
export function ageInDays(birthDate: string, today: string): number {
  return daysBetween(toUtcDate(birthDate), toUtcDate(today));
}
