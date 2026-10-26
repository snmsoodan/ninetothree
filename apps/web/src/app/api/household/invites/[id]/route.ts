import { NextResponse } from "next/server";

import { NotAllowedError, revokeInvite } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { auth } from "@/lib/auth/session";

/**
 * Revokes an invite.
 *
 * Immediate: the accept function checks `revoked_at` in the same transaction
 * that consumes the token, so there is no window in which a revoked link still
 * works.
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { id } = await context.params;
  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);

  try {
    const revoked = await revokeInvite(sql, scope, id);
    return NextResponse.json({ revoked });
  } catch (error) {
    if (error instanceof NotAllowedError) {
      return NextResponse.json({ error: "not allowed" }, { status: 403 });
    }
    throw error;
  }
}
