import { expect, test } from "@playwright/test";

/**
 * The dead addresses. A mistyped URL and a `notFound()` from a bad week id both
 * land on the same page, and the point of it is that a parent who followed a
 * link we sent is not dropped on Next's bare 404 with no way back.
 */
const DEAD = ["/nope", "/week/not-a-week", "/read/no-such-article", "/print/week/w99"];

test.describe("a page that is not here", () => {
  for (const path of DEAD) {
    test(`${path} is a gentle page, not a bare 404`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => {
        errors.push(error.message);
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(404);

      await expect(
        page.getByRole("heading", { level: 1, name: "This page is not here" }),
      ).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);

      // The shell, so there is somewhere to go.
      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Go to this week" })).toHaveAttribute(
        "href",
        "/today",
      );

      // No page-level failure behind the 404.
      await page.waitForTimeout(200);
      expect(errors).toEqual([]);
    });
  }

  test("the way back actually goes somewhere", async ({ page }) => {
    await page.goto("/nope");
    await page.getByRole("link", { name: "Search the guide" }).click();
    await expect(page).toHaveURL(/\/search$/);
    await expect(page.getByRole("heading", { level: 1, name: "Search" })).toBeVisible();
  });
});
