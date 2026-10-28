import { createHmac, randomUUID } from "node:crypto";

import { expect, type Page } from "@playwright/test";

/** The secret the test server signs with. Set in the e2e environment. */
const SECRET = "whsec_e2e_secret";

/** A Stripe-shaped signature header, so the webhook route accepts the event. */
export function signed(body: string, secret = SECRET): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Puts the signed-in household on Plus.
 *
 * Goes through the real webhook rather than a test-only back door, so the flow
 * being exercised is the one Stripe drives in production. A customer id is
 * unique per call because a Stripe customer belongs to one household and the
 * e2e database is shared by every test in the run.
 *
 * The event is a one-time purchase — `payment_status` paid, no subscription —
 * because that is what the checkout now creates.
 */
export async function upgrade(page: Page): Promise<void> {
  const household = (await (await page.request.get("/api/household")).json()) as { id: string };
  const body = JSON.stringify({
    id: `evt_e2e_${randomUUID()}`,
    type: "checkout.session.completed",
    data: {
      object: {
        client_reference_id: household.id,
        customer: `cus_${randomUUID()}`,
        subscription: null,
        payment_status: "paid",
        metadata: { plan: "plus" },
      },
    },
  });

  const response = await page.request.post("/api/billing/webhook", {
    data: body,
    headers: { "stripe-signature": signed(body) },
  });
  expect(response.status()).toBe(200);
}

/** A unique address per test: the e2e database is shared by the whole run. */
export function address(): string {
  return `maya+${randomUUID()}@example.com`;
}

/**
 * Puts the browser back to "a parent who has never been here".
 *
 * The store lives in localStorage and outlives a sign-out, so a spec that
 * onboards a second person in the same browser has to forget the first one:
 * `/onboarding` sends an already-onboarded parent to `/today` on purpose, so
 * without this the flow never renders and the first click waits forever.
 * Cookies go too — the session and the `ntt_onboarded` mirror both describe
 * the person being replaced.
 */
export async function forgetEverything(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/signin");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

/** Walks onboarding, which leaves the parent at week 28 with no account. */
export async function onboard(page: Page): Promise<void> {
  await forgetEverything(page);
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /^I am the parent/ }).click();
  await page.getByRole("button", { name: /^I am pregnant/ }).click();
  await page.getByRole("button", { name: /assume I am 28 weeks/ }).click();
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page).toHaveURL(/\/today$/);
}

/** Onboards, then signs in through the dev link the auth tests use. */
export async function signIn(page: Page, email: string): Promise<void> {
  await onboard(page);
  const csrf = ((await (await page.request.get("/api/auth/csrf")).json()) as { csrfToken: string })
    .csrfToken;
  await page.request.post("/api/auth/signin/email", {
    form: { email, csrfToken: csrf },
    maxRedirects: 0,
  });
  const { url } = (await (
    await page.request.get(`/api/auth/dev/link?email=${encodeURIComponent(email)}`)
  ).json()) as { url: string };
  await page.goto(url);
  await page.waitForURL((u) => u.pathname === "/today");
}

/**
 * Opens the week the parent is on.
 *
 * `/week` is a signpost that redirects to `/week/<id>`, so anything that reads
 * the page synchronously has to wait for the address to settle first.
 */
export async function gotoWeek(page: Page): Promise<string> {
  await page.goto("/week");
  await expect(page).toHaveURL(/\/week\/[a-z0-9-]+$/);
  return page.url();
}
