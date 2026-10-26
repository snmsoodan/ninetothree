import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

function address() {
  return `maya+${randomUUID()}@example.com`;
}

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
  await page.waitForURL((u) => u.pathname === "/");
}

async function signOut(page: Page) {
  const csrf = ((await (await page.request.get("/api/auth/csrf")).json()) as { csrfToken: string })
    .csrfToken;
  await page.request.post("/api/auth/signout", { form: { csrfToken: csrf }, maxRedirects: 0 });
}

/** Makes a link from the settings page and returns the path it points at. */
async function makeLink(page: Page, role = "partner"): Promise<string> {
  await page.goto("/settings");
  const section = page.getByRole("region", { name: "Invite someone" });
  await section.getByLabel("They join as").selectOption(role);
  await section.getByRole("button", { name: "Make a link" }).click();
  const link = await section.locator("p.font-mono").textContent();
  return new URL(link!.trim()).pathname;
}

test.describe("inviting someone", () => {
  test("a link brings a second person into the household", async ({ page }) => {
    await signIn(page, address());
    const path = await makeLink(page);

    await signOut(page);
    await signIn(page, address());
    await page.goto(path);

    await expect(page.getByRole("heading", { name: /Join .*\?/ })).toBeVisible();
    await page.getByRole("button", { name: "Join this household" }).click();
    await page.waitForURL((u) => u.pathname === "/");

    await page.goto("/settings");
    const section = page.getByRole("region", { name: "Your household" });
    await expect(section.getByText("You", { exact: true })).toBeVisible();
    await expect(section.getByText("Partner", { exact: true })).toBeVisible();
    await expect(
      section.getByText(/Your own notes and your own progress stay yours/),
    ).toBeVisible();
  });

  test("a link works once", async ({ page }) => {
    await signIn(page, address());
    const path = await makeLink(page);

    await signOut(page);
    await signIn(page, address());
    await page.goto(path);
    await page.getByRole("button", { name: "Join this household" }).click();
    await page.waitForURL((u) => u.pathname === "/");

    await signOut(page);
    await signIn(page, address());
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "This link has been used" })).toBeVisible();
  });

  test("a revoked link stops working immediately", async ({ page }) => {
    await signIn(page, address());
    const path = await makeLink(page);

    await page.goto("/settings");
    const section = page.getByRole("region", { name: "Invite someone" });
    await section.getByRole("button", { name: "Revoke" }).click();
    await expect(section.getByRole("button", { name: "Revoke" })).toHaveCount(0);

    await signOut(page);
    await signIn(page, address());
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "This link has been used" })).toBeVisible();
  });

  test("signed out, the link offers a way in rather than a dead end", async ({ page }) => {
    await signIn(page, address());
    const path = await makeLink(page);
    await signOut(page);

    await page.goto(path);
    await expect(page.getByRole("heading", { name: /Join .*\?/ })).toBeVisible();
    const link = page.getByRole("link", { name: "Sign in to join" });
    await expect(link).toHaveAttribute("href", `/signin?callbackUrl=${encodeURIComponent(path)}`);
  });

  test("a link nobody issued says so", async ({ page }) => {
    await onboard(page);
    await page.goto("/join/not-a-real-token");
    await expect(page.getByRole("heading", { name: "This link has been used" })).toBeVisible();
  });

  test("the endpoint refuses a signed-out caller", async ({ page }) => {
    await onboard(page);
    const response = await page.request.post("/api/household/invites", {
      data: { role: "partner" },
    });
    expect(response.status()).toBe(401);
  });
});
