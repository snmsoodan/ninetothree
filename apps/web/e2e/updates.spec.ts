import { expect, test, type Page } from "@playwright/test";

/**
 * Updates narrows the recall list to the child's age.
 *
 * The dashboard card and the page share one filter, so both are checked here:
 * a parent who has told us nothing is not guessed at, and a parent who has
 * told us the dates sees the recalls that actually apply.
 *
 * The suite runs with `RECALLS_OFFLINE=1`, so these tests never touch the CPSC
 * or FDA registers. That is deliberate twice over: a test suite that needs
 * somebody else's server fails when that server is down, and the offline path
 * is the one a parent hits when it is. What is asserted here is therefore the
 * *fallback* — the curated nine, with the page saying so — while the live path
 * is covered by the unit tests around the fetcher and the normalizers.
 */

/** A birth date `months` ago, on the 15th so month lengths cannot shift it. */
function birthDate(months: number): string {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 15));
  return date.toISOString().slice(0, 10);
}

async function onboardWithBaby(page: Page, monthsOld: number) {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /^I am the parent/ }).click();
  await page.getByRole("button", { name: /^My baby is here/ }).click();
  await page.locator("#date").fill(birthDate(monthsOld));
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page).toHaveURL(/\/today$/);
}

test("updates is reachable from the main navigation", async ({ page }) => {
  await page.goto("/updates");
  await expect(page.getByRole("heading", { name: "Updates", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Updates" })).toBeVisible();
});

test("the page says where the list comes from, and admits when it is stale", async ({ page }) => {
  await page.goto("/updates");

  // Offline, so the page falls back to the list we checked ourselves and says
  // so rather than pretending a register answered.
  await expect(page.getByText(/this is the list we have read and checked ourselves/)).toBeVisible();
  await expect(page.getByText(/The CPSC and the FDA are polled/)).toBeVisible();
});

test("a parent who has told us no dates is not guessed at", async ({ page }) => {
  await page.goto("/updates");
  await expect(page.getByText(/Once you tell us your due date or your baby/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Everything we know" })).toBeVisible();
});

test("the age filter is stated, and only the matching recalls are listed", async ({ page }) => {
  await onboardWithBaby(page, 18);
  await page.goto("/updates");

  await expect(page.getByText(/^Showing what applies at 18 months old\.$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "For this age" })).toBeVisible();

  // An 18-month-old is inside the window for high chairs and solid food, and
  // outside it for a baby lounger and infant formula.
  await expect(page.getByRole("heading", { name: /Bicystar high chairs/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Peter Rabbit Organics/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /CooCooBaby/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /ByHeart/ })).toHaveCount(0);
});

test("the official registers are linked so a parent can check for themselves", async ({ page }) => {
  await page.goto("/updates");

  await page.getByRole("link", { name: "Check it yourself" }).click();
  await expect(page.getByRole("heading", { name: "Check it yourself" })).toBeInViewport();

  for (const href of [
    /cpsc\.gov/,
    /fda\.gov/,
    /nhtsa\.gov/,
    /fsis\.usda\.gov/,
    /saferproducts\.gov/,
  ]) {
    await expect(page.getByRole("link", { name: href }).first()).toHaveAttribute("href", href);
  }
});

test("a parent with no dates still sees the recalls we have checked", async ({ page }) => {
  await page.goto("/updates");
  await expect(page.getByRole("heading", { name: /Peter Rabbit Organics/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /ByHeart/ })).toBeVisible();
});

test("the dashboard card points at the full page", async ({ page }) => {
  await onboardWithBaby(page, 18);

  const card = page.getByRole("region", { name: "Worth knowing now" });
  await expect(card.getByText("at 18 months old")).toBeVisible();
  await card.getByRole("link", { name: /more in Updates|All updates/ }).click();
  await expect(page).toHaveURL(/\/updates$/);
});
