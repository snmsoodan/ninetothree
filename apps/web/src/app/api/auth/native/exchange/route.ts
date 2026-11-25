import { getDb } from "@/lib/auth/db";
import { buildVerifier, exchangeNative } from "@/lib/auth/native";

/**
 * The only route a phone needs to become a person.
 *
 * Everything it decides lives in `native.ts` so that the decision can be tested
 * without a server: this file reads the database, hands the exchange its
 * verifier, and returns whatever it decided.
 */
export async function POST(request: Request) {
  const { sql } = await getDb();
  return exchangeNative(request, { sql, verify: buildVerifier() });
}
