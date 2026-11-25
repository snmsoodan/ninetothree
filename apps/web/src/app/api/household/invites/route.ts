import { NextResponse } from "next/server";

import { CreateInviteRequest, CreatedInvite, InviteList } from "@ninetothree/contracts";
import { createInvite, listInvites, mintInviteToken, NotAllowedError } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { currentUser } from "@/lib/auth/bearer";

/** The invites this household has issued that still work. */
export async function GET(request: Request) {
  const session = await currentUser(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const invites = await listInvites(sql, scope);

  return NextResponse.json(
    InviteList.parse({
      invites: invites.map((invite) => ({
        id: invite.id,
        role: invite.role,
        // pg hands back a Date; the contract describes the JSON a phone reads.
        expiresAt: invite.expires_at.toISOString(),
      })),
    }),
  );
}

/**
 * Issues an invite and returns the link, once.
 *
 * The token is not stored, so this response is the only copy. If it is lost the
 * answer is to revoke and make another, which is why the UI shows the link
 * immediately rather than offering to look it up later.
 */
export async function POST(request: Request) {
  const session = await currentUser(request);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const parsed = CreateInviteRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "unknown role" }, { status: 400 });
  }
  const { role } = parsed.data;

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);

  try {
    const token = mintInviteToken();
    const invite = await createInvite(sql, scope, role, { token });
    return NextResponse.json(
      CreatedInvite.parse({
        id: invite.id,
        role,
        expiresAt: invite.expiresAt.toISOString(),
        url: `/join/${token}`,
      }),
    );
  } catch (error) {
    if (error instanceof NotAllowedError) {
      return NextResponse.json({ error: "not allowed" }, { status: 403 });
    }
    throw error;
  }
}
