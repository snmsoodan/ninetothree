import { expect, test, type Page } from "@playwright/test";

/**
 * The path a brand-new parent takes: land, answer three questions, get a week,
 * finish one thing, pin another, find both on the shelf.
 *
 * If this test is red, the product does not work.
 */

async function onboardAsPregnant(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByRole("button", { name: /I am pregnant/ }).click();
  await page.getByRole("button", { name: /assume I am 28 weeks/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("That is everything we need.")).toBeVisible();
  await page.getByRole("button", { name: "Show me" }).click();
}

test("a new parent can get from the front door to a finished step", async ({ page }) => {
  await onboardAsPregnant(page);

  await expect(page).toHaveURL(/\/week$/);
  // The header names the stage; the h1 is the week's headline, not a number.
  await expect(page.getByText("Week 28", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Done" }).first().click();
  await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();

  await page.getByRole("button", { name: /^Pin / }).first().click();

  await page.getByRole("link", { name: "Shelf" }).click();
  await expect(page).toHaveURL(/\/shelf$/);
  await expect(page.getByRole("heading", { name: "Pinned" })).toBeVisible();
  await expect(page.getByText(/1 step done/)).toBeVisible();
});

test("skipping is allowed and reversible", async ({ page }) => {
  await onboardAsPregnant(page);

  await page.getByRole("button", { name: "Skip" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("radio", { name: /Skip without saying why/ }).click();
  await page.getByRole("button", { name: "Skip it" }).click();

  await expect(page.getByRole("button", { name: "Undo skip" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Undo skip" }).first().click();
  await expect(page.getByRole("button", { name: "Skip" }).first()).toBeVisible();
});

test("the design system is actually applied", async ({ page }) => {
  // Tailwind only scans the app by default. When the UI package is not named in
  // @source, every class in the design system silently disappears and the whole
  // product renders unstyled while every other test still passes.
  await onboardAsPregnant(page);

  const done = page.getByRole("button", { name: "Done" }).first();
  const box = await done.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(32);

  await page.getByRole("button", { name: "Skip" }).first().click();
  const dialog = await page.getByRole("dialog").boundingBox();
  const viewport = page.viewportSize();
  expect(dialog).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (!dialog || !viewport) return;
  expect(dialog.y).toBeGreaterThanOrEqual(0);
  expect(dialog.y + dialog.height).toBeLessThanOrEqual(viewport.height);
  expect(dialog.x + dialog.width).toBeLessThanOrEqual(viewport.width);
});

test("the safety page lists every escalation number", async ({ page }) => {
  await page.goto("/safety");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "911" })).toBeVisible();
  await expect(page.getByRole("link", { name: "1-800-222-1222" })).toBeVisible();
  await expect(page.getByRole("link", { name: "988" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Every warning sign/ })).toBeVisible();
});

test("state survives a reload", async ({ page }) => {
  await onboardAsPregnant(page);
  await page.getByRole("button", { name: "Done" }).first().click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();
});

test("erasing everything really erases everything", async ({ page }) => {
  await onboardAsPregnant(page);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Erase everything", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Erase", exact: true }).click();
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);
});

test("every week page renders without a client error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await onboardAsPregnant(page);
  for (const id of ["pregnancy-w28", "pregnancy-w39", "postpartum-week-1", "infant-month-2"]) {
    await page.goto(`/week/${id}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("a late joiner gets a short catch-up, not a backlog", async ({ page }) => {
  await onboardAsPregnant(page);

  // The week's own three things come first.
  await expect(page.getByRole("heading", { name: "Before this week" })).toBeVisible();
  await expect(page.getByText(/You are on Week 28/)).toBeVisible();
  await expect(page.getByText(/nothing expires/)).toBeVisible();

  // Closed by default, and never a wall of twenty-six weeks.
  const toggle = page.getByRole("button", { name: /^Show the \d+ things?$/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("heading", { name: "Book your anatomy scan" })).toHaveCount(0);

  await toggle.click();
  await expect(page.getByRole("heading", { name: "Book your anatomy scan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Book your first prenatal visit" })).toBeVisible();

  // Nothing older than the window leaks in.
  await expect(page.getByRole("heading", { name: /Week 4\b/ })).toHaveCount(0);

  // Clearing one removes it from the list.
  await page.locator("#catchup-list").getByRole("button", { name: "Done" }).first().click();
  await expect(page.getByRole("heading", { name: "Book your anatomy scan" })).toHaveCount(0);
});
