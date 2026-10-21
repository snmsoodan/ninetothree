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
  // date, country, feeding, first baby
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Onboarding lands on the dashboard; the week is one tap further in. */
async function onboardToWeek(page: Page) {
  await onboard(page);
  await page.goto("/week");
}

test("onboarding has no violations", async ({ page }) => {
  await page.goto("/onboarding");
  expect(await audit(page)).toEqual([]);
});

test("the dashboard has no violations", async ({ page }) => {
  await onboard(page);
  expect(await audit(page)).toEqual([]);
});

test("the dashboard has no violations with a recall showing", async ({ page }) => {
  await onboard(page);
  await page.evaluate(() => {
    const key = "ninetothree.v1";
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
  });
  await page.reload();
  await expect(page.getByText("Bicystar high chairs")).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test("the dashboard has no violations with a reminder showing", async ({ page }) => {
  await onboard(page);
  await page.evaluate(() => {
    const key = "ninetothree.v1";
    const raw = window.localStorage.getItem(key);
    const state = raw ? JSON.parse(raw) : {};
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const month = `${tomorrow.getMonth() + 1}`.padStart(2, "0");
    const day = `${tomorrow.getDate()}`.padStart(2, "0");
    state.appointments = [
      {
        id: "own-1",
        label: "Growth scan",
        date: `${tomorrow.getFullYear()}-${month}-${day}`,
        who: "Dr Okafor",
        at: "",
      },
    ];
    state.pins = [
      {
        id: "t-glucose",
        title: "Book your glucose screening",
        packId: "pregnancy-w28",
        packTitle: "Week 28",
        at: "",
        remindOn: new Date().toISOString().slice(0, 10),
      },
    ];
    window.localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.getByRole("region", { name: "Coming up" })).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test("the appointments page has no violations", async ({ page }) => {
  await onboard(page);
  await page.goto("/appointments");
  expect(await audit(page)).toEqual([]);
});

test("the appointments form has no violations", async ({ page }) => {
  await onboard(page);
  await page.goto("/appointments");
  await page.getByRole("button", { name: "Add an appointment" }).click();
  expect(await audit(page)).toEqual([]);
});

test("the history page has no violations", async ({ page }) => {
  await onboard(page);
  await page.goto("/history");
  expect(await audit(page)).toEqual([]);
});

test("the week page has no violations", async ({ page }) => {
  await onboardToWeek(page);
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

test("search has no violations", async ({ page }) => {
  await onboard(page);
  await page.goto("/search");
  expect(await audit(page)).toEqual([]);
});

test("search has no violations with results showing", async ({ page }) => {
  await onboard(page);
  await page.goto("/search");
  await page.getByLabel("What are you looking for?").fill("glucose");
  expect(await audit(page)).toEqual([]);
});

test("the long reads index has no violations", async ({ page }) => {
  await page.goto("/read");
  expect(await audit(page)).toEqual([]);
});

test("an article has no violations", async ({ page }) => {
  await page.goto("/read/glucose-test");
  expect(await audit(page)).toEqual([]);
});

test("the chooser has no violations", async ({ page }) => {
  await page.goto("/choose/m6-highchair");
  expect(await audit(page)).toEqual([]);
});

test("the triage question has no violations", async ({ page }) => {
  await page.goto("/triage");
  expect(await audit(page)).toEqual([]);
});

test("a triage outcome has no violations", async ({ page }) => {
  await page.goto("/triage?p=me-pregnant,bleeding,spotting");
  expect(await audit(page)).toEqual([]);
});

test("the help drawer has no violations", async ({ page }) => {
  await onboardToWeek(page);
  await page.getByRole("link", { name: "Get help now" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test("the crisis footer has no violations", async ({ page }) => {
  await page.goto("/read/postpartum-mood");
  await expect(
    page.getByRole("heading", { name: "If you are thinking about hurting yourself" }),
  ).toBeVisible();
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
  await onboardToWeek(page);
  await page.getByRole("button", { name: "Skip" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test("the whole journey is keyboard reachable", async ({ page }) => {
  await page.goto("/onboarding");

  // Tab until the first choice has focus, then activate it with the keyboard
  // alone. Counting tabs would break every time the header gains a control.
  const first = page.getByRole("button", { name: /I am pregnant/ });
  for (let i = 0; i < 10; i += 1) {
    if (await first.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(first).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: /due date/i })).toBeVisible();
});

test("the catch-up list has no violations", async ({ page }) => {
  await onboardToWeek(page);
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
    "/appointments",
    "/history",
    "/library",
    "/search",
    "/read",
    "/read/glucose-test",
    "/read/postpartum-mood",
    "/choose/m6-highchair",
    "/triage",
    "/triage?p=me-pregnant,bleeding,spotting",
    "/safety",
    "/settings",
  ]) {
    await page.goto(path);
    await expect(page.locator("#main")).toHaveCount(1);
    const href = await page.getByRole("link", { name: "Skip to content" }).getAttribute("href");
    expect(href).toBe("#main");
  }
});
