import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

function address() {
  return `maya+${randomUUID()}@example.com`;
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

async function signIn(page: Page, email: string) {
  await onboard(page);
  const csrf = ((await (await page.request.get("/api/auth/csrf")).json()) as { csrfToken: string })
    .csrfToken;
  await page.request.post("/api/auth/signin/email", {
    form: { email, csrfToken: csrf },
    maxRedirects: 0,
  });
  const { url } = (await (
    await page.request.get(`/api/auth/dev/link?email=${encodeURIComponent(email)}`)
  ).json()) as { url: string };
  await page.goto(url);
  await page.waitForURL((u) => u.pathname === "/");
}

test.describe("export and delete", () => {
  test("the export is a file with the account in it", async ({ page }) => {
    await signIn(page, address());

    const response = await page.request.get("/api/account/export?format=json");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-disposition"]).toContain("attachment");
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.user).toBeTruthy();
    expect(body.household).toBeTruthy();
    expect(body.members).toHaveLength(1);
  });

  test("the spreadsheet is a spreadsheet", async ({ page }) => {
    await signIn(page, address());

    // A brand-new account has nothing to list, so the file is a header and no rows.
    const empty = await page.request.get("/api/account/export?format=csv");
    expect(empty.status()).toBe(200);
    expect(empty.headers()["content-type"]).toContain("text/csv");
    expect(await empty.text()).toBe("section,id,title,stage,state,date,detail\r\n");

    // Share a pin, which is a real row on the server, and it turns up in the file.
    const shared = await page.request.post("/api/household/pins", {
      data: { itemId: "w28-glucose", title: "Book the glucose test", packId: "pregnancy-w28" },
    });
    expect(shared.status()).toBe(200);

    const body = await (await page.request.get("/api/account/export?format=csv")).text();
    expect(body.split("\r\n")[0]).toBe("section,id,title,stage,state,date,detail");
    expect(body).toContain("Shared,w28-glucose,Book the glucose test,");
  });

  test("deleting shows the date, and keeping clears it", async ({ page }) => {
    await signIn(page, address());
    await page.goto("/settings");

    const section = page.getByRole("region", { name: "Your data" });
    await section.getByRole("button", { name: "Delete my account" }).click();
    await page.getByRole("button", { name: "Delete it" }).click();

    await expect(section.getByText(/set to be deleted on/)).toBeVisible();

    await section.getByRole("button", { name: "Keep my account" }).click();
    await expect(section.getByText(/set to be deleted on/)).toHaveCount(0);
    await expect(section.getByRole("button", { name: "Delete my account" })).toBeVisible();
  });

  test("the endpoints refuse a signed-out caller", async ({ page }) => {
    await page.goto("/");

    expect((await page.request.get("/api/account/export")).status()).toBe(401);
    expect((await page.request.get("/api/account/delete")).status()).toBe(401);
    expect((await page.request.post("/api/account/delete")).status()).toBe(401);
    expect((await page.request.delete("/api/account/delete")).status()).toBe(401);
  });
});
