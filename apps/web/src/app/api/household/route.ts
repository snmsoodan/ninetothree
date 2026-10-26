import { NextResponse } from "next/server";

import { listMemberDetails, listSharedItems } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { auth } from "@/lib/auth/session";

/**
 * Who is in this household.
 *
 * Signed out is a 401 rather than an empty household, because "nobody" and
 * "we do not know who you are" are different answers and the page shows them
 * differently.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const [members, shared] = await Promise.all([
    listMemberDetails(sql, scope),
    listSharedItems(sql, scope),
  ]);

  return NextResponse.json({
    id: scope.householdId,
    role: scope.role,
    members: members.map((member) => ({
      userId: member.user_id,
      role: member.role,
      email: member.email,
      name: member.name,
      isYou: member.user_id === userId,
    })),
    sharedItemIds: shared.map((item) => item.itemId),
  });
}
