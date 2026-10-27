import { expect, test, type Page } from "@playwright/test";

/**
 * A recall has to reach the parent who has the thing, and only them.
 *
 * The pin is seeded into storage rather than tapped through the week view:
 * this suite is about the recall surface, and the pin flow has its own test.
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
  await expect(page).toHaveURL(/\/today$/);
}

async function pinHighChair(page: Page) {
  await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    const state = raw ? JSON.parse(raw) : {};
    state.pins = [
      {
        id: "m6-highchair",
        title: "Get a high chair that is easy to clean",
        packId: "infant-month-6",
        packTitle: "Month 6",
        at: "2026-10-01T00:00:00.000Z",
      },
    ];
    window.localStorage.setItem(key, JSON.stringify(state));
  }, STORAGE_KEY);
  await page.reload();
}

test("a parent who pinned the high-chair step is told about the recall", async ({ page }) => {
  await onboard(page);
  await pinHighChair(page);

  const recalls = page.getByRole("region", { name: "Recalls" });
  await expect(recalls.getByText("You pinned this step.").first()).toBeVisible();
  await expect(recalls.getByRole("heading", { name: /Bicystar high chairs/ })).toBeVisible();
  await expect(
    recalls.getByRole("link", { name: /Consumer Product Safety Commission/ }).first(),
  ).toHaveAttribute("href", /cpsc\.gov/);
});

test("a parent who pinned nothing is told nothing is recalled", async ({ page }) => {
  await onboard(page);

  const recalls = page.getByRole("region", { name: "Recalls" });
  await expect(recalls.getByText("Nothing recalled.")).toBeVisible();
  await expect(recalls.getByRole("link", { name: "See what you can pin" })).toBeVisible();
});

test("putting a notice away is permanent, across a reload", async ({ page }) => {
  await onboard(page);
  await pinHighChair(page);

  const recalls = page.getByRole("region", { name: "Recalls" });
  const putAway = recalls.getByRole("button", { name: "Put this away" });
  await expect(putAway.first()).toBeVisible();

  // Two recalls match the high-chair step, so both have to be put away.
  while ((await putAway.count()) > 0) {
    await putAway.first().click();
  }
  await expect(recalls.getByText("Nothing recalled.")).toBeVisible();

  await page.reload();
  await expect(recalls.getByText("Nothing recalled.")).toBeVisible();
});
