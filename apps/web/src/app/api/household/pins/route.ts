import { NextResponse } from "next/server";

import { shareItem, unshareItem } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { auth } from "@/lib/auth/session";

/**
 * Sharing a pin copies its title into the household's shared table. The note
 * stays behind, because the shared table has no column for one.
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
    shared?: unknown;
  } | null;

  const itemId = typeof body?.itemId === "string" ? body.itemId : "";
  const title = typeof body?.title === "string" ? body.title : "";
  if (!itemId || !title) {
    return NextResponse.json({ error: "itemId and title are required" }, { status: 400 });
  }

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);

  if (body?.shared === false) {
    await unshareItem(sql, scope, itemId);
    return NextResponse.json({ shared: false });
  }

  await shareItem(sql, scope, {
    itemId,
    title,
    stagePackId: typeof body?.packId === "string" ? body.packId : null,
    packTitle: typeof body?.packTitle === "string" ? body.packTitle : null,
  });
  return NextResponse.json({ shared: true });
}
