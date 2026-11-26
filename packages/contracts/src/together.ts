import { z } from "zod";

import { MemberRole } from "./shared";

/**
 * `GET /api/household/together`: the page two people share.
 *
 * This is the one payload a partner reads rather than the person carrying the
 * pregnancy, so it is deliberately narrower than the database behind it: there
 * is no note, no mood answer and no private progress in any field, and the
 * schema says so by not naming them.
 */

export const TogetherMember = z.object({
  userId: z.string().min(1),
  role: MemberRole,
  email: z.string().min(1),
  /** Null when the provider gave us no name, which Apple often does not. */
  name: z.string().nullable(),
  isYou: z.boolean(),
});
export type TogetherMember = z.infer<typeof TogetherMember>;

export const TogetherSharedItem = z.object({
  itemId: z.string().min(1),
  title: z.string().min(1),
  packTitle: z.string().nullable(),
  /** The week the pin came from, so a partner can open the same page. */
  stagePackId: z.string().nullable(),
  sharedBy: z.string().min(1),
  isYours: z.boolean(),
});
export type TogetherSharedItem = z.infer<typeof TogetherSharedItem>;

export const JobStatus = z.enum(["open", "done", "dropped"]);
export type JobStatus = z.infer<typeof JobStatus>;

/** A small promise between two people, not a to-do with a tick. */
export const TogetherJob = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  title: z.string().min(1),
  packTitle: z.string().nullable(),
  assignedTo: z.string().min(1),
  assignedBy: z.string().min(1),
  status: JobStatus,
  /** Set only once a job is finished, so it is the only field that can be null. */
  doneAt: z.string().nullable(),
});
export type TogetherJob = z.infer<typeof TogetherJob>;

export const TogetherAppointment = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.string().nullable(),
  /** A datetime as the wire carries it; the client formats it in its own zone. */
  dueAt: z.string().nullable(),
  who: z.string().nullable(),
  location: z.string().nullable(),
});
export type TogetherAppointment = z.infer<typeof TogetherAppointment>;

/** The errands this week asks of somebody else — the part a partner can take. */
export const TogetherHelpItem = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["do", "book", "buy"]),
  minutes: z.number().nullable(),
});
export type TogetherHelpItem = z.infer<typeof TogetherHelpItem>;

export const TogetherWeek = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().nullable(),
  body: z.string().nullable(),
  mind: z.string().nullable(),
  help: z.array(TogetherHelpItem),
});
export type TogetherWeek = z.infer<typeof TogetherWeek>;

export const Together = z.object({
  id: z.string().min(1),
  role: MemberRole,
  members: z.array(TogetherMember),
  shared: z.array(TogetherSharedItem),
  jobs: z.array(TogetherJob),
  appointments: z.array(TogetherAppointment),
  /** Null when the client sent no stage, which is what a signed-out device does. */
  week: TogetherWeek.nullable(),
});
export type Together = z.infer<typeof Together>;

/** `POST /api/household/jobs`: handing something to somebody. */
export const CreateJobRequest = z.object({
  itemId: z.string().min(1),
  title: z.string().min(1),
  packId: z.string().nullable().optional(),
  packTitle: z.string().nullable().optional(),
  assignedTo: z.string().min(1),
});
export type CreateJobRequest = z.infer<typeof CreateJobRequest>;

/** `PATCH /api/household/jobs/:id`: the two moves a job has. */
export const UpdateJobRequest = z.object({ status: JobStatus });
export type UpdateJobRequest = z.infer<typeof UpdateJobRequest>;
