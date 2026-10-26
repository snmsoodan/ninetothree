import { NextResponse } from "next/server";

import { getSubscription } from "@ninetothree/db";

import { auth } from "@/lib/auth/session";
import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";

/**
 * The billing portal, where a card is changed or a subscription is cancelled.
 *
 * Cancelling has to be possible without emailing us, so this is not optional
 * polish. It needs a Stripe customer id, which only exists once somebody has
 * subscribed — a free household has nothing to manage.
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);
  const subscription = await getSubscription(sql, scope);
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: "There is no subscription to manage." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/settings`,
    }).toString(),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Stripe would not open the portal." }, { status: 502 });
  }

  const created = (await response.json()) as { url?: string };
  if (!created.url) {
    return NextResponse.json({ error: "Stripe did not return a portal." }, { status: 502 });
  }
  return NextResponse.json({ url: created.url });
}
