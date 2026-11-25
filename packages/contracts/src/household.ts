import { z } from "zod";

import { MemberRole } from "./shared";

/** One person in the household, as `/api/household` describes them. */
export const HouseholdMember = z.object({
  userId: z.string().min(1),
  role: MemberRole,
  email: z.string().min(1),
  name: z.string().nullable(),
  /** True for the person making the request, so a client never compares ids. */
  isYou: z.boolean(),
});
export type HouseholdMember = z.infer<typeof HouseholdMember>;

/** An open job somebody handed to you, short enough for the dashboard. */
export const HouseholdJobSummary = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  packTitle: z.string().nullable(),
});
export type HouseholdJobSummary = z.infer<typeof HouseholdJobSummary>;

/** `GET /api/household`: who is in the household, and what is waiting on you. */
export const Household = z.object({
  id: z.string().min(1),
  role: MemberRole,
  members: z.array(HouseholdMember),
  /** Pins this household shares, by item id. The note stays with its author. */
  sharedItemIds: z.array(z.string().min(1)),
  jobsForYou: z.array(HouseholdJobSummary),
});
export type Household = z.infer<typeof Household>;

/**
 * `POST /api/household/pins`.
 *
 * `shared: false` unshares; leaving it out shares, which is what the button on a
 * pin does.
 */
export const SharePinRequest = z.object({
  itemId: z.string().min(1),
  title: z.string().min(1),
  packId: z.string().optional(),
  packTitle: z.string().optional(),
  shared: z.boolean().optional(),
});
export type SharePinRequest = z.infer<typeof SharePinRequest>;

export const SharePinResponse = z.object({ shared: z.boolean() });
export type SharePinResponse = z.infer<typeof SharePinResponse>;

/** `DELETE /api/household/membership`: whether you were in one to leave. */
export const LeaveResponse = z.object({ left: z.boolean() });
export type LeaveResponse = z.infer<typeof LeaveResponse>;
