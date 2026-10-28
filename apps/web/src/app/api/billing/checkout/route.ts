import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/session";
import { getDb } from "@/lib/auth/db";
import { ensureScope } from "@/lib/auth/household";
import { PRICE_CENTS, PRODUCT_NAME } from "@/lib/pricing";

/**
 * Buy the guide, once.
 *
 * `mode: "payment"` rather than `"subscription"`: five dollars, one time, and
 * nothing renews. There is no month to miss, no dunning email and no cancel
 * flow, because there is no second charge.
 *
 * There are no Stripe credentials in this environment, so this route is honest
 * about it rather than pretending: without a secret key it answers 503 and the
 * settings page shows a note instead of a button. `client_reference_id` is the
 * household id — that is what `applyStripeEvent` reads back off the completed
 * checkout to know who paid — and `customer_creation` is forced so the same
 * household can be found again from a refund's charge.
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

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({
    mode: "payment",
    client_reference_id: scope.householdId,
    customer_creation: "always",
    "metadata[plan]": "plus",
    "payment_intent_data[metadata][household_id]": scope.householdId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(PRICE_CENTS),
    "line_items[0][price_data][product_data][name]": PRODUCT_NAME,
    success_url: `${origin}/settings?billing=done`,
    cancel_url: `${origin}/settings?billing=cancelled`,
  });

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
