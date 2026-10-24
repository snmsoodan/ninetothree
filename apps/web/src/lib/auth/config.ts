import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  accounts,
  clearAttempts,
  type Database,
  SESSION_MAX_AGE_S,
  sessions,
  users,
  verificationTokens,
} from "@ninetothree/db";
import type { NextAuthConfig } from "next-auth";

import { getDb } from "./db";
import { createSender } from "./email";
import { buildProviders, type ProviderEnv } from "./providers";

/**
 * The four tables Auth.js owns, named the way it expects.
 *
 * The cast is because the adapter's column types are narrower than Postgres:
 * they do not include `citext`, which is what `users.email` is. Nothing at
 * runtime cares — the adapter reads and writes columns by name — so this is a
 * type definition being narrower than the database, not a real mismatch.
 */
const ADAPTER_TABLES = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
} as unknown as Parameters<typeof DrizzleAdapter<Database>>[1];

/**
 * The Auth.js configuration.
 *
 * Sessions live in the database, not in a signed cookie. A session that cannot
 * be revoked is a session that outlives the laptop it was created on, and this
 * app is going to hold a due date and a child's birthday.
 */
export async function buildConfig(env: ProviderEnv = process.env): Promise<NextAuthConfig> {
  const { db, sql } = await getDb();
  const sender = createSender(env);

  return {
    adapter: DrizzleAdapter(db, ADAPTER_TABLES),
    // The app is served behind a proxy that terminates TLS, so the Host header
    // is the only thing that says which origin this is. Auth.js refuses to
    // guess, and a wrong guess is a redirect to somebody else's site.
    trustHost: true,
    session: { strategy: "database", maxAge: SESSION_MAX_AGE_S },
    pages: {
      signIn: "/signin",
      verifyRequest: "/signin/check-email",
      error: "/signin/error",
    },
    providers: buildProviders(sender, env),
    callbacks: {
      async signIn({
        user,
        email,
      }: {
        user: { email?: string | null };
        email?: { verificationRequest?: boolean };
      }) {
        // Auth.js calls this twice for a magic link: once when the link is
        // requested, and once when it is followed. Clearing on the first would
        // wipe the attempt the guard just recorded, and the limiter would never
        // count anything. Only the second is proof the address is theirs.
        if (email?.verificationRequest) return true;
        if (user.email) await clearAttempts(sql, user.email.toLowerCase());
        return true;
      },
    },
  };
}
