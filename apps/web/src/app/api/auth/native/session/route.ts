/**
 * The phone's sign-out.
 *
 * The browser's sign-out is a NextAuth route that also clears a cookie; a phone
 * has no cookie, only the row in `sessions`, so it needs a way to remove that
 * row. Delete is idempotent on purpose: an already-expired or already-deleted
 * session and a network that is about to lose the response both mean the same
 * thing to the person pressing the button, and the app deletes its copy either
 * way.
 */
import { NextResponse } from "next/server";

import { getDb } from "@/lib/auth/db";
import { bearerToken } from "@/lib/auth/bearer";

export async function DELETE(request: Request): Promise<NextResponse> {
  const token = bearerToken(request);
  if (token) {
    const { sql } = await getDb();
    await sql.query(`delete from sessions where session_token = $1`, [token]);
  }
  return new NextResponse(null, { status: 204 });
}
