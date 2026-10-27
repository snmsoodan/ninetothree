import { NextResponse } from "next/server";

import { listAppointments, listJobs, listMemberDetails, listSharedItems } from "@ninetothree/db";
import { PACKS } from "@ninetothree/content/registry";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { auth } from "@/lib/auth/session";

/**
 * The shared surface of a household: who is in it, what has been shared, what
 * is coming up, and what this week asks of the person who is not carrying it.
 *
 * The week is looked up here rather than in the browser because the stage lives
 * in localStorage and the pack library is 409 kB. The client sends the id it
 * already knows and gets back the four lines a partner needs.
 */
export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const stageId = new URL(request.url).searchParams.get("stage");
  const pack = stageId ? PACKS.find((candidate) => candidate.id === stageId) : undefined;

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const [members, shared, jobs, appointments] = await Promise.all([
    listMemberDetails(sql, scope),
    listSharedItems(sql, scope),
    listJobs(sql, scope),
    listAppointments(sql, scope),
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
    shared: shared.map((item) => ({
      itemId: item.itemId,
      title: item.title,
      packTitle: item.packTitle,
      stagePackId: item.stagePackId,
      sharedBy: item.sharedBy,
      isYours: item.sharedBy === userId,
    })),
    jobs: jobs.map((job) => ({
      id: job.id,
      itemId: job.itemId,
      title: job.title,
      packTitle: job.packTitle,
      assignedTo: job.assignedTo,
      assignedBy: job.assignedBy,
      status: job.status,
      doneAt: job.doneAt ? job.doneAt.toISOString() : null,
    })),
    appointments: appointments.map((appointment) => ({
      id: appointment.id,
      title: appointment.title,
      kind: appointment.kind,
      dueAt: appointment.due_at,
      who: appointment.who,
      location: appointment.location,
    })),
    week: pack
      ? {
          id: pack.id,
          title: pack.title,
          subtitle: pack.subtitle ?? null,
          body: pack.you?.body ?? null,
          mind: pack.you?.mind ?? null,
          // The errands, which are the part somebody else can actually take.
          help: pack.coreActions
            .filter(
              (action) => action.type === "do" || action.type === "book" || action.type === "buy",
            )
            .map((action) => ({
              id: action.id,
              title: action.title,
              type: action.type,
              minutes: action.minutes ?? null,
            })),
        }
      : null,
  });
}
