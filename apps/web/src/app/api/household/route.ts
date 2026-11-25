import { NextResponse } from "next/server";

import { Household } from "@ninetothree/contracts";
import { listJobs, listMemberDetails, listSharedItems } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { currentUser } from "@/lib/auth/bearer";

/**
 * Who is in this household.
 *
 * Signed out is a 401 rather than an empty household, because "nobody" and
 * "we do not know who you are" are different answers and the page shows them
 * differently.
 */
export async function GET(request: Request) {
  const session = await currentUser(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const [members, shared, jobs] = await Promise.all([
    listMemberDetails(sql, scope),
    listSharedItems(sql, scope),
    listJobs(sql, scope),
  ]);

  return NextResponse.json(
    Household.parse({
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
      // Only the open jobs handed to you. The dashboard is a short page, and a
      // finished job is not something to act on.
      jobsForYou: jobs
        .filter((job) => job.status === "open" && job.assignedTo === userId)
        .map((job) => ({ id: job.id, title: job.title, packTitle: job.packTitle })),
    }),
  );
}
