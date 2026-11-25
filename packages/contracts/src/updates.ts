import { z } from "zod";

import { Recall } from "@ninetothree/content";

/**
 * The updates feed, as `/api/updates` sends it.
 *
 * `Recall` is reused from `@ninetothree/content` rather than restated: it is
 * already a `zod` schema there, it is the same schema a pack is validated
 * against, and two descriptions of a recall is exactly how the curated list and
 * the live one would drift apart.
 */

export const RecallSourceId = z.enum(["cpsc", "fda"]);
export type RecallSourceId = z.infer<typeof RecallSourceId>;

export const RecallSourceStatus = z.object({
  id: RecallSourceId,
  name: z.string().min(1),
  ok: z.boolean(),
  /** How many records this source contributed after filtering. */
  count: z.number().int().min(0),
  /** Why it failed, in words a support engineer can act on. */
  error: z.string().optional(),
});
export type RecallSourceStatus = z.infer<typeof RecallSourceStatus>;

export const RecallFeed = z.object({
  recalls: z.array(Recall),
  sources: z.array(RecallSourceStatus),
  /** False when at least one register did not answer and the list is partial. */
  live: z.boolean(),
  /** ISO timestamp the feed was assembled, or empty when it was not. */
  fetchedAt: z.string(),
});
export type RecallFeed = z.infer<typeof RecallFeed>;
