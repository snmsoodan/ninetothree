import { expect, test, type Page } from "@playwright/test";

import { address, gotoWeek, signIn, upgrade } from "./helpers";

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
  // date, country, feeding, first baby
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await expect(page.getByText("That is everything we need.")).toBeVisible();
  await page.getByRole("button", { name: "Show me" }).click();
}

/** Onboarding lands on the dashboard; the week is one tap further in. */
async function onboardToWeek(page: Page) {
  await onboardAsPregnant(page);
  await gotoWeek(page);
}

test("onboarding takes under ninety seconds, and every answer is recorded", async ({ page }) => {
  const started = Date.now();
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByRole("button", { name: /I am pregnant/ }).click();
  await page.getByRole("button", { name: /assume I am 28 weeks/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // The country is guessed from the device, and the guess is shown as a guess.
  await expect(page.getByText(/We guessed/)).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("radio", { name: "Formula" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: "Yes, my first" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("That is everything we need.")).toBeVisible();
  await page.getByRole("button", { name: "Show me" }).click();
  await expect(page).toHaveURL(/\/today$/);

  const elapsed = Date.now() - started;
  expect(elapsed, `onboarding took ${elapsed}ms`).toBeLessThan(90_000);

  const profile = await page.evaluate(() => {
    const raw = window.localStorage.getItem("ninetothree.v1");
    return raw ? JSON.parse(raw).profile : null;
  });
  expect(profile).toMatchObject({ feeding: "formula", firstBaby: true, country: "US" });
});

test("onboarding resumes where it was left, and forgets a stale draft", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /I am pregnant/ }).click();
  await page.getByRole("button", { name: /assume I am 28 weeks/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Where are you?")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Where are you?")).toBeVisible();
  await expect(page.getByText("Step 3 of 6")).toBeVisible();

  // A draft from three months ago is not a draft, it is a stale date.
  await page.evaluate(() => {
    const key = "ninetothree.onboarding.v1";
    const draft = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    draft.at = "2026-01-01T00:00:00.000Z";
    window.localStorage.setItem(key, JSON.stringify(draft));
  });
  await page.reload();
  await expect(page.getByText("Where are you right now?")).toBeVisible();
  await expect(page.getByText("Step 1 of 6")).toBeVisible();
});

