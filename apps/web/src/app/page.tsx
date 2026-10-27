import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ONBOARDED_COOKIE } from "@/lib/onboarded-cookie";

/**
 * `/` is a signpost, not a page.
 *
 * Which screen a parent should see first lives in localStorage, so this reads
 * the one-bit cookie that mirrors it and answers with a 307 before any
 * JavaScript is sent. That is the whole point of the route: while `/` *was*
 * the dashboard, the redirect could not start until the dashboard had
 * downloaded and hydrated, so a first visit paid for the dashboard's chunk
 * graph and then onboarding's before the first question painted — 5.3s on a
 * throttled phone.
 *
 * A missing cookie means a first visit (the common case) or a parent who
 * cleared cookies (the rare one). Both go to onboarding: a first visit belongs
 * there, and a returning parent is bounced straight on to `/today` by the
 * flow's own guard, which is one hop in a case that is worth one hop.
 */
export default async function HomePage() {
  const onboarded = (await cookies()).get(ONBOARDED_COOKIE)?.value === "1";
  redirect(onboarded ? "/today" : "/onboarding");
}
