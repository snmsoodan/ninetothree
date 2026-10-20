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

/** Onboarding lands on the dashboard; the week is one tap further in. */
async function onboardToWeek(page: Page) {
  await onboardAsPregnant(page);
  await page.goto("/week");
}

test("a new parent can get from the front door to a finished step", async ({ page }) => {
  await onboardAsPregnant(page);

  // Onboarding lands on the dashboard, which is the product: one card, one tap.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Week 28" })).toBeVisible();
  await page.getByRole("link", { name: "Open this week" }).click();
  await expect(page).toHaveURL(/\/week\/pregnancy-w28$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Done" }).first().click();
  await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();

  await page.getByRole("button", { name: /^Pin / }).first().click();

  await page.getByRole("link", { name: "Shelf" }).click();
  await expect(page).toHaveURL(/\/shelf$/);
  await expect(page.getByRole("heading", { name: "Pinned" })).toBeVisible();
  await expect(page.getByText(/1 step done/)).toBeVisible();
});

test("the dashboard is one card, and a pin survives the round trip", async ({ page }) => {
  await onboardAsPregnant(page);

  // One primary card, one h1, and no feed of activity.
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Pinned" })).toBeVisible();
  await expect(page.getByText("Nothing pinned yet.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Appointments" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "So far" })).toBeVisible();

  // Pin something in the week, then come back.
  await page.getByRole("link", { name: "Open this week" }).click();
  const pin = page.getByRole("button", { name: /^Pin / }).first();
  const pinnedName = (await pin.getAttribute("aria-label"))?.replace(/^Pin /, "") ?? "";
  await pin.click();

  await page.getByRole("link", { name: "This week", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: pinnedName })).toBeVisible();
  await expect(page.getByText("Nothing pinned yet.")).not.toBeVisible();

  // Unpinning from the dashboard puts the empty state back.
  await page.getByRole("button", { name: `Unpin ${pinnedName}` }).click();
  await expect(page.getByText("Nothing pinned yet.")).toBeVisible();
});

test("a finished week stops asking and says when the next one arrives", async ({ page }) => {
  await onboardAsPregnant(page);
  await page.getByRole("link", { name: "Open this week" }).click();
  await expect(page).toHaveURL(/\/week\/pregnancy-w28$/);

  // Three core actions, so three clicks. Each one flips to "Undo", which is
  // how the loop knows the click landed before reaching for the next.
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole("button", { name: "Done" }).first().click();
    await expect(page.getByRole("button", { name: "Undo" })).toHaveCount(i + 1);
  }

  await page.getByRole("link", { name: "This week", exact: true }).click();
  await expect(page.getByText("You are done for this week.")).toBeVisible();
  await expect(page.getByText("Nothing else to do until Monday.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open this week" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Look ahead" })).toBeVisible();
});

test("skipping is allowed and reversible", async ({ page }) => {
  await onboardToWeek(page);

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
  await onboardToWeek(page);

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
  await onboardToWeek(page);
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
  await onboardToWeek(page);

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

test("a keyboard user can skip the nav and never loses focus", async ({ page }) => {
  await onboardAsPregnant(page);

  // Land on the page fresh so focus starts at the top of the document.
  await page.goto("/week");

  // The skip link is the first thing Tab reaches.
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();

  // Navigating by keyboard moves focus to the new page's heading, so a
  // screen reader announces where the parent landed.
  await page.getByRole("link", { name: "Shelf" }).click();
  await expect(page).toHaveURL(/\/shelf$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();

  // The settle must never dim the text: a fade would drop the page below
  // AA for its duration, which is a real cost to a low-vision parent.
  await expect(page.locator("#main")).toHaveCSS("opacity", "1");

  await page.getByRole("link", { name: "Safety" }).click();
  await expect(page).toHaveURL(/\/safety$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("every route is reachable with the keyboard alone", async ({ page }) => {
  await onboardAsPregnant(page);

  for (const [label, url] of [
    ["Shelf", /\/shelf$/],
    ["Library", /\/library$/],
    ["Safety", /\/safety$/],
    ["Settings", /\/settings$/],
    ["This week", /\/$/],
  ] as const) {
    // Scope to the nav: the library page has outbound links whose names
    // contain "Safety", and a bare role query would match those too.
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: label, exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(url);
  }
});

test("the library offers more than one place to go, and can be narrowed", async ({ page }) => {
  await onboardAsPregnant(page);
  await page.getByRole("link", { name: "Library" }).click();
  await expect(page).toHaveURL(/\/library$/);

  // Every card is a real outbound link, and none of them is a dead "#".
  const links = page.locator("main a[target=_blank]");
  expect(await links.count()).toBeGreaterThan(20);
  for (const href of await links.evaluateAll((els) =>
    els.map((el) => el.getAttribute("href") ?? ""),
  )) {
    expect(href).toMatch(/^https:\/\//);
  }

  // Narrowing to one need keeps only that need, and says how many are left.
  await page.getByLabel("What do you need?").selectOption("sleep");
  await expect(page.getByText(/^\d+ places?\.$/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Official guidance" })).toBeVisible();

  // A search that matches nothing says so, and does not pretend otherwise.
  await page.getByLabel("Search").fill("zzzzzz");
  await expect(page.getByText("Nothing matches that yet.")).toBeVisible();
  await expect(page.getByText(/Try a broader word/)).toBeVisible();
});
