import { NextResponse } from "next/server";

import { applyStripeEvent, BadSignatureError, verifyStripeSignature } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";

/**
 * Stripe's webhook.
 *
 * The body is read as text, never as JSON. The signature covers the exact bytes
 * Stripe sent, so parsing and re-serialising would change them and every
 * delivery would fail verification — a bug that looks like a wrong secret.
 *
 * A bad signature is a 400, not a 401: Stripe retries a 5xx and gives up on a
 * 4xx, and a forged delivery should not be retried.
 */
export async function POST(request: Request) {
  const raw = await request.text();

  try {
    verifyStripeSignature(
      raw,
      request.headers.get("stripe-signature"),
      process.env.STRIPE_WEBHOOK_SECRET ?? "",
    );
  } catch (error) {
    if (error instanceof BadSignatureError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const event = JSON.parse(raw) as Parameters<typeof applyStripeEvent>[1];
  const { sql } = await getDb();
  const applied = await applyStripeEvent(sql, event);
  return NextResponse.json(applied);
}
