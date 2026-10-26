import { NextResponse } from "next/server";

import { removeJob, setJobStatus, type JobStatus } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { auth } from "@/lib/auth/session";

const STATUSES: readonly JobStatus[] = ["open", "done", "dropped"];

/** Moves a job's status. Anyone in the household can do this. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = STATUSES.find((s) => s === body?.status);
  if (!status) {
    return NextResponse.json({ error: "status must be open, done or dropped" }, { status: 400 });
  }

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const job = await setJobStatus(sql, scope, id, status);
  if (!job) return NextResponse.json({ error: "no such job" }, { status: 404 });
  return NextResponse.json({ job });
}

/** Takes a job off the list entirely. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { id } = await context.params;
  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const removed = await removeJob(sql, scope, id);
  if (!removed) return NextResponse.json({ error: "no such job" }, { status: 404 });
  return NextResponse.json({ removed: true });
}
