import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { gotoWeek, onboard } from "./helpers";

/**
 * The pictures that go on a release pull request.
 *
 * A reviewer should be able to see the product without running it, and a
 * future maintainer should be able to regenerate exactly these pictures
 * rather than hunting for whatever was pasted into an old PR. So they are
 * taken by a test, at a fixed phone size, from the shipped build.
 *
 * Skipped unless `EVIDENCE=1` (which `pnpm evidence` sets): a normal
 * `pnpm test:e2e` should not write files into the repository.
 */
const DIR = resolve(process.cwd(), process.env.EVIDENCE_DIR ?? "../../evidence/screenshots");
const PHONE = { width: 390, height: 844 };

test.skip(!process.env.EVIDENCE, "set EVIDENCE=1 to write the evidence screenshots");

test.use({ viewport: PHONE, deviceScaleFactor: 2 });

async function shot(page: Page, name: string) {
  await mkdir(DIR, { recursive: true });
  /* Let the settle transition finish: a blurred mid-fade screenshot is not
     evidence of anything. */
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(DIR, `${name}.png`), fullPage: false });
}

test("the walkthrough: onboarding to the third trimester", async ({ page }) => {
  await page.goto("/onboarding");
  await shot(page, "01-onboarding-welcome");

  await page.getByRole("button", { name: /^I am the parent/ }).click();
  await page.getByRole("button", { name: /^I am pregnant/ }).click();
  await shot(page, "02-onboarding-stage");

  await page.getByRole("button", { name: /assume I am 28 weeks/ }).click();
  for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "Continue" }).click();
  await shot(page, "03-onboarding-details");

  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page).toHaveURL(/\/today$/);
  await shot(page, "04-today");

  await gotoWeek(page);
  await shot(page, "05-week");

  await page.goto("/library");
  await shot(page, "06-library");

  await page.goto("/safety");
  await shot(page, "07-safety");

  await page.goto("/triage");
  await shot(page, "08-triage");

  await page.goto("/print/week/pregnancy-w28");
  await shot(page, "09-print-week");

  await page.goto("/offline.html");
  await shot(page, "10-offline");
});

test("a grandparent reading over the parent's shoulder", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /^I am a grandparent/ }).click();
  await shot(page, "12-onboarding-persona");

  await page.getByRole("button", { name: /^My grandchild is on the way/ }).click();
  await page.getByRole("button", { name: /assume I am 28 weeks/ }).click();
  // A grandparent is not asked about feeding or first babies: two steps, not four.
  for (let i = 0; i < 2; i += 1) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page).toHaveURL(/\/today$/);
  // The lens is the page for this reader, so the picture starts at it rather
  // than at whatever reminder card happens to be above it today.
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  await shot(page, "13-today-grandparent");

  await page.getByRole("link", { name: "Read this week in full" }).click();
  await expect(page).toHaveURL(/\/week\/[a-z0-9-]+$/);
  await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  await shot(page, "14-week-grandparent");

  await page.goto("/settings");
  // "Reading as" is the second section, below the dates on a phone.
  await page.getByRole("heading", { name: "Reading as" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Reading as" })).toBeInViewport();
  await shot(page, "15-settings-reading-as");
});

test("the narrowest phone we support, with nothing sideways", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await onboard(page);
  await shot(page, "11-today-320");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
