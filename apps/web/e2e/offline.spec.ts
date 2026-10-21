import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * The promise this file tests is the one a parent makes to themselves at 3am:
 * "I can still open it." Not "it is fast", not "it is pretty" — that the two
 * screens that matter are on the device when the signal is not.
 *
 * The service worker is network-first for pages, so being online always means
 * being current. The cache is a fallback, and the page says so when it uses it.
 */

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

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

/**
 * Waits for the worker to be active *and* for the precache to actually hold
 * the two pages the test is about. Waiting on a timer instead would be a test
 * that passes on a fast machine and fails on CI.
 */
async function waitForPrecache(page: Page) {
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const registration = await navigator.serviceWorker.getRegistration();
          if (!registration?.active) return false;
          const names = await caches.keys();
          if (names.length === 0) return false;
          const cache = await caches.open(names[0]!);
          const paths = (await cache.keys()).map((request) => new URL(request.url).pathname);
          return ["/safety", "/triage", "/offline.html"].every((path) => paths.includes(path));
        }),
      { timeout: 30_000, intervals: [200, 500, 1000] },
    )
    .toBe(true);
}

test("the manifest is served, parses, and names the app", async ({ page, request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.status()).toBe(200);

  const manifest = await response.json();
  expect(manifest.name).toBe("Nine to Three");
  expect(manifest.start_url).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.background_color).toBe("#FBF9F6");

  /* A maskable icon is what stops an Android launcher cropping the mark. */
  const purposes = manifest.icons.map((icon: { purpose?: string }) => icon.purpose);
  expect(purposes).toContain("maskable");

  /* And the page actually points at it, or none of the above matters. */
  await page.goto("/onboarding");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    /manifest\.webmanifest/,
  );
});

test("the service worker registers and takes control", async ({ page }) => {
  await page.goto("/onboarding");
  await waitForPrecache(page);

  const controlled = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return { active: Boolean(registration?.active), scope: registration?.scope };
  });
  expect(controlled.active).toBe(true);
  expect(controlled.scope).toContain("127.0.0.1:3000");
});

test("with no signal, the safety page still opens and still has the numbers", async ({
  page,
  context,
}) => {
  await onboard(page);
  await page.goto("/safety");
  await waitForPrecache(page);

  await context.setOffline(true);
  await page.goto("/safety");

  /* The numbers are static, so they are the part that is always right. */
  await expect(page.getByRole("link", { name: "911" })).toBeVisible();
  await expect(page.getByRole("link", { name: "988" })).toBeVisible();

  /* And the page says it is a copy, rather than pretending to be current. */
  await expect(page.getByRole("status")).toContainText("You are offline.");
  await expect(page.getByRole("status")).toContainText("These numbers are always right.");

  await context.setOffline(false);
});

test("with no signal, the triage tree still walks to an answer", async ({ page, context }) => {
  await onboard(page);
  await page.goto("/triage");
  await waitForPrecache(page);

  await context.setOffline(true);
  await page.goto("/triage");

  /* The first question is the whole point: a parent who cannot load a page
     cannot be told to go and find one. */
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const firstChoice = page.getByRole("link").filter({ hasText: /./ }).first();
  await expect(firstChoice).toBeVisible();

  await context.setOffline(false);
});

test("with no signal, the week a parent is on still opens", async ({ page, context }) => {
  await onboard(page);
  await page.goto("/week");
  await waitForPrecache(page);

  await context.setOffline(true);
  await page.goto("/week");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("This is the copy saved on your device.");

  await context.setOffline(false);
});

test("a page that was never saved says so instead of showing the browser's error", async ({
  page,
  context,
}) => {
  await onboard(page);
  await page.goto("/safety");
  await waitForPrecache(page);

  await context.setOffline(true);
  await page.goto("/read/glucose-test");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("No signal");
  await expect(page.getByRole("link", { name: "If something is wrong" })).toBeVisible();
  await expect(page.getByRole("link", { name: "This week" })).toBeVisible();

  await context.setOffline(false);
});

test("the offline page has no violations", async ({ page }) => {
  await page.goto("/offline.html");
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target.join(" ")),
    })),
  ).toEqual([]);
});

test("the offline note has no violations on the safety page", async ({ page, context }) => {
  await onboard(page);
  await page.goto("/safety");
  await waitForPrecache(page);

  await context.setOffline(true);
  await page.goto("/safety");
  await expect(page.getByRole("status")).toBeVisible();

  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target.join(" ")),
    })),
  ).toEqual([]);

  await context.setOffline(false);
});

test("settings offers the home screen, and does not nag about it", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "On your phone" })).toBeVisible();

  /*
   * Headless Chrome never meets the engagement bar, so it never fires
   * `beforeinstallprompt` and the card correctly renders nothing. The card's
   * two states are covered by unit tests and by Storybook; what this asserts
   * is that a browser with no install path is not given instructions for a
   * different browser.
   */
  await expect(page.getByRole("button", { name: "Add to home screen" })).toHaveCount(0);
  await expect(page.getByText("Tap the Share button")).toHaveCount(0);
});
