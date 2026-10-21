import { expect, test, type Page } from "@playwright/test";

/**
 * The settings screen is where a parent decides what reaches them.
 *
 * Nothing is sent in this version, so what is testable is that the choice is
 * recorded, survives a reload, and is read back by the one gate every future
 * job will call.
 */

const STORAGE_KEY = "ninetothree.v1";

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

async function stored(page: Page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw).notifications : null;
  }, STORAGE_KEY);
}

test("nothing is switched on until the parent switches it on", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");

  const section = page.getByRole("region", { name: "What we send you" });
  await expect(section.getByText(/Nothing is sent yet/)).toBeVisible();
  await expect(section.getByRole("checkbox", { name: "Email" })).not.toBeChecked();
  await expect(section.getByRole("checkbox", { name: "Push" })).not.toBeChecked();
});

test("a choice is recorded and survives a reload", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");

  const section = page.getByRole("region", { name: "What we send you" });
  await section.getByRole("checkbox", { name: "Email" }).click();
  await section.getByRole("radio", { name: /Once a month/ }).click();

  expect(await stored(page)).toMatchObject({ email: true, frequency: "monthly" });

  await page.reload();
  const after = page.getByRole("region", { name: "What we send you" });
  await expect(after.getByRole("checkbox", { name: "Email" })).toBeChecked();
  await expect(after.getByRole("radio", { name: /Once a month/ })).toBeChecked();
});

test("pause everything is one click and it sticks", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");

  const section = page.getByRole("region", { name: "What we send you" });
  await section.getByRole("checkbox", { name: "Email" }).click();
  await section.getByRole("checkbox", { name: "Pause everything" }).click();

  expect(await stored(page)).toMatchObject({ email: true, paused: true });

  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "What we send you" })
      .getByRole("checkbox", { name: "Pause everything" }),
  ).toBeChecked();
});

test("loss mode says the guide is paused, whatever the toggles say", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");

  const section = page.getByRole("region", { name: "What we send you" });
  await section.getByRole("checkbox", { name: "Email" }).click();
  await expect(section.getByText(/The guide is paused/)).toHaveCount(0);

  await page.getByRole("radio", { name: "A baby died" }).click();
  await expect(section.getByText(/The guide is paused, so nothing is sent/)).toBeVisible();
});

test("the toggles are reachable and operable from the keyboard", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings");

  const email = page
    .getByRole("region", { name: "What we send you" })
    .getByRole("checkbox", { name: "Email" });

  await email.focus();
  await page.keyboard.press("Space");
  await expect(email).toBeChecked();

  await page.keyboard.press("Space");
  await expect(email).not.toBeChecked();
});
