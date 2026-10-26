import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

/**
 * Every test gets its own address.
 *
 * The rate limiter counts per address, so a shared one would make the suite
 * order-dependent: five requests across five tests and the sixth is refused.
 * A module-level counter is not enough — Playwright gives each worker its own
 * copy of this module, so every worker would start at one and collide.
 */
function address() {
  return `maya+${randomUUID()}@example.com`;
}

/** A fresh browser has no local state, so the app sends it to onboarding. */
async function onboard(page: Page) {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /I am pregnant/ }).click();
  await page.getByRole("button", { name: /assume I am 28 weeks/ }).click();
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function csrf(page: Page) {
  const response = await page.request.get("/api/auth/csrf");
  return ((await response.json()) as { csrfToken: string }).csrfToken;
}

/** Asks for a link the way the sign-in page does, then reads it back. */
async function requestLink(page: Page, email: string, expire = false) {
  const asked = await page.request.post("/api/auth/signin/email", {
    form: { email, csrfToken: await csrf(page) },
    maxRedirects: 0,
  });
  expect(asked.status()).toBeLessThan(400);

  const response = await page.request.get(
    `/api/auth/dev/link?email=${encodeURIComponent(email)}${expire ? "&expire=1" : ""}`,
  );
  expect(response.status()).toBe(200);
  const { url } = (await response.json()) as { url: string };
  return url;
}

/** The callback redirects to `/`, on whichever host the server was reached by. */
async function follow(page: Page, url: string) {
  await page.goto(url);
  await page.waitForURL((u) => u.pathname === "/");
}

async function signIn(page: Page, email: string) {
  await onboard(page);
  await follow(page, await requestLink(page, email));
}

test.describe("signing in", () => {
  test("a link from the sign-in page signs you in", async ({ page }) => {
    const email = address();
    await onboard(page);

    await page.goto("/signin");
    await page.getByLabel("Your email").fill(email);
    await page.getByRole("button", { name: "Send me a link" }).click();

    await expect(page).toHaveURL(/\/signin\/check-email/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Check your email");

    const response = await page.request.get(
      `/api/auth/dev/link?email=${encodeURIComponent(email)}`,
    );
    expect(response.status()).toBe(200);
    const { url } = (await response.json()) as { url: string };

    await follow(page, url);

    const session = await page.request.get("/api/auth/session");
    expect((await session.json()).user.email).toBe(email);
  });

  test("the settings page says who you are, and signs you out", async ({ page }) => {
    const email = address();
    await signIn(page, email);
    await page.goto("/settings");

    await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL((u) => u.pathname === "/");

    const session = await page.request.get("/api/auth/session");
    expect(await session.json()).toBeNull();
  });

  test("signed out, settings offers a way in rather than an error", async ({ page }) => {
    await onboard(page);
    await page.goto("/settings");

    const account = page.getByRole("region", { name: "Account" });
    await expect(account.getByText(/You are not signed in/)).toBeVisible();
    await expect(account.getByRole("link", { name: "Sign in to keep it" })).toBeVisible();
  });
});

test.describe("a link that should not work", () => {
  test("a link used twice works once", async ({ page }) => {
    await onboard(page);
    const url = await requestLink(page, address());

    await follow(page, url);

    await page.goto(url);
    await expect(page).toHaveURL(/\/signin\/error/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("That link has been used");
  });

  test("an expired link says so, in words", async ({ page }) => {
    await onboard(page);
    const url = await requestLink(page, address(), true);

    await page.goto(url);
    await expect(page).toHaveURL(/\/signin\/error/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("That link has been used");
    await expect(page.getByRole("link", { name: "Ask for a new link" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Verification");
  });
});

test.describe("asking too often", () => {
  test("the sixth request in fifteen minutes is refused, and says when to try", async ({
    page,
  }) => {
    const email = address();

    for (let i = 0; i < 5; i += 1) {
      const response = await page.request.post("/api/auth/signin/email", {
        form: { email, csrfToken: await csrf(page) },
        maxRedirects: 0,
      });
      expect(response.status()).toBeLessThan(400);
    }

    const refused = await page.request.post("/api/auth/signin/email", {
      form: { email, csrfToken: await csrf(page) },
      maxRedirects: 0,
    });

    expect(refused.status()).toBe(429);
    expect(Number(refused.headers()["retry-after"])).toBeGreaterThan(0);
    const body = await refused.json();
    expect(body.error).toBe("too-many-requests");
  });
});
