import { NextResponse } from "next/server";

import { SharePinRequest, SharePinResponse } from "@ninetothree/contracts";
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

  const parsed = SharePinRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "itemId and title are required" }, { status: 400 });
  }
  const { itemId, title, packId, packTitle, shared } = parsed.data;

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);

  if (shared === false) {
    await unshareItem(sql, scope, itemId);
    return NextResponse.json(SharePinResponse.parse({ shared: false }));
  }

  await shareItem(sql, scope, {
    itemId,
    title,
    stagePackId: packId ?? null,
    packTitle: packTitle ?? null,
  });
  return NextResponse.json(SharePinResponse.parse({ shared: true }));
}
