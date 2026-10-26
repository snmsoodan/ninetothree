import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/session";
import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";

/**
 * Start a subscription.
 *
 * There are no Stripe credentials in this environment, so this route is honest
 * about it rather than pretending: without a secret key it answers 503 and the
 * settings page shows a note instead of a button. The request it would make is
 * written down here so the shape is reviewable, and `client_reference_id` is
 * the household id — that is what `applyStripeEvent` reads back off the
 * completed checkout to know who paid.
 */
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Billing is not configured yet." }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as { plan?: string };
  const plan = body.plan === "family" ? "family" : "plus";

  const { sql } = await getDb();
  const scope = await ensureScope(sql, userId);

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({
    mode: "subscription",
    client_reference_id: scope.householdId,
    "metadata[plan]": plan,
    success_url: `${origin}/settings?billing=done`,
    cancel_url: `${origin}/settings?billing=cancelled`,
  });
  const price = process.env[plan === "family" ? "STRIPE_PRICE_FAMILY" : "STRIPE_PRICE_PLUS"];
  if (price) form.set("line_items[0][price]", price);
  if (price) form.set("line_items[0][quantity]", "1");

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${secret}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Stripe would not start a checkout." }, { status: 502 });
  }

  const created = (await response.json()) as { url?: string };
  if (!created.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout." }, { status: 502 });
  }
  return NextResponse.json({ url: created.url });
}
