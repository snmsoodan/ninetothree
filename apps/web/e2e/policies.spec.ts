import { expect, test } from "@playwright/test";

import { onboard } from "./helpers";

/**
 * The policies are the pages a parent reads when they are worried, annoyed, or
 * looking for the way out. They are also the pages that are easiest to break
 * without noticing, because nothing in the week view links to them.
 *
 * The four paths are written out rather than imported from the content package
 * on purpose: if a policy is dropped from `POLICIES`, the footer test below
 * fails, and if a page stops existing this list still fails.
 */
const POLICY_PATHS = ["/privacy", "/terms", "/editorial", "/corrections"];

test.describe("the policies", () => {
  for (const path of POLICY_PATHS) {
    test(`${path} is a real page with a heading and a body`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);

      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("article p").first()).toBeVisible();

      // The draft notice is the honest bit: these have not been reviewed by a
      // lawyer, and the page says so rather than implying otherwise.
      await expect(page.getByText("This page is a draft.")).toBeVisible();

      // Every policy page can be left without the back button.
      await expect(page.getByRole("navigation", { name: "Policies" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Skip to content" })).toBeVisible();
    });
  }

  test("the footer appears on the pages a parent actually reads", async ({ page }) => {
    await onboard(page);

    // A `<footer>` inside `<main>` is not exposed as `contentinfo`, so this
    // also asserts the footer sits outside the main landmark.
    await expect(page.getByRole("contentinfo")).toBeVisible();

    const footer = page.getByRole("navigation", { name: "Policies" });
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("link")).toHaveCount(POLICY_PATHS.length);
    await expect(page.getByText(/is a guide, not a doctor/)).toBeVisible();

    // It sits above the fixed tab bar, not under it: a link nobody can tap is
    // worse than no link. The bottom padding on the wrapper is what reserves
    // the room, so this is the test that padding is still there.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footerBox = await footer.boundingBox();
    const tabBar = await page.getByRole("navigation", { name: "Main" }).boundingBox();
    expect(footerBox).not.toBeNull();
    expect(tabBar).not.toBeNull();
    if (footerBox && tabBar) {
      expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(tabBar.y);
    }
  });

  test("a policy is one tap from the week", async ({ page }) => {
    await page.goto("/week/pregnancy-w28");
    await page
      .getByRole("navigation", { name: "Policies" })
      .getByRole("link", { name: "Privacy" })
      .click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
  });

  test("the safety page does not offer a link to itself", async ({ page }) => {
    /* The footer's one sentence is "if something is wrong right now, that page
       is free" — pointing at the page you are already on is noise on the one
       screen that has to stay quiet. */
    await page.goto("/safety");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Policies" })).toHaveCount(0);
  });

  test("the corrections log opens empty and says so", async ({ page }) => {
    await page.goto("/corrections");
    await expect(page.getByRole("heading", { name: "The log" })).toBeVisible();
    await expect(page.getByText("Nothing yet.")).toBeVisible();

    // The promises are on the page, not only in the data.
    for (const kind of [
      "Something that could hurt someone",
      "A clinical fact",
      "A link that moved or broke",
      "A typo, a tone that landed wrong",
    ]) {
      await expect(page.getByText(kind, { exact: false })).toBeVisible();
    }
    await expect(page.getByText(/the same day/).first()).toBeVisible();
  });

  test("nothing scrolls sideways at 320 pixels", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of POLICY_PATHS) {
      await page.goto(path);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows, `${path} scrolls sideways at 320px`).toBe(false);
    }
  });

  test("the health check answers with the database it depends on", async ({ request }) => {
    /* The runbook pages on this endpoint, so it has to exist and has to mean
       something. A 200 that only proves the process is listening would stay
       green through the outage that matters. */
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers()["cache-control"]).toBe("no-store");
  });
});
