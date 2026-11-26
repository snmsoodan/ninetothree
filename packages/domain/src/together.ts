import type {
  JobStatus,
  Together,
  TogetherAppointment,
  TogetherHelpItem,
  TogetherJob,
  TogetherMember,
  TogetherSharedItem,
} from "@ninetothree/contracts";

/** A person, named the way they are named on every screen that shows them. */
export function memberName(member: TogetherMember): string {
  return member.name?.trim() || member.email;
}

/**
 * The name to show for the other person, when there is exactly one of them.
 *
 * With two other people in the household, "from Sam" would be a guess, so the
 * line drops the attribution instead of picking somebody.
 */
export function otherName(members: readonly TogetherMember[]): string | undefined {
  const others = members.filter((member) => !member.isYou);
  return others.length === 1 ? memberName(others[0]!) : undefined;
}

export function memberNames(members: readonly TogetherMember[]): Record<string, string> {
  return Object.fromEntries(members.map((member) => [member.userId, memberName(member)]));
}

export function whoIsDoingIt(
  job: TogetherJob,
  youId: string,
  names: Record<string, string>,
): string {
  if (job.assignedTo === youId) return FOR_YOU;
  return `${FOR_SOMEONE} ${names[job.assignedTo] ?? "someone"}`;
}

/** The second line of a job: who it is for, then the week it came from. */
export function jobDetail(job: TogetherJob, youId: string, names: Record<string, string>): string {
  return `${whoIsDoingIt(job, youId, names)}${job.packTitle ? ` · ${job.packTitle}` : ""}`;
}

export interface JobLine {
  id: string;
  title: string;
  detail: string;
}

export interface JobSections {
  open: JobLine[];
  finished: JobLine[];
}

/**
 * The two lists of a job board. Open work is the work; finished work is folded
 * below it and says "Done" once rather than turning into a score.
 */
export function jobSections(
  jobs: readonly TogetherJob[],
  youId: string,
  names: Record<string, string>,
): JobSections {
  return {
    open: jobs
      .filter((job) => job.status === "open")
      .map((job) => ({ id: job.id, title: job.title, detail: jobDetail(job, youId, names) })),
    finished: jobs
      .filter((job) => job.status !== "open")
      .map((job) => ({
        id: job.id,
        title: job.title,
        detail: `${job.status === "done" ? DONE : NOT_NEEDED} · ${whoIsDoingIt(job, youId, names)}`,
      })),
  };
}

export interface SharedLine {
  itemId: string;
  title: string;
  detail: string;
}

/** A shared pin, with no note on it — the table has no column for one. */
export function sharedLines(
  shared: readonly TogetherSharedItem[],
  other: string | undefined,
): SharedLine[] {
  return shared.map((item) => ({
    itemId: item.itemId,
    title: item.title,
    detail: `${item.packTitle ?? PINNED}${item.isYours ? SHARED_BY_YOU : other ? ` · ${FROM} ${other}` : ""}`,
  }));
}

/** Appointments with a date on them, soonest first. A pencilled-in one has none. */
export function upcoming(
  appointments: readonly TogetherAppointment[],
): (TogetherAppointment & { dueAt: string })[] {
  return appointments
    .filter((appointment): appointment is TogetherAppointment & { dueAt: string } =>
      Boolean(appointment.dueAt),
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

/**
 * The line under an appointment's title. The day is the platform's own — web
 * formats with the reader's locale, the phone with the device's — so this only
 * joins the parts that must read the same everywhere.
 */
export function appointmentDetail(appointment: TogetherAppointment, day: string): string {
  return [day, appointment.who, appointment.location].filter(Boolean).join(" · ");
}

export interface MemberLine {
  userId: string;
  label: string;
  role: string;
  /** Only your own address is shown, so a household does not leak addresses. */
  email: string | null;
}

export function memberLines(members: readonly TogetherMember[]): MemberLine[] {
  return members.map((member) => ({
    userId: member.userId,
    label: member.isYou ? YOU : memberName(member),
    role: member.role,
    email: member.isYou && member.name ? member.email : null,
  }));
}

/** The shared page, decided once, so the phone and the browser agree. */
export interface TogetherModel {
  youId: string;
  otherName: string | undefined;
  /** True when there is one other person to hand work to. */
  canAssign: boolean;
  names: Record<string, string>;
  jobs: JobSections;
  hasJobs: boolean;
  shared: SharedLine[];
  upcoming: (TogetherAppointment & { dueAt: string })[];
  members: MemberLine[];
}

export function togetherModel(data: Together): TogetherModel {
  const you = data.members.find((member) => member.isYou);
  const other = otherName(data.members);
  return {
    youId: you?.userId ?? "",
    otherName: other,
    canAssign: Boolean(other),
    names: memberNames(data.members),
    jobs: jobSections(data.jobs, you?.userId ?? "", memberNames(data.members)),
    hasJobs: data.jobs.length > 0,
    shared: sharedLines(data.shared, other),
    upcoming: upcoming(data.appointments),
    members: memberLines(data.members),
  };
}

/**
 * The errands a stage hands over.
 *
 * Reading, watching and asking are not something one person can do *for*
 * another, so they never reach the shared page. The wire already carries only
 * these three; this also trims the full list on the device, which is where the
 * wider one lives.
 */
export function handableHelp<T extends { type: string }>(help: readonly T[]): T[] {
  return help.filter((item) => item.type === "do" || item.type === "book" || item.type === "buy");
}

export const TOGETHER_JOBS_HEADING = "Who is doing what";
export const TOGETHER_NO_JOBS = "Nothing handed over yet.";
export const TOGETHER_NO_JOBS_BODY =
  "When one of you asks the other to take something on, it shows up here for both of you.";
export const TOGETHER_SETTLED = "Settled";
export const TOGETHER_CLEAR = "Clear";
export const TOGETHER_DONE_ACTION = "Done";
export const TOGETHER_NOT_NEEDED_ACTION = "Not needed";
export const TOGETHER_SHARED_HEADING = "Shared";
export const TOGETHER_NO_SHARED = "Nothing shared yet.";
export const TOGETHER_NO_SHARED_BODY =
  "Pin something on your shelf and share it, and it shows up here. Your notes stay yours — only the title travels.";
export const TOGETHER_COMING_UP = "Coming up";
export const TOGETHER_NO_APPOINTMENTS = "Nothing in the calendar.";
export const TOGETHER_NO_APPOINTMENTS_BODY =
  "Appointments you add on the appointments page show up here for everyone.";
export const TOGETHER_WHO = "Who is here";
export const TOGETHER_PRIVACY =
  "Notes, mood answers and anything you have not shared stay with the person who wrote them.";
export const TOGETHER_INVITE = "Invite someone";
export const TOGETHER_LOADING = "One moment.";
export const TOGETHER_SIGNED_OUT = "Sign in to see this.";
export const TOGETHER_SIGNED_OUT_BODY =
  "This page is about the people you share the dates with, so it needs to know who you are.";
export const TOGETHER_SIGN_IN_ACTION = "Sign in";
export const TOGETHER_FAILED = "We could not read this just now.";
export const TOGETHER_FAILED_BODY = "Reloading the page usually settles it.";

const FOR_YOU = "For you";
const FOR_SOMEONE = "For";
const DONE = "Done";
const NOT_NEEDED = "Not needed";
const PINNED = "Pinned";
const SHARED_BY_YOU = " · shared by you";
const FROM = "from";
const YOU = "You";

export type {
  JobStatus,
  Together,
  TogetherAppointment,
  TogetherHelpItem,
  TogetherMember,
  TogetherSharedItem,
};
