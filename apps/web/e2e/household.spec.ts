import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

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

test.describe("the household", () => {
  test("a new account starts with a household of one", async ({ page }) => {
    const email = address();
    await signIn(page, email);
    await page.goto("/settings");

    const section = page.getByRole("region", { name: "Your household" });
    await expect(section.getByText("You", { exact: true })).toBeVisible();
    await expect(section.getByText("Parent", { exact: true })).toBeVisible();
    await expect(section.getByText(/It is only you here/)).toBeVisible();
  });

  test("signed out, it explains what a household is instead of failing", async ({ page }) => {
    await onboard(page);
    await page.goto("/settings");

    const section = page.getByRole("region", { name: "Your household" });
    await expect(section.getByText(/A household is what lets two people/)).toBeVisible();
    await expect(section.getByRole("link", { name: "Sign in to set one up" })).toBeVisible();
  });

  test("leaving asks first, and staying changes nothing", async ({ page }) => {
    await signIn(page, address());
    await page.goto("/settings");

    await page.getByRole("button", { name: "Leave household" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading")).toContainText("Leave this household?");
    await dialog.getByRole("button", { name: "Stay" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const response = await page.request.get("/api/household");
    expect(response.status()).toBe(200);
    expect(((await response.json()) as { members: unknown[] }).members).toHaveLength(1);
  });

  test("leaving gives you a household of your own, not an error", async ({ page }) => {
    await signIn(page, address());
    await page.goto("/settings");

    await page.getByRole("button", { name: "Leave household" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Leave" }).click();

    const section = page.getByRole("region", { name: "Your household" });
    await expect(section.getByText(/It is only you here/)).toBeVisible();

    const response = await page.request.get("/api/household");
    expect(response.status()).toBe(200);
    expect(((await response.json()) as { members: unknown[] }).members).toHaveLength(1);
  });

  test("the household endpoint refuses a signed-out caller", async ({ page }) => {
    await onboard(page);
    const response = await page.request.get("/api/household");
    expect(response.status()).toBe(401);
  });
});
