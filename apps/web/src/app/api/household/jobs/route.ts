import { NextResponse } from "next/server";

import { assignJob, listJobs } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { auth } from "@/lib/auth/session";

/** Every job in the household, open ones first. */
export async function GET() {
  const session = await auth();
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
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    itemId?: unknown;
    title?: unknown;
    packId?: unknown;
    packTitle?: unknown;
    assignedTo?: unknown;
  } | null;

  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  const title = typeof body?.title === "string" ? body.title : "";
  const assignedTo = typeof body?.assignedTo === "string" ? body.assignedTo : "";
  if (!itemId || !title || !assignedTo) {
    return NextResponse.json(
      { error: "itemId, title and assignedTo are required" },
      { status: 400 },
    );
  }

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);

  try {
    const job = await assignJob(sql, scope, {
      itemId,
      title,
      assignedTo,
      stagePackId: typeof body?.packId === "string" ? body.packId : null,
      packTitle: typeof body?.packTitle === "string" ? body.packTitle : null,
    });
    return NextResponse.json({ job });
  } catch {
    // The only way this fails with valid input is a person who is not in the
    // household, which the foreign key refuses.
    return NextResponse.json({ error: "that person is not in your household" }, { status: 400 });
  }
}
