import { NextResponse } from "next/server";

import { acceptInvite } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { auth } from "@/lib/auth/session";

/**
 * Joins the household an invite points at.
 *
 * A link that is expired, already used or revoked is a 404 with the same body
 * in all three cases. Telling someone which one it was tells them something
 * about a household they are not in.
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const token = body?.token;
  if (typeof token !== "string" || token.length === 0) {
    return NextResponse.json({ error: "no token" }, { status: 400 });
  }

  const { sql } = await getDb();
  const joined = await acceptInvite(sql, userId, token);
  if (!joined) return NextResponse.json({ error: "no longer valid" }, { status: 404 });

  return NextResponse.json({ householdId: joined.householdId });
}
