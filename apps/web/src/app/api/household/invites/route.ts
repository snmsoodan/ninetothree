import { NextResponse } from "next/server";

import { createInvite, listInvites, mintInviteToken, NotAllowedError } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { auth } from "@/lib/auth/session";

const ROLES = ["parent", "partner", "grandparent", "carer"] as const;
type Role = (typeof ROLES)[number];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** The invites this household has issued that still work. */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const invites = await listInvites(sql, scope);

  return NextResponse.json({
    invites: invites.map((invite) => ({
      id: invite.id,
      role: invite.role,
      expiresAt: invite.expires_at,
    })),
  });
}

/**
 * Issues an invite and returns the link, once.
 *
 * The token is not stored, so this response is the only copy. If it is lost the
 * answer is to revoke and make another, which is why the UI shows the link
 * immediately rather than offering to look it up later.
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "signed out" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { role?: unknown } | null;
  const role = body?.role;
  if (!isRole(role)) {
    return NextResponse.json({ error: "unknown role" }, { status: 400 });
  }

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);

  try {
    const token = mintInviteToken();
    const invite = await createInvite(sql, scope, role, { token });
    return NextResponse.json({
      id: invite.id,
      role,
      expiresAt: invite.expiresAt,
      url: `/join/${token}`,
    });
  } catch (error) {
    if (error instanceof NotAllowedError) {
      return NextResponse.json({ error: "not allowed" }, { status: 403 });
    }
    throw error;
  }
}
