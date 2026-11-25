import { z } from "zod";

import { Timestamp } from "./shared";

/**
 * The one route a phone calls to become a person.
 *
 * A native client cannot accept a cookie set by a redirect it never saw, so it
 * trades the ID token the OS gave it for an ordinary `sessions` row. The token
 * it gets back is sent as `Authorization: Bearer …` and resolves against the
 * same table the web's cookie resolves against — one identity system, so
 * revoking a lost phone revokes it everywhere.
 */

/** The two ways in, on every platform. Nothing else appears because a store asked. */
export const NativeProvider = z.enum(["google", "apple"]);
export type NativeProvider = z.infer<typeof NativeProvider>;

export const NativeExchangeRequest = z.object({
  provider: NativeProvider,
  /** The provider's ID token, as the OS handed it over. Never logged. */
  idToken: z.string().min(1),
});
export type NativeExchangeRequest = z.infer<typeof NativeExchangeRequest>;

/** Who the session belongs to, in the shape a client can show without a second read. */
export const NativeUser = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
});
export type NativeUser = z.infer<typeof NativeUser>;

export const NativeSession = z.object({
  /** The bearer token. A credential: it is never rendered. */
  token: z.string().min(1),
  expiresAt: Timestamp,
  user: NativeUser,
});
export type NativeSession = z.infer<typeof NativeSession>;
