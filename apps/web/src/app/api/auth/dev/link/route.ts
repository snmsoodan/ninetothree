import { NextResponse } from "next/server";

import { mintLinkToken } from "@ninetothree/db";

import { getDb } from "@/lib/auth/db";

/**
 * Hands back the newest live sign-in link for an address.
 *
 * This exists so the end-to-end suite can drive the real magic-link flow —
 * request a link, follow it, land signed in — without an inbox. It is the only
 * way to test the token table, the expiry and the replay refusal through a
 * browser, and those are the three things the issue asks to be proven.
 *
 * It answers 404 unless `AUTH_TEST_MODE=1`. That variable is set by the
 * Playwright configuration and nowhere else, and the deployment runbook
 * (issue #52) has to assert it is unset — a server that answers this endpoint
 * hands out working sign-in links to anyone who asks.
 */
export async function GET(request: Request) {
  if (process.env.AUTH_TEST_MODE !== "1") {
    return new NextResponse(null, { status: 404 });
  }

  const params = new URL(request.url).searchParams;
  const email = params.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const { sql } = await getDb();

  // The token cannot be read back out of the table: Auth.js stores only its
  // hash, which is the point. So this mints one the same way Auth.js does —
  // raw value in the URL, hash in the row — and the callback accepts it.
  //
  // `expire=1` mints one that has already run out, so the suite can prove what
  // a parent sees when a link is stale without waiting fifteen minutes for it.
  const { token, expires } = await mintLinkToken(sql, email, {
    secret: process.env.AUTH_SECRET ?? "",
    ttlMs: params.get("expire") === "1" ? -60_000 : undefined,
  });

  // Relative on purpose. The session cookie is scoped to the host the browser
  // is on, and this route cannot know that host: `request.url` reports whatever
  // the server thinks its own origin is, which is not necessarily the one the
  // caller used. Handing back a path lets the browser resolve it against the
  // origin it is already on, so the cookie lands where the next request looks.
  const callbackUrl = new URLSearchParams({ token, email, callbackUrl: "/" });

  return NextResponse.json({ url: `/api/auth/callback/email?${callbackUrl}`, expires });
}
