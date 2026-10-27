import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { forgetEverything, gotoWeek, upgrade } from "./helpers";

function address() {
  return `maya+${randomUUID()}@example.com`;
}

async function onboard(page: Page) {
  await forgetEverything(page);
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /I am pregnant/ }).click();
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

async function signOut(page: Page) {
  const csrf = ((await (await page.request.get("/api/auth/csrf")).json()) as { csrfToken: string })
    .csrfToken;
  await page.request.post("/api/auth/signout", { form: { csrfToken: csrf }, maxRedirects: 0 });
}

async function makeLink(page: Page): Promise<string> {
  // The invite form is part of Plus, so the household has to be on it before
  // the button exists.
  await upgrade(page);
  await page.goto("/settings");
  const section = page.getByRole("region", { name: "Invite someone" });
  await section.getByRole("button", { name: "Make a link" }).click();
  const link = await section.locator("p.font-mono").textContent();
  return new URL(link!.trim()).pathname;
}

/** Pins the first action on the current week and shares it. */
async function shareAPin(page: Page) {
  await gotoWeek(page);
  await page.getByRole("button", { name: /^Pin/ }).first().click();
  await page.goto("/today");
  await page.getByRole("button", { name: "Share with your household" }).first().click();
  await expect(
    page.getByRole("button", { name: "Shared with your household" }).first(),
  ).toBeVisible();
}

/**
 * Two people in one household, with a pin shared by the first of them.
 *
 * The share control only appears once there is somebody to share with, so the
 * second person has to join before the first one can share anything.
 */
async function twoPeopleWithASharedPin(page: Page) {
  const first = address();
  const second = address();

  await signIn(page, first);
  const path = await makeLink(page);

  await signOut(page);
  await signIn(page, second);
  await page.goto(path);
  await page.getByRole("button", { name: "Join" }).click();
  await expect(page).toHaveURL(/\/today$/);

  await signOut(page);
  await signIn(page, first);
  await shareAPin(page);

  await signOut(page);
  await signIn(page, second);
}

test.describe("the partner view", () => {
  test("a partner sees a shared pin and the week's jobs", async ({ page }) => {
    await twoPeopleWithASharedPin(page);

    await page.goto("/together");
    await expect(page.getByRole("heading", { name: "How to help this week" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Shared" })).toBeVisible();
    await expect(page.getByText("Nothing shared yet.")).not.toBeVisible();
  });

  test("the payload has nowhere to put a note", async ({ page }) => {
    await twoPeopleWithASharedPin(page);

    const response = await page.request.get("/api/household/together?stage=pregnancy-w28");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { shared: Record<string, unknown>[] };
    expect(body.shared.length).toBeGreaterThan(0);
    for (const item of body.shared) {
      expect(Object.keys(item).sort()).toEqual(
        ["isYours", "itemId", "packTitle", "sharedBy", "stagePackId", "title"].sort(),
      );
    }
  });

  test("signed out, the page offers a way in", async ({ page }) => {
    await page.goto("/together");
    await expect(page.getByText("Sign in to see this.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/signin?callbackUrl=/together",
    );
  });

  test("the dashboard only offers sharing when there is somebody to share with", async ({
    page,
  }) => {
    await signIn(page, address());
    await gotoWeek(page);
    await page.getByRole("button", { name: /^Pin/ }).first().click();
    await page.goto("/today");

    await expect(page.getByRole("button", { name: /Share with your household/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Open Together" })).toHaveCount(0);
  });

  test("the endpoint refuses a signed-out caller", async ({ page }) => {
    const response = await page.request.get("/api/household/together");
    expect(response.status()).toBe(401);
  });
});
