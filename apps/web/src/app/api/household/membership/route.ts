import { NextResponse } from "next/server";

import { LeaveResponse } from "@ninetothree/contracts";
import { leaveHousehold, scopeFor } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { currentUser } from "@/lib/auth/bearer";

/**
 * Leaves the household.
 *
 * The delete is the revocation: every household-scoped policy resolves through
 * membership, so the next request sees nothing. There is no token to expire and
 * no cache to clear.
 */
export async function DELETE(request: Request) {
  const session = await currentUser(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await scopeFor(sql, userId);
  const left = await leaveHousehold(sql, scope);

  return NextResponse.json(LeaveResponse.parse({ left }));
}
