import { NextResponse } from "next/server";

import { entitlementsFor, getSubscription } from "@ninetothree/db";

import { auth } from "@/lib/auth/session";
import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";

/**
 * What this household is entitled to, and whether we can take money yet.
 *
 * `configured` is not a secret: it tells the settings page whether to offer an
 * upgrade button or an honest note. A button that opens a checkout that cannot
 * exist is worse than no button.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const subscription = await getSubscription(sql, scope);

  const entitlements = entitlementsFor(subscription);

  return NextResponse.json({
    // The plan they are entitled to, not the plan on the row. A cancelled
    // subscription keeps its plan for the record, and reporting that would tell
    // somebody they still have Plus while every entitlement says otherwise.
    plan: entitlements.plan,
    status: subscription?.status ?? "active",
    entitlements,
    configured: Boolean(process.env.STRIPE_SECRET_KEY),
  });
}
