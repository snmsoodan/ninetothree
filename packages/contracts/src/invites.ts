import { z } from "zod";

import { MemberRole, Timestamp } from "./shared";

/** An invite that still works. The token is not stored, so it is not here. */
export const Invite = z.object({
  id: z.string().min(1),
  role: MemberRole,
  expiresAt: Timestamp,
});
export type Invite = z.infer<typeof Invite>;

/** `GET /api/household/invites`. */
export const InviteList = z.object({ invites: z.array(Invite) });
export type InviteList = z.infer<typeof InviteList>;

/** `POST /api/household/invites`. */
export const CreateInviteRequest = z.object({ role: MemberRole });
export type CreateInviteRequest = z.infer<typeof CreateInviteRequest>;

/**
 * `POST /api/household/invites`, answered.
 *
 * `url` is a path rather than an absolute address, because the host that minted
 * it is the only one that can say what its origin is. A client joins it to its
 * own.
 */
export const CreatedInvite = Invite.extend({ url: z.string().startsWith("/") });
export type CreatedInvite = z.infer<typeof CreatedInvite>;
