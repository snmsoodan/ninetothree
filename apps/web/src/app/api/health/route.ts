import { NextResponse } from "next/server";

import { getDb } from "@/lib/auth/db";

/**
 * The uptime check the runbook pages on.
 *
 * It is deliberately the real thing: it opens the database the app actually
 * uses and asks it a question. A health check that only proves the process is
 * listening will stay green through the only outage that matters.
 *
 * The body carries no detail — an unauthenticated endpoint that explains why it
 * is failing is a reconnaissance tool. The logs have the reason.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "cache-control": "no-store" };
  try {
    const { sql } = await getDb();
    await sql.query("select 1");
    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers });
  }
}
