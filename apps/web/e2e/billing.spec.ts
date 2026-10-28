import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { signed } from "./helpers";

function address() {
  return `maya+${randomUUID()}@example.com`;
}

async function onboard(page: Page) {
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

async function signIn(page: Page, email: string) {
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

test.describe("billing", () => {
  test("the endpoints refuse a signed-out caller", async ({ page }) => {
    expect((await page.request.get("/api/billing")).status()).toBe(401);
    expect((await page.request.post("/api/billing/checkout", { data: {} })).status()).toBe(401);
    expect((await page.request.post("/api/billing/portal", { data: {} })).status()).toBe(401);
  });

  test("a new household is on the free plan with the free limits", async ({ page }) => {
    await signIn(page, address());

    const response = await page.request.get("/api/billing");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as {
      plan: string;
      entitlements: { fullTimeline: boolean; pinLimit: number | null; partner: boolean };
      configured: boolean;
    };
    expect(body.plan).toBe("free");
    expect(body.entitlements.fullTimeline).toBe(false);
    expect(body.entitlements.pinLimit).toBe(5);
    expect(body.entitlements.partner).toBe(false);
    // No Stripe key in this environment, and the card says so rather than offering a button.
    expect(body.configured).toBe(false);
  });

  test("a webhook with a bad signature is refused", async ({ page }) => {
    const body = JSON.stringify({ id: "evt_1", type: "customer.created", data: { object: {} } });
    const response = await page.request.post("/api/billing/webhook", {
      data: body,
      headers: { "stripe-signature": signed(body, "whsec_the_wrong_secret") },
    });
    expect(response.status()).toBe(400);
  });

  test("a webhook with no signature at all is refused", async ({ page }) => {
    const response = await page.request.post("/api/billing/webhook", {
      data: JSON.stringify({ id: "evt_1", type: "customer.created", data: { object: {} } }),
    });
    expect(response.status()).toBe(400);
  });

  test("a signed webhook upgrades the household and the plan endpoint agrees", async ({ page }) => {
    await signIn(page, address());

    const before = (await (await page.request.get("/api/billing")).json()) as { plan: string };
    expect(before.plan).toBe("free");

    const household = (await (await page.request.get("/api/household")).json()) as { id: string };
    // A Stripe customer belongs to one household, so the id has to be unique
    // per test — the e2e database is shared by every test in the run.
    const customer = `cus_${randomUUID()}`;
    const body = JSON.stringify({
      id: "evt_e2e",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: household.id,
          customer,
          subscription: `sub_${randomUUID()}`,
          metadata: { plan: "plus" },
        },
      },
    });

    const response = await page.request.post("/api/billing/webhook", {
      data: body,
      headers: { "stripe-signature": signed(body) },
    });
    expect(response.status()).toBe(200);
    expect((await response.json()) as { action: string }).toEqual({
      action: "subscribed",
      householdId: household.id,
    });

    const after = (await (await page.request.get("/api/billing")).json()) as {
      plan: string;
      entitlements: { fullTimeline: boolean; pinLimit: number | null; partner: boolean };
    };
    expect(after.plan).toBe("plus");
    expect(after.entitlements.fullTimeline).toBe(true);
    expect(after.entitlements.pinLimit).toBeNull();
    expect(after.entitlements.partner).toBe(true);
  });

  test("a cancelled subscription drops the household back to free", async ({ page }) => {
    await signIn(page, address());
    const household = (await (await page.request.get("/api/household")).json()) as { id: string };
    const customer = `cus_${randomUUID()}`;

    const subscribe = JSON.stringify({
      id: "evt_e2e_1",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: household.id,
          customer,
          metadata: { plan: "plus" },
        },
      },
    });
    const subscribed = await page.request.post("/api/billing/webhook", {
      data: subscribe,
      headers: { "stripe-signature": signed(subscribe) },
    });
    expect(subscribed.status()).toBe(200);

    const cancel = JSON.stringify({
      id: "evt_e2e_2",
      type: "customer.subscription.deleted",
      data: { object: { customer } },
    });
    const response = await page.request.post("/api/billing/webhook", {
      data: cancel,
      headers: { "stripe-signature": signed(cancel) },
    });
    expect(response.status()).toBe(200);

    const after = (await (await page.request.get("/api/billing")).json()) as {
      plan: string;
      status: string;
      entitlements: { fullTimeline: boolean; pinLimit: number | null };
    };
    expect(after.plan).toBe("free");
    expect(after.status).toBe("canceled");
    expect(after.entitlements.fullTimeline).toBe(false);
    expect(after.entitlements.pinLimit).toBe(5);
  });
});
