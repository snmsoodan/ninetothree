import {
  createHousehold,
  NoHouseholdError,
  scopeFor,
  type Scope,
  type SqlClient,
} from "@ninetothree/db";

/**
 * The scope for a signed-in user, creating a household of one if they have none.
 *
 * Every account gets a household at sign-up, so this normally just reads. The
 * exception is someone who has left their last household: they are still
 * signed in, and "no household" is not a state any page can render. Giving
 * them a fresh one of their own is the honest answer — they left the shared
 * one, they did not leave the product.
 */
export async function ensureScope(sql: SqlClient, userId: string): Promise<Scope> {
  try {
    return await scopeFor(sql, userId);
  } catch (error) {
    if (!(error instanceof NoHouseholdError)) throw error;
    await createHousehold(sql, userId);
    return scopeFor(sql, userId);
  }
}
