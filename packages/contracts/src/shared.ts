import { z } from "zod";

/**
 * What the two clients agree on before either of them renders anything.
 *
 * Every shape here is a **response or request body that has already crossed the
 * network**, so the types are the wire's, not the database's. A timestamp is a
 * string, because JSON has no `Date` and `JSON.stringify` has already turned
 * every one of them into a string by the time a client sees it. The handlers
 * parse on the way out, so a shape that drifts fails there rather than in a
 * phone a release later.
 *
 * Objects **strip** keys they do not know rather than rejecting them, which is
 * the deliberate choice: a field added for the web must not break a shipped app
 * that has never heard of it. What a schema guarantees is that everything it
 * names is present and of the right type — not that nothing else is.
 */

/** A timestamp as a client receives it: ISO 8601, with an offset. */
export const Timestamp = z.string().datetime({ offset: true });
export type Timestamp = z.infer<typeof Timestamp>;

/**
 * The four roles a household row can have.
 *
 * Mirrors `HouseholdRole` in `@ninetothree/db` on purpose and without importing
 * it: a contract that depended on the database client would drag Postgres into
 * a mobile bundle.
 */
export const MemberRole = z.enum(["parent", "partner", "grandparent", "carer"]);
export type MemberRole = z.infer<typeof MemberRole>;

/** What every route says when it refuses, so a client has one thing to read. */
export const ErrorBody = z.object({ error: z.string() });
export type ErrorBody = z.infer<typeof ErrorBody>;
