import { expect, test } from "@playwright/test";

/**
 * The week has to be readable before any script runs.
 *
 * A parent on a train with one bar of signal, or with a script blocker on,
 * should still get the week. Everything here is asserted against the HTML the
 * server sends, with JavaScript switched off in the browser context.
 */
test.describe("with JavaScript disabled", () => {
  test("the week renders in full", async ({ page }) => {
    await page.goto("/week/pregnancy-w28");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The baby", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "You", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "The 3 things", exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Also worth knowing", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Appointments", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Call now if", exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Where this comes from", exact: true }),
    ).toBeVisible();
  });

  test("all three steps are there, with their reasons", async ({ page }) => {
    await page.goto("/week/pregnancy-w28");
    await expect(
      page.getByRole("heading", { name: "Get your glucose screening if you haven't" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ask about the Tdap shot" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Learn your baby's normal movement pattern" }),
    ).toBeVisible();
  });

  test("the red flags are not behind a script", async ({ page }) => {
    await page.goto("/week/pregnancy-w28");
    const redFlags = page.getByRole("region", { name: "Call now if" });
    await expect(redFlags.getByRole("listitem").first()).toBeVisible();
  });

  test("the library and the safety page render too", async ({ page }) => {
    await page.goto("/library");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/safety");
    await expect(page.getByRole("link", { name: "911" })).toBeVisible();
  });
});

test.describe("the triage tree with JavaScript disabled", () => {
  test("asks the first question, and every answer is a link", async ({ page }) => {
    await page.goto("/triage");

    await expect(page.getByRole("heading", { level: 1, name: "Who is this about?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Me, and I am pregnant" })).toBeVisible();
    await expect(page.getByRole("link", { name: "The baby" })).toBeVisible();
  });

  test("walks to an outcome and names the number", async ({ page }) => {
    await page.goto("/triage?p=me-pregnant,bleeding,spotting");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Call back if" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Where this comes from" })).toBeVisible();
  });
});
