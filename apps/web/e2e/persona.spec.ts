import { expect, test, type Page } from "@playwright/test";

import { forgetEverything, gotoWeek } from "./helpers";

/**
 * A grandparent's first visit.
 *
 * The guide is written for the person who is pregnant. Everyone else reads it
 * over their shoulder and finds a page that is not about them, so this file is
 * about the two things that must be true for them: the questions are in their
 * own words, and the week asks them for something they can actually do.
 */

async function onboardAsGrandparent(page: Page) {
  await forgetEverything(page);
  await page.goto("/onboarding");

  await page.getByRole("button", { name: /^I am a grandparent/ }).click();
  await page.getByRole("button", { name: /^My grandchild is on the way/ }).click();
  await page.getByRole("button", { name: /assume I am 28 weeks/ }).click();
  // date, country — a grandparent is not asked about feeding or first babies
  for (let i = 0; i < 2; i += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page).toHaveURL(/\/today$/);
}

test("a grandparent is asked in their own words, and lands on their own week", async ({ page }) => {
  await forgetEverything(page);
  await page.goto("/onboarding");

  await expect(page.getByRole("heading", { name: "Who is reading?" })).toBeVisible();
  await page.getByRole("button", { name: /^I am a grandparent/ }).click();

  await expect(page.getByRole("button", { name: /^My grandchild is on the way/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^I am pregnant/ })).toHaveCount(0);

  await page.getByRole("button", { name: /^My grandchild is on the way/ }).click();
  await expect(page.getByRole("heading", { name: "When is the baby due?" })).toBeVisible();
});

test("a grandparent's dashboard reads for them, and the full week is one tap away", async ({
  page,
}) => {
  await onboardAsGrandparent(page);

  const week = page.getByRole("link", { name: "Read this week in full" });
  await expect(week).toBeVisible();
  await week.click();

  await expect(page).toHaveURL(/\/week\/[a-z0-9-]+$/);
  // The parent's own list of jobs is not the grandparent's list of jobs.
  await expect(page.getByRole("heading", { name: /^The \d+ things?$/ })).toHaveCount(0);
  await expect(
    page.getByText(/Call your provider|Call 911|Go to the emergency room/).first(),
  ).toBeVisible();
});

test("changing the reader in settings changes the next screen in one tap", async ({ page }) => {
  await onboardAsGrandparent(page);
  await gotoWeek(page);

  await page.goto("/settings");
  await page.getByRole("radio", { name: /I am the parent/ }).click();

  await page.goto("/today");
  await expect(page.getByRole("link", { name: "Read this week in full" })).toHaveCount(0);
});

test("a grandparent can pin what the week asks of them", async ({ page }) => {
  await onboardAsGrandparent(page);
  await gotoWeek(page);

  // A week that was written for them has real, checkable steps; a band does
  // not. Either way there is something to keep, so this asserts the shelf.
  const pin = page.getByRole("button", { name: /^Pin / }).first();
  const title = (await pin.getAttribute("aria-label"))!.replace(/^Pin /, "");
  await pin.click();

  await page.goto("/shelf");
  await expect(page.getByText(title)).toBeVisible();
});
