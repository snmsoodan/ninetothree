import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { gotoWeek } from "./helpers";

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
  await expect(page).toHaveURL(/\/today$/);
}

/** Onboarding lands on the dashboard; the week is one tap further in. */
async function onboardToWeek(page: Page) {
  await onboard(page);
  await gotoWeek(page);
}

/**
 * The reading controls are stored, not applied by a click, so the honest way to
 * test them is to seed the store and let the bootstrap script do the work on
 * the next load. That is the path a parent's second visit actually takes.
 */
async function seedReading(page: Page, reading: Record<string, string>) {
  await page.evaluate((patch) => {
    const key = "ninetothree.v1";
    const raw = window.localStorage.getItem(key);
    const state = raw ? JSON.parse(raw) : {};
    state.reading = patch;
    window.localStorage.setItem(key, JSON.stringify(state));
  }, reading);
  await page.reload();
}

/** WCAG 1.4.10 Reflow: nothing may scroll sideways at 320 CSS pixels. */
async function overflowsSideways(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
}

test("the document declares its language and direction", async ({ page }) => {
  /* Screen readers pick a voice from `<html lang>`, and a wrong or missing one
     is the difference between a page being read aloud and being read out
     letter by letter. `dir` is the same declaration for layout. Both come from
     the locale table now, so this is the test that says the table is wired to
     the document and not just to the formatters. */
  await page.goto("/onboarding");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "en-US");
  await expect(html).toHaveAttribute("dir", "ltr");

  const manifest = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    return link ? ((await (await fetch(link.href)).json()) as { lang?: string }) : null;
  });
  expect(manifest?.lang).toBe("en-US");
});

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

test("the email preview has no violations", async ({ page }) => {
  await onboard(page);
  await page.evaluate(() => {
    const key = "ninetothree.v1";
    const raw = window.localStorage.getItem(key);
    const state = raw ? JSON.parse(raw) : {};
    window.localStorage.setItem(
      key,
      JSON.stringify({
        ...state,
        notifications: {
          email: true,
          push: false,
          frequency: "weekly",
          paused: false,
          quietFrom: 21,
          quietTo: 8,
        },
      }),
    );
  });
  await page.goto("/email");
  await expect(page.getByRole("heading", { name: "The weekly email" })).toBeVisible();
  expect(await audit(page)).toEqual([]);
});

test("the email preview has no violations when nothing would be sent", async ({ page }) => {
  await onboard(page);
  await page.goto("/email");
  await expect(
    page.getByRole("heading", { name: "Nothing would be sent this week" }),
  ).toBeVisible();
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

test("a triage outcome for a child has no violations", async ({ page }) => {
  await page.goto("/triage?p=child,swallowed,medicine");
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
    "/triage?p=child,swallowed,medicine",
    "/safety",
    "/settings",
    "/email",
    "/print/week/pregnancy-w28",
    "/print/checklist/hospital-bag",
  ]) {
    await page.goto(path);
    await expect(page.locator("#main")).toHaveCount(1);
    const href = await page.getByRole("link", { name: "Skip to content" }).getAttribute("href");
    expect(href).toBe("#main");
  }
});

test("the week has no violations with more contrast", async ({ page }) => {
  await onboardToWeek(page);
  await seedReading(page, { contrast: "more" });
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "more");
  expect(await audit(page)).toEqual([]);
});

test("settings has no violations with more contrast", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");
  await seedReading(page, { contrast: "more" });
  expect(await audit(page)).toEqual([]);
});

test("the week has no violations with less motion", async ({ page }) => {
  await onboardToWeek(page);
  await seedReading(page, { motion: "reduced" });
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
  expect(await audit(page)).toEqual([]);
});

test("the week has no violations in the easier-to-read letters", async ({ page }) => {
  await onboardToWeek(page);
  await seedReading(page, { letters: "hyperlegible" });
  await expect(page.locator("html")).toHaveAttribute("data-font", "hyperlegible");
  expect(await audit(page)).toEqual([]);
});

test("a parent can change how the page reads with the keyboard alone", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");

  const more = page.getByRole("radio", { name: "More contrast" });
  await more.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "more");

  const reduced = page.getByRole("radio", { name: "Less motion" });
  await reduced.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");

  // The choice is a preference, so it has to outlive the tab.
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "more");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
});

test("nothing scrolls sideways at 320 pixels", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await onboard(page);
  for (const path of ["/", "/week", "/shelf", "/library", "/settings", "/safety", "/triage"]) {
    await page.goto(path);
    expect(await overflowsSideways(page), `${path} scrolls sideways at 320px`).toBe(false);
  }
});

test("nothing is clipped when the text is twice the size", async ({ page }) => {
  // WCAG 1.4.4 is tested at a normal viewport with the text doubled, not at
  // 320px — that is 1.4.10, and it is the test above.
  await page.setViewportSize({ width: 1280, height: 800 });
  await onboard(page);
  for (const path of ["/", "/week", "/settings", "/safety"]) {
    await page.goto(path);
    // 200% text is the WCAG 1.4.4 equivalent of browser zoom for a rem layout.
    await page.addStyleTag({ content: "html { font-size: 32px !important; }" });
    expect(await overflowsSideways(page), `${path} clips at 200% text`).toBe(false);
  }
});
