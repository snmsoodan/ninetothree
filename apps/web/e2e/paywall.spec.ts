import { expect, test } from "@playwright/test";

import { address, signIn, upgrade } from "./helpers";

/**
 * The paywall is a product boundary, not a security boundary: the content
 * ships in the client bundle, and anybody who reads the source can find it.
 * What these tests hold is the promise to a parent — the week you are in is
 * free, every red flag is free, safety is free, and the wall is a calm card
 * rather than a locked door.
 *
 * Onboarding "assume I am 28 weeks" puts the parent on `pregnancy-w28`, so that
 * is the free week and `pregnancy-w20` is behind the wall.
 */

/** An ISO date `days` from today, in UTC, the way the app compares dates. */
function isoInDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

test.describe("the paywall", () => {
  test("gives a free household the week it is in", async ({ page }) => {
    await signIn(page, address());
    await page.goto("/week/pregnancy-w28");

    await expect(
      page.getByRole("heading", { name: /The third trimester starts now/ }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^Pin / })).toHaveCount(3);
    await expect(page.getByText("This one is part of Plus.")).toHaveCount(0);
  });

  test("holds back a week that is not the parent's own, and keeps its red flags", async ({
    page,
  }) => {
    await signIn(page, address());
    await page.goto("/week/pregnancy-w20");

    await expect(page.getByText("This one is part of Plus.")).toBeVisible();
    await expect(page.getByText("Week 20 is not the week you are in.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Pin / })).toHaveCount(0);

    // The one thing a wall must never hide: what would be an emergency.
    await expect(page.getByRole("heading", { name: "Call now if" })).toBeVisible();
  });

  test("never gates safety or triage", async ({ page }) => {
    await signIn(page, address());

    await page.goto("/safety");
    await expect(page.getByRole("heading", { name: "If something is wrong" })).toBeVisible();

    await page.goto("/triage");
    await expect(page.getByRole("heading", { name: "Who is this about?" })).toBeVisible();
  });

  test("explains the free pin limit instead of pinning a sixth thing", async ({ page }) => {
    // Pinning by title, not by "the first Pin button": clicking .first() twice in
    // a row can hit the same button before its label flips, which unpins it.
    async function pin(title: string) {
      const button = page.getByRole("button", { name: `Pin ${title}` });
      await button.click();
      await expect(page.getByRole("button", { name: `Unpin ${title}` })).toBeVisible();
    }

    await signIn(page, address());

    // Three pins on the week the parent is in.
    await page.goto("/week/pregnancy-w28");
    await pin("Get your glucose screening if you haven't");
    await pin("Ask about the Tdap shot");
    await pin("Learn your baby's normal movement pattern");

    // Moving the due date two weeks out makes week 26 the week they are in,
    // and keeps the three pins. Two more brings the household to five.
    await page.goto("/settings");
    await page.locator("#settings-date").fill(isoInDays(98));
    await page.goto("/week/pregnancy-w26");
    await pin("Get the Tdap vaccine");
    await pin("Tell someone if you feel low most days");

    // The shelf is the one place that can count pins from more than one week.
    await page.goto("/shelf");
    await expect(page.getByRole("button", { name: /^Unpin / })).toHaveCount(5);

    // The sixth is refused with a sentence, not an error. The limit only exists
    // once the plan is known — nothing is gated while the plan is loading, so a
    // click that beats the fetch is allowed through, on purpose.
    const plan = page.waitForResponse((r) => r.url().includes("/api/billing"));
    await page.goto("/week/pregnancy-w26");
    await plan;
    await page.getByRole("button", { name: "Pin Set up a safe sleep space" }).click();
    await expect(page.getByText("Five pins is the free limit.")).toBeVisible();
    await page.getByRole("button", { name: "Not now" }).click();

    await page.goto("/shelf");
    await expect(page.getByRole("button", { name: /^Unpin / })).toHaveCount(5);
  });

  test("opens every week on Plus", async ({ page }) => {
    await signIn(page, address());
    await upgrade(page);

    for (const id of ["pregnancy-w20", "pregnancy-w33", "postpartum-week-3"]) {
      await page.goto(`/week/${id}`);
      await expect(page.getByText("This one is part of Plus.")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Pin / }).first()).toBeVisible();
    }
  });

  test("keeps the invite form behind Plus, and existing links working", async ({ page }) => {
    await signIn(page, address());
    await page.goto("/settings");

    const invites = page.getByRole("region", { name: "Invite someone" });
    await expect(invites.getByText("Inviting someone is part of Plus.")).toBeVisible();
    await expect(invites.getByRole("button", { name: "Make a link" })).toHaveCount(0);

    await upgrade(page);
    await page.goto("/settings");
    await expect(
      page.getByRole("region", { name: "Invite someone" }).getByRole("button", {
        name: "Make a link",
      }),
    ).toBeVisible();
  });

  test("prints the week the parent is in, and not the others", async ({ page }) => {
    await signIn(page, address());

    await page.goto("/print/week/pregnancy-w28");
    await expect(page.getByRole("heading", { name: /Week 28/ }).first()).toBeVisible();
    await expect(page.getByText("This one is part of Plus.")).toHaveCount(0);

    await page.goto("/print/week/pregnancy-w20");
    await expect(page.getByText("This one is part of Plus.")).toBeVisible();
    await expect(page.getByText(/The week you are in prints free/)).toBeVisible();
  });

  test("still prints the hospital-bag checklist for free", async ({ page }) => {
    await signIn(page, address());
    await page.goto("/print/checklist/hospital-bag");

    await expect(page.getByText("This one is part of Plus.")).toHaveCount(0);
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
