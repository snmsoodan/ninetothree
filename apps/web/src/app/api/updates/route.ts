import { NextResponse } from "next/server";

import { RecallFeed } from "@ninetothree/contracts";

import { getRecallFeed } from "@/lib/recall-feed";

/**
 * The updates feed, as the browser sees it.
 *
 * Public, because a recall is not a secret and the page that lists them is
 * public too. Cheap, because the two upstream fetches are cached for an hour
 * inside Next's data cache and this handler adds nothing to them.
 *
 * `force-dynamic` rather than a prerendered response on purpose: a prerendered
 * one would run at build time, and a build that needs the CPSC API is a build
 * that fails in CI and on a laptop on a train. The upstream cache is what makes
 * it fast; the route stays a route.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  const feed = await getRecallFeed({ today });

  return NextResponse.json(RecallFeed.parse(feed), {
    headers: {
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