test("a new parent can get from the front door to a finished step", async ({ page }) => {
  await onboardAsPregnant(page);

  // Onboarding lands on the dashboard, which is the product: one card, one tap.
  await expect(page).toHaveURL(/\/today$/);
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

test("the appointment schedule is dated from the due date, and can be added to", async ({
  page,
}) => {
  await onboardAsPregnant(page);

  await page.getByRole("link", { name: "See the whole schedule" }).click();
  await expect(page).toHaveURL(/\/appointments$/);
  await expect(page.getByRole("heading", { level: 1, name: "Appointments" })).toBeVisible();

  // The ACOG cadence, dated. The anatomy scan is the window a 28-week
  // pregnancy is in, so it is the one that is marked.
  await expect(page.getByRole("heading", { name: "Anatomy scan" })).toBeVisible();
  await expect(page.getByText("This is the window you are in")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Glucose screening" })).toBeVisible();

  // A parent's own appointment joins the same list.
  await page.getByRole("button", { name: "Add an appointment" }).click();
  await page.getByLabel("What is it").fill("Dentist");
  await page.getByLabel("When").fill("2026-11-02");
  await page.getByLabel("Anything to remember").fill("Tell them you are pregnant.");
  await page.getByRole("button", { name: "Add it" }).click();

  await expect(page.getByRole("heading", { name: "Dentist" })).toBeVisible();
  await expect(page.getByText("Tell them you are pregnant.")).toBeVisible();

  // Editing keeps the date and changes the label.
  await page.getByRole("button", { name: "Edit Dentist" }).click();
  await page.getByLabel("What is it").fill("Dentist, moved");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Dentist, moved" })).toBeVisible();

  // Deleting removes it and leaves the generated schedule alone.
  await page.getByRole("button", { name: "Delete Dentist, moved" }).click();
  await expect(page.getByRole("heading", { name: "Dentist, moved" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Anatomy scan" })).toBeVisible();

  // The calendar file is offered, and it is a calendar.
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Add to calendar" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("nine-to-three-appointments.ics");
});

test("the shelf reorders, filters, and holds more than the dashboard shows", async ({ page }) => {
  await onboardToWeek(page);

  // Pin all three core actions, in the order they appear.
  const pinButtons = page.getByRole("button", { name: /^Pin / });
  const count = await pinButtons.count();
  expect(count).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole("button", { name: /^Pin / }).first().click();
  }

  await page.getByRole("link", { name: "Shelf" }).click();
  await expect(page).toHaveURL(/\/shelf$/);

  const headings = page.getByRole("region", { name: "Pinned" }).getByRole("heading", { level: 3 });
  await expect(headings).toHaveCount(3);
  const first = await headings.nth(0).textContent();
  const second = await headings.nth(1).textContent();

  // The first pin cannot move up; the last cannot move down.
  await expect(page.getByRole("button", { name: `Move ${first} up` })).toBeDisabled();
  await page.getByRole("button", { name: `Move ${second} up` }).click();
  await expect(headings.nth(0)).toHaveText(second ?? "");
  await expect(headings.nth(1)).toHaveText(first ?? "");

  // Filtering hides reorder, because moving inside a filtered list would lie.
  await page.getByLabel("Find a pin").fill("zzz-nothing-matches");
  await expect(page.getByText(/Nothing matches/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Move / })).toHaveCount(0);
  await page.getByRole("button", { name: /Show all 3/ }).click();
  await expect(headings).toHaveCount(3);

  // Unpinning is by name, and the shelf empties honestly.
  await page.getByRole("button", { name: `Unpin ${second}` }).click();
  await expect(headings).toHaveCount(2);
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
  await expect(page).toHaveURL(/\/today$/);
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
  await expect(page.getByText("That’s this week.")).toBeVisible();
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

  await expect(page.getByText("Skipped").first()).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).first().click();
  await expect(page.getByRole("button", { name: "Skip" }).first()).toBeVisible();
});

test("a step can be set aside, and it comes back on its own", async ({ page }) => {
  await onboardToWeek(page);

  const first = page.getByRole("heading", { level: 3 }).first();
  const title = (await first.textContent()) ?? "";

  await page.getByRole("button", { name: "Later" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("radio", { name: /Tomorrow/ }).click();
  await page.getByRole("button", { name: "Set it aside" }).click();

  // It leaves the list, and the page says where it went rather than going quiet.
  await expect(page.getByRole("heading", { level: 3, name: title })).toHaveCount(0);
  await expect(page.getByText(/1 step set aside for now/)).toBeVisible();

  // And it can be brought back without waiting.
  await page.getByRole("button", { name: "Show it now" }).click();
  await expect(page.getByRole("heading", { level: 3, name: title })).toBeVisible();
  await expect(page.getByText(/set aside for now/)).toHaveCount(0);
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
  for (const id of ["pregnancy-w28", "pregnancy-w39", "postpartum-week-1", "infant-month-3"]) {
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
  await expect(page.getByRole("heading", { name: "Get the Tdap vaccine" })).toHaveCount(0);

  await toggle.click();
  await expect(page.getByRole("heading", { name: "Get the Tdap vaccine" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Know how often visits happen now" }),
  ).toBeVisible();

  // Nothing older than the window leaks in. The window is weeks 25 to 27.
  await expect(page.getByRole("heading", { name: "Book your anatomy scan" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Week 4\b/ })).toHaveCount(0);

  // Clearing one removes it from the list.
  await page.locator("#catchup-list").getByRole("button", { name: "Done" }).first().click();
  await expect(page.getByRole("heading", { name: "Get the Tdap vaccine" })).toHaveCount(0);
});

test("a keyboard user can skip the nav and never loses focus", async ({ page }) => {
  await onboardAsPregnant(page);

  // Land on the page fresh so focus starts at the top of the document. The
  // concrete URL, not `/week`, because the signpost redirects and the redirect
  // is a route change — it would move focus to the heading before the first Tab.
  await page.goto(await gotoWeek(page));

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
    ["This week", /\/today$/],
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

test("the library can be narrowed to what a parent can spend", async ({ page }) => {
  await onboardAsPregnant(page);
  await page.goto("/library");

  // The three price tiers are a filter, not a label: a parent who can spend
  // nothing gets only the free things.
  await page.getByLabel("What can you spend?").selectOption("free");
  await expect(page.getByText(/^\d+ places?\.$/)).toBeVisible();
  const costs = await page
    .locator("main li")
    .evaluateAll((els) => els.map((el) => el.textContent ?? ""));
  expect(costs.length).toBeGreaterThan(10);
  for (const text of costs) expect(text).toContain("Free");

  // Every card says when it was last opened, so a stale link is visible.
  await expect(page.getByText(/^Checked [A-Z][a-z]+ \d{1,2}, \d{4}$/).first()).toBeVisible();
});

test("a finished step is recorded, and the record can be taken away", async ({ page }) => {
  await onboardToWeek(page);

  // Finish one thing, and note what it was called.
  const firstAction = page.getByRole("button", { name: "Done" }).first();
  await firstAction.click();
  await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();

  // History is reached from Settings, not the nav: it is a record, not a place
  // a parent needs every day.
  await page.goto("/settings");
  await page.getByRole("link", { name: "See your history" }).click();
  await expect(page).toHaveURL(/\/history$/);
  await expect(page.getByRole("heading", { level: 1, name: "Your history" })).toBeVisible();

  // The step is there, under its week, with the day it happened.
  await expect(page.getByText("Get your glucose screening if you haven't")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Week 28" })).toBeVisible();
  await expect(page.getByText(/1 step across 1 week/)).toBeVisible();

  // The export is a real file, and it is named for the product.
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  expect((await csv).suggestedFilename()).toMatch(/^ninetothree-history-\d{4}-\d{2}-\d{2}\.csv$/);

  const json = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  expect((await json).suggestedFilename()).toMatch(/^ninetothree-history-\d{4}-\d{2}-\d{2}\.json$/);
});

test("changing a setting re-personalizes the week without a reload", async ({ page }) => {
  // Week 36 is not the week they are in, so this test needs Plus to see it.
  await signIn(page, address());
  await upgrade(page);

  // A marker on window survives client-side navigation and dies on a reload,
  // so it is the proof that the AC's "without a reload" is actually true.
  await page.goto("/week/pregnancy-w36");
  await page.evaluate(() => {
    (window as unknown as { __noReload?: boolean }).__noReload = true;
  });
  await expect(page.getByText("Install the car seat and get it checked")).toBeVisible();

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings$/);

  // The car seat step is hidden the moment the answer changes, and the
  // settings screen says which rule did it.
  await page.getByRole("radiogroup", { name: "A car" }).getByRole("radio", { name: "No" }).click();
  await expect(
    page.getByText("You told us you do not have a car, so car seat steps are hidden."),
  ).toBeVisible();

  // Back to the week the long way round, so every hop is client-side.
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "This week", exact: true })
    .click();
  await expect(page).toHaveURL(/\/today$/);
  await page.getByRole("link", { name: "Open this week" }).click();
  await expect(page).toHaveURL(/\/week\/pregnancy-w28$/);
  // Every week is written now, so 28 to 36 is eight hops, all client-side.
  // Each hop is awaited: a click resolves before the next page renders, so
  // clicking in a bare loop loses hops under load and lands short of week 36.
  for (let week = 29; week <= 36; week += 1) {
    await page.getByRole("link", { name: "Next →" }).click();
    await expect(page).toHaveURL(new RegExp(`/week/pregnancy-w${week}$`));
  }

  await expect(page.getByText("Install the car seat and get it checked")).toHaveCount(0);
  await expect(page.getByText("Get your group B strep test")).toBeVisible();

  expect(
    await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload),
  ).toBe(true);
});

test("a week finishes when its steps are settled, and says so once", async ({ page }) => {
  await onboardToWeek(page);

  // Skipping is settling. A parent who skips all three is not stuck at 0%.
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole("button", { name: "Skip" }).first().click();
    await page.getByRole("radio", { name: /Not this week/ }).click();
    await page.getByRole("button", { name: "Skip it" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }

  await expect(page.getByText("That’s this week.")).toBeVisible();
  await expect(page.getByText("Nothing else to do until Monday.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Look ahead" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to dashboard" })).toBeVisible();

  // Nothing to reopen: every step is resolved.
  await expect(page.getByRole("button", { name: "Reopen this week" })).toHaveCount(0);
});

test("a week can be closed with steps still open, and taken back", async ({ page }) => {
  await onboardToWeek(page);

  await page.getByRole("button", { name: "I’m done with this week" }).click();
  await expect(page.getByText("Mark this week done?")).toBeVisible();
  await page.getByRole("button", { name: "Mark it done" }).click();

  await expect(page.getByText("That’s this week.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Reopen this week" })).toBeVisible();

  await page.getByRole("button", { name: "Reopen this week" }).click();
  await expect(page.getByText("That’s this week.")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "I’m done with this week" })).toBeVisible();
});

test("a loss pauses the weekly guide, and nothing is deleted", async ({ page }) => {
  await onboardAsPregnant(page);
  await expect(page.getByRole("heading", { level: 1, name: "Week 28" })).toBeVisible();

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await page
    .getByRole("radiogroup", { name: "A loss" })
    .getByRole("radio", { name: "A baby died" })
    .click();

  // The dashboard stops showing a week.
  await page
    .getByRole("navigation", { name: "Main" })
    .getByRole("link", { name: "This week", exact: true })
    .click();
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByText("The weekly guide is paused.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open this week" })).toHaveCount(0);

  // So does the week page itself.
  await page.goto("/week/pregnancy-w28");
  await expect(page.getByText("The weekly guide is paused.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Done" })).toHaveCount(0);

  // The safety page is untouched, because a parent who has lost a baby
  // still needs the emergency numbers.
  await page.getByRole("link", { name: "Open the safety page" }).click();
  await expect(page).toHaveURL(/\/safety$/);
  await expect(page.getByRole("link", { name: "911" })).toBeVisible();

  // Turning it back on brings the week back.
  await page.goto("/settings");
  await page.getByRole("radiogroup", { name: "A loss" }).getByRole("radio", { name: "No" }).click();
  await page.goto("/week/pregnancy-w28");
  await expect(page.getByRole("button", { name: "Done" }).first()).toBeVisible();
});

test("the week can be worked through with the keyboard alone", async ({ page }) => {
  await onboardAsPregnant(page);
  await page.goto("/week/pregnancy-w28");

  // The skip link is the first stop, and it goes to the content.
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);

  // Tab until the first step's Done button, then press it.
  const done = page.getByRole("button", { name: "Done" }).first();
  for (let i = 0; i < 40; i += 1) {
    if (await done.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(done).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();
});

test("search finds a step by the word a parent would use, and cites it", async ({ page }) => {
  // The anatomy scan is week 20, which a free household cannot open.
  await signIn(page, address());
  await upgrade(page);
  await page.goto("/search");

  // "ultrasound" is not in the anatomy scan's title. The pack declares it.
  await page.getByLabel("What are you looking for?").fill("ultrasound");
  const result = page.getByRole("link", { name: "Go over your anatomy scan results" });
  await expect(result).toBeVisible();
  await expect(page.getByText("Week 20 · 3 sources")).toBeVisible();

  // The result lands on the step itself, not the top of the week.
  await result.click();
  await expect(page).toHaveURL(/\/week\/pregnancy-w20#w20-anatomy-title$/);
  await expect(
    page.getByRole("heading", { name: "Go over your anatomy scan results" }),
  ).toBeVisible();
});

test("search says nothing is here without saying 'no results'", async ({ page }) => {
  await onboardAsPregnant(page);
  await page.goto("/search");

  // A real question the guide does not answer. "stroller" used to be the
  // example, until the toddler packs started mentioning one.
  await page.getByLabel("What are you looking for?").fill("piano lessons");
  await expect(page.getByText("Nothing here for that.")).toBeVisible();
  await expect(page.getByText(/no results/i)).toHaveCount(0);
  await expect(page.getByText(/oops/i)).toHaveCount(0);

  await page.getByRole("link", { name: "Open the library" }).click();
  await expect(page).toHaveURL(/\/library$/);
});

test("a step leads to the long read that explains it, and the read leads back", async ({
  page,
}) => {
  await onboardAsPregnant(page);
  await page.goto("/week/pregnancy-w28");

  // The step carries the link, so the parent who asks "why" does not have to
  // go looking for the answer somewhere else.
  const readMore = page.getByRole("link", { name: "What the glucose test actually measures" });
  await expect(readMore).toBeVisible();
  await readMore.click();

  await expect(page).toHaveURL(/\/read\/glucose-test$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "What the glucose test actually measures" }),
  ).toBeVisible();

  // Every article ends with where it came from and who reviewed it.
  await expect(page.getByRole("region", { name: "Where this comes from" })).toBeVisible();
  await expect(
    page.getByText(/Reviewed by Clinical review pending on October 20, 2026/),
  ).toBeVisible();

  // And it leads back to the step.
  await page.getByRole("link", { name: "Get your glucose screening if you haven't" }).click();
  await expect(page).toHaveURL(/\/week\/pregnancy-w28#w28-glucose-title$/);
});

test("an article prints as one column with its sources written out", async ({ page }) => {
  await page.goto("/read/glucose-test");

  // The print rules are in the stylesheet, not in a script, so they apply to
  // the page a parent actually prints.
  const printRules = await page.evaluate(() => {
    const found: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule && rule.conditionText.includes("print")) {
          found.push(rule.cssText);
        }
      }
    }
    return found.join("\n");
  });
  expect(printRules).toContain("article-body");
  expect(printRules).toContain("attr(href)");
});

test("a step that is a purchase can be narrowed to one answer, and the answer sticks", async ({
  page,
}) => {
  // A parent past six months, so the high chair is the week they are on.
  const birthDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /My baby is here/ }).click();
  await page.locator("#date").fill(birthDate);
  // date, country, feeding, first baby
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("button", { name: "Show me" }).click();

  await gotoWeek(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // The step offers the chooser, because a list of three chairs is not advice.
  await page.getByRole("link", { name: "Help me choose" }).click();
  await expect(page).toHaveURL(/\/choose\/m6-highchair$/);
  await expect(page.getByText("Question 1 of 3")).toBeVisible();

  await page.getByRole("radio", { name: "A small kitchen" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("radio", { name: "Under $50" }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("radio", { name: "No, three years is enough" }).click();
  await page.getByRole("button", { name: "See the answer" }).click();

  // One answer, with the reason for it — not a ranked list.
  await expect(page.getByRole("heading", { level: 2, name: "IKEA Antilop" })).toBeVisible();
  await expect(page.getByText(/the legs come off, and it wipes clean/)).toBeVisible();

  await page.getByRole("button", { name: "Use this one" }).click();
  await page.getByRole("link", { name: "Back to the week" }).click();
  await expect(page.getByText("You chose")).toBeVisible();
  await expect(page.getByRole("link", { name: "Change it" })).toBeVisible();
});

test("the safety page leads to a triage answer, and the answer names a number", async ({
  page,
}) => {
  await page.goto("/safety");
  await page.getByRole("link", { name: "Help me work out who to call" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Who is this about?" })).toBeVisible();
  await page.getByRole("link", { name: "Me, and I am pregnant" }).click();
  await page.getByRole("link", { name: "Chest pain, trouble breathing, or I fainted" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Call 911 now." })).toBeVisible();
  await expect(page.getByRole("link", { name: "911" })).toHaveAttribute("href", "tel:911");
  await expect(page.getByRole("heading", { name: "Call back if" })).toBeVisible();
});

test("a quiet triage answer still says who to call, and never says you are fine", async ({
  page,
}) => {
  await page.goto("/triage?p=me-pregnant,bleeding,spotting");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Call your OB triage line", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Call back if" })).toBeVisible();

  const text = (await page.locator("main").textContent()) ?? "";
  expect(text).not.toMatch(/you(?:'re| are) (?:fine|okay)/i);
  expect(text).not.toMatch(/nothing to worry about/i);
});

// The tree had no answer for a child past their first birthday, so a parent of a
// two-year-old who had swallowed something had nowhere to go. This walks the
// branch that was missing, from the first question to the number.
test("a parent of a two-year-old can find the path for something swallowed", async ({ page }) => {
  await page.goto("/triage");

  await page.getByRole("link", { name: "A child, and they are past their first birthday" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "What is happening?" })).toBeVisible();

  await page.getByRole("link", { name: "They swallowed something" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "What did they swallow?" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "A button battery, or a magnet" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Go to the emergency department now." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "911" })).toHaveAttribute("href", "tel:911");
});

test("a swallowed medicine sends a parent to Poison Control, not to a search engine", async ({
  page,
}) => {
  await page.goto("/triage?p=child,swallowed,medicine");

  await expect(
    page.getByRole("heading", { level: 1, name: "Call Poison Control now: 1-800-222-1222." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /1-800-222-1222/ })).toHaveAttribute(
    "href",
    "tel:18002221222",
  );
});

test("a triage answer can be walked back one question at a time", async ({ page }) => {
  await page.goto("/triage?p=me-pregnant,bleeding,spotting");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "Bleeding, or fluid" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "How much bleeding?" })).toBeVisible();

  await page.getByRole("link", { name: "Me, and I am pregnant" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "What is happening?" })).toBeVisible();
});

test("help is one tap away from every screen, and it is a real link", async ({ page }) => {
  await onboardAsPregnant(page);

  for (const path of [
    "/",
    "/week",
    "/week/pregnancy-w28",
    "/shelf",
    "/appointments",
    "/history",
    "/library",
    "/search",
    "/read",
    "/read/postpartum-mood",
    "/choose/m6-highchair",
    "/triage",
    "/safety",
    "/settings",
    "/onboarding",
  ]) {
    await page.goto(path);
    const help = page.getByRole("link", { name: "Get help now" });
    await expect(help, path).toHaveCount(1);
    await expect(help, path).toHaveAttribute("href", "/safety");
  }
});

test("the drawer from the week card carries that week's warning signs", async ({ page }) => {
  await onboardToWeek(page);

  await page.getByRole("link", { name: "Get help now" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // The numbers, every time.
  await expect(dialog.getByRole("link", { name: "911" })).toHaveAttribute("href", "tel:911");
  await expect(dialog.getByRole("link", { name: "988" })).toHaveAttribute("href", "tel:988");

  // And this week's own flags, so the drawer is not a generic page.
  await expect(dialog.getByRole("heading", { name: "This week" })).toBeVisible();
  await expect(
    dialog.getByText("Movements that have clearly slowed down or stopped"),
  ).toBeVisible();

  // The way out is a link, not a dead end.
  await expect(dialog.getByRole("link", { name: "Every warning sign" })).toHaveAttribute(
    "href",
    "/safety",
  );
  await expect(dialog.getByRole("link", { name: "Help me work out who to call" })).toHaveAttribute(
    "href",
    "/triage",
  );
});

test("a two-year-old gets a toddler month, not the last baby month", async ({ page }) => {
  // The guide used to end at month 12, so a parent whose child turned one saw
  // the month-12 pack forever. This is the product-level guard for that gap.
  const birthDate = new Date(Date.now() - 800 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await page.goto("/onboarding");
  await page.getByRole("button", { name: /My baby is here/ }).click();
  await page.locator("#date").fill(birthDate);
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("button", { name: "Show me" }).click();

  await gotoWeek(page);
  await expect(page.getByRole("banner").getByText("Month 26", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: /thirty-month visit is next month/ }),
  ).toBeVisible();
  await expect(page.getByRole("article", { name: "Book the thirty-month visit" })).toBeVisible();
});

test("the root URL is a signpost, and it picks the right door", async ({ page }) => {
  // `/` used to be the dashboard, so a first visit had to download and hydrate
  // the whole dashboard before the redirect to onboarding could run. It is now
  // a signpost with almost no JavaScript, which is why this test cares that
  // both destinations are reached without the parent doing anything.
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding$/);

  await onboardAsPregnant(page);
  await expect(page).toHaveURL(/\/today$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/today$/);
});
