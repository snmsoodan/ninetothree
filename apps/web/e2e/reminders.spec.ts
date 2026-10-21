import { expect, test, type Page } from "@playwright/test";

/**
 * Reminders are the two things that are about a date rather than a week: an
 * appointment tomorrow, and a pin the parent asked to be reminded about.
 *
 * The card is information, not a notification — it is not gated by quiet hours
 * or by the push toggle. What the gate decides is whether it would also be
 * pushed, and that is unit-tested in `lib/reminders.test.ts`.
 */

const STORAGE_KEY = "ninetothree.v1";

function iso(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

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

/** Writes straight to storage, then reloads so the store re-hydrates. */
async function seed(page: Page, patch: Record<string, unknown>) {
  await page.evaluate(
    ({ key, patch }) => {
      const raw = window.localStorage.getItem(key);
      const state = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(key, JSON.stringify({ ...state, ...patch }));
    },
    { key: STORAGE_KEY, patch },
  );
  await page.reload();
}

test("an appointment tomorrow is raised the day before", async ({ page }) => {
  await onboard(page);
  await seed(page, {
    appointments: [{ id: "own-1", label: "Growth scan", date: iso(1), who: "Dr Okafor", at: "" }],
  });

  const card = page.getByRole("region", { name: "Coming up" });
  await expect(card).toBeVisible();
  await expect(card.getByText("Tomorrow", { exact: true })).toBeVisible();
  await expect(card.getByText("Growth scan")).toBeVisible();
  await expect(card.getByText("Tomorrow, with Dr Okafor.")).toBeVisible();
});

test("an appointment further out is not raised yet", async ({ page }) => {
  await onboard(page);
  await seed(page, {
    appointments: [{ id: "own-1", label: "Growth scan", date: iso(5), at: "" }],
  });

  // The generated schedule may have a visit of its own tomorrow; what must not
  // appear is the one five days out.
  await expect(page.getByText("Growth scan")).toHaveCount(0);
});

test("putting a reminder away keeps it away for the day", async ({ page }) => {
  await onboard(page);
  await seed(page, {
    appointments: [{ id: "own-1", label: "Growth scan", date: iso(1), at: "" }],
  });

  const card = page.getByRole("region", { name: "Coming up" });
  await card.getByRole("button", { name: "Got it — tomorrow" }).click();
  await expect(page.getByRole("region", { name: "Coming up" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("region", { name: "Coming up" })).toHaveCount(0);
});

test("a pin reminder is raised on the day it was set for", async ({ page }) => {
  await onboard(page);
  await seed(page, {
    pins: [
      {
        id: "t-glucose",
        title: "Book your glucose screening",
        packId: "pregnancy-w28",
        packTitle: "Week 28",
        at: "",
        remindOn: iso(0),
      },
    ],
  });

  const card = page.getByRole("region", { name: "Coming up" });
  await expect(card.getByText("Today", { exact: true })).toBeVisible();
  await expect(card.getByText("You asked to be reminded today.")).toBeVisible();
});

test("a reminder can be set from a pin and shows on the dashboard", async ({ page }) => {
  await onboard(page);
  await seed(page, {
    pins: [
      {
        id: "t-glucose",
        title: "Book your glucose screening",
        packId: "pregnancy-w28",
        packTitle: "Week 28",
        at: "",
      },
    ],
  });

  await page.getByRole("button", { name: "Remind me" }).click();
  await page.getByLabel("Remind me on").fill(iso(0));

  const card = page.getByRole("region", { name: "Coming up" });
  await expect(card.getByText("Today", { exact: true })).toBeVisible();
  await expect(page.getByText(/Reminder /)).toBeVisible();
});

test("the reminder card is reachable by keyboard", async ({ page }) => {
  await onboard(page);
  await seed(page, {
    appointments: [{ id: "own-1", label: "Growth scan", date: iso(1), at: "" }],
  });

  const dismiss = page.getByRole("button", { name: "Got it — tomorrow" });
  await dismiss.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("region", { name: "Coming up" })).toHaveCount(0);
});
