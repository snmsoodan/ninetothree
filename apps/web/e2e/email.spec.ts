import { expect, test, type Page } from "@playwright/test";

/**
 * The weekly email, as the parent would see it.
 *
 * There is no transport in this version, so what is proven here is the content
 * and the gate: three actions, a partner card, a red flag, and a plain sentence
 * when nothing would be sent. The send itself is unit-tested against a fake
 * transport in `lib/email.test.ts`.
 */

const STORAGE_KEY = "ninetothree.v1";

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

/** Writes straight to storage, then reloads so the store re-hydrates. */
async function seed(page: Page, patch: Record<string, unknown>) {
  await page.evaluate(
    ({ key, patch }) => {
      const raw = window.localStorage.getItem(key);
      const state = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(key, JSON.stringify({ ...state, ...patch }));
    },
    { key: STORAGE_KEY, patch },
  );
  await page.reload();
}

const EMAIL_ON = {
  email: true,
  push: false,
  frequency: "weekly",
  paused: false,
  quietFrom: 21,
  quietTo: 8,
};

test("the preview shows three actions, a partner card and a red flag", async ({ page }) => {
  await onboard(page);
  await seed(page, { notifications: EMAIL_ON });
  await page.goto("/email");

  await expect(page.getByRole("heading", { name: "The weekly email" })).toBeVisible();
  await expect(page.getByText("Week 28", { exact: true })).toBeVisible();
  await expect(page.getByText("If someone is helping you this week")).toBeVisible();
  await expect(page.getByText("Call your OB triage line")).toBeVisible();

  const actions = page.locator("main ul > li");
  await expect(actions).toHaveCount(3);
});

test("the preview says plainly that nothing is sent yet", async ({ page }) => {
  await onboard(page);
  await seed(page, { notifications: EMAIL_ON });
  await page.goto("/email");
  await expect(page.getByText(/Nothing is sent yet/)).toBeVisible();
});

test("with the email off, the preview says so instead of showing an email", async ({ page }) => {
  await onboard(page);
  await page.goto("/email");

  await expect(
    page.getByRole("heading", { name: "Nothing would be sent this week" }),
  ).toBeVisible();
  await expect(page.getByText("The weekly email is off.")).toBeVisible();
  await expect(page.getByText("If someone is helping you this week")).toHaveCount(0);
});

test("after a loss, the preview says nothing is sent", async ({ page }) => {
  await onboard(page);
  await seed(page, { notifications: EMAIL_ON, profile: { loss: "baby" } });
  await page.goto("/email");

  await expect(
    page.getByRole("heading", { name: "Nothing would be sent this week" }),
  ).toBeVisible();
  await expect(page.getByText("Nothing is sent while the guide is paused.")).toBeVisible();
});

test("once every action is settled, no email is built", async ({ page }) => {
  await onboard(page);
  await seed(page, {
    notifications: EMAIL_ON,
    progress: {
      "w28-glucose": { status: "done", at: "2026-10-19T10:00:00.000Z" },
      "w28-tdap": { status: "done", at: "2026-10-19T10:00:00.000Z" },
      "w28-kick-counts": { status: "skipped", at: "2026-10-19T10:00:00.000Z" },
    },
  });
  await page.goto("/email");

  await expect(
    page.getByRole("heading", { name: "Nothing would be sent this week" }),
  ).toBeVisible();
  await expect(
    page.getByText("You have done everything for this week. Nothing is sent."),
  ).toBeVisible();
});

test("the settings page links to the preview", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");
  await page.getByRole("link", { name: /See what this week.s email would say/ }).click();
  await expect(page).toHaveURL(/\/email$/);
  await expect(page.getByRole("heading", { name: "The weekly email" })).toBeVisible();
});

test("turning the email off from the preview is one click", async ({ page }) => {
  await onboard(page);
  await seed(page, { notifications: EMAIL_ON });
  await page.goto("/email");

  await page.getByRole("link", { name: "Turn it off" }).click();
  await expect(page).toHaveURL(/\/settings#notify-heading$/);
  await expect(page.getByRole("heading", { name: "What we send you" })).toBeVisible();
});
