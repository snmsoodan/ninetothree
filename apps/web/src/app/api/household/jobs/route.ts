import { NextResponse } from "next/server";

import { CreateJobRequest } from "@ninetothree/contracts";
import { assignJob, listJobs } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { currentUser } from "@/lib/auth/bearer";

/** Every job in the household, open ones first. */
export async function GET(request: Request) {
  const session = await currentUser(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  return NextResponse.json({ jobs: await listJobs(sql, scope) });
}

/**
 * Hands an action to somebody else in the household.
 *
 * The person it is for has to be in the same household — the policy enforces
 * that, because `assigned_to` is a foreign key to `users` and the row is only
 * visible inside the household. A job for somebody outside it would be a row
 * nobody could ever read.
 */
export async function POST(request: Request) {
  const session = await currentUser(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  // The phone sends this body too, so the shape is the contract's rather than a
  // list of `typeof` checks that a second client could quietly disagree with.
  const parsed = CreateJobRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "itemId, title and assignedTo are required" },
      { status: 400 },
    );
  }
  const { itemId, title, assignedTo } = parsed.data;

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);

  try {
    const job = await assignJob(sql, scope, {
      itemId,
      title,
      assignedTo,
      stagePackId: parsed.data.packId ?? null,
      packTitle: parsed.data.packTitle ?? null,
    });
    return NextResponse.json({ job });
  } catch {
    // The only way this fails with valid input is a person who is not in the
    // household, which the foreign key refuses.
    return NextResponse.json({ error: "that person is not in your household" }, { status: 400 });
  }
}
