import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility is a product promise, not a checkbox. Every surface a parent
 * can reach must pass WCAG 2.2 AA with zero violations.
 */

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.map((node) => node.target.join(" ")),
  }));
}

async function onboard(page: Page) {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /I am pregnant/ }).click();
  await page.getByRole("button", { name: /assume I am 28 weeks/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page).toHaveURL(/\/week$/);
}

test("onboarding has no violations", async ({ page }) => {
  await page.goto("/onboarding");
  expect(await audit(page)).toEqual([]);
});

test("the week page has no violations", async ({ page }) => {
  await onboard(page);
  expect(await audit(page)).toEqual([]);
});

test("the shelf has no violations", async ({ page }) => {
  await onboard(page);
  await page.goto("/shelf");
  expect(await audit(page)).toEqual([]);
});

test("the library has no violations", async ({ page }) => {
  await onboard(page);
  await page.goto("/library");
  expect(await audit(page)).toEqual([]);
});

test("the library has no violations with a filter applied", async ({ page }) => {
  await onboard(page);
  await page.goto("/library");
  await page.getByLabel("What do you need?").selectOption("sleep");
  expect(await audit(page)).toEqual([]);
});

test("the safety page has no violations", async ({ page }) => {
  await page.goto("/safety");
  expect(await audit(page)).toEqual([]);
});

test("settings has no violations", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");
  expect(await audit(page)).toEqual([]);
});

test("the skip dialog has no violations", async ({ page }) => {
  await onboard(page);
  await page.getByRole("button", { name: "Skip" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test("the whole journey is keyboard reachable", async ({ page }) => {
  await page.goto("/onboarding");

  // Tab to the first choice and activate it with the keyboard alone.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: /due date/i })).toBeVisible();
});

test("the catch-up list has no violations", async ({ page }) => {
  await onboard(page);
  await page.getByRole("button", { name: /^Show the \d+ things?$/ }).click();
  await expect(page.locator("#catchup-list")).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test("every route has exactly one skip-link target", async ({ page }) => {
  await onboard(page);
  for (const path of [
    "/",
    "/onboarding",
    "/week",
    "/week/pregnancy-w28",
    "/shelf",
    "/library",
    "/safety",
    "/settings",
  ]) {
    await page.goto(path);
    await expect(page.locator("#main")).toHaveCount(1);
    const href = await page.getByRole("link", { name: "Skip to content" }).getAttribute("href");
    expect(href).toBe("#main");
  }
});
