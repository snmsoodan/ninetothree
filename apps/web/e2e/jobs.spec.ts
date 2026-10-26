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

async function signOut(page: Page) {
  const csrf = ((await (await page.request.get("/api/auth/csrf")).json()) as { csrfToken: string })
    .csrfToken;
  await page.request.post("/api/auth/signout", { form: { csrfToken: csrf }, maxRedirects: 0 });
}

async function makeLink(page: Page): Promise<string> {
  await page.goto("/settings");
  const section = page.getByRole("region", { name: "Invite someone" });
  await section.getByRole("button", { name: "Make a link" }).click();
  const link = await section.locator("p.font-mono").textContent();
  return new URL(link!.trim()).pathname;
}

/**
 * Two people in one household, signed in as the first of them.
 *
 * The assign button only appears once there is somebody to hand a job to, so
 * the second person has to join before the first one can assign anything.
 */
async function twoPeople(page: Page): Promise<{ first: string; second: string }> {
  const first = address();
  const second = address();

  await signIn(page, first);
  const path = await makeLink(page);

  await signOut(page);
  await signIn(page, second);
  await page.goto(path);
  await page.getByRole("button", { name: "Join" }).click();
  await expect(page).toHaveURL(/\/$/);

  await signOut(page);
  await signIn(page, first);
  return { first, second };
}

test.describe("assigned jobs", () => {
  test("a job handed over shows up for both people", async ({ page }) => {
    const { first, second } = await twoPeople(page);

    await page.goto("/together");
    await page
      .getByRole("button", { name: /^Ask .* to do this$/ })
      .first()
      .click();
    await expect(page.getByRole("heading", { name: "Who is doing what" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Done" }).first()).toBeVisible();

    await signOut(page);
    await signIn(page, second);
    await page.goto("/together");
    await expect(page.getByRole("button", { name: "Done" }).first()).toBeVisible();
  });

  test("marking it done updates both people", async ({ page }) => {
    const { first, second } = await twoPeople(page);

    await page.goto("/together");
    await page
      .getByRole("button", { name: /^Ask .* to do this$/ })
      .first()
      .click();
    await expect(page.getByRole("button", { name: "Done" }).first()).toBeVisible();

    await signOut(page);
    await signIn(page, second);
    await page.goto("/together");
    await page.getByRole("button", { name: "Done" }).first().click();
    await expect(page.getByText("Settled")).toBeVisible();

    // The person who handed it over sees the same thing, which is the whole
    // point of a shared status.
    await signOut(page);
    await signIn(page, first);
    await page.goto("/together");
    await expect(page.getByText("Settled")).toBeVisible();
    await expect(page.getByRole("button", { name: "Done" })).toHaveCount(0);
  });

  test("the person it is for sees it on their dashboard", async ({ page }) => {
    const { first, second } = await twoPeople(page);

    await page.goto("/together");
    await page
      .getByRole("button", { name: /^Ask .* to do this$/ })
      .first()
      .click();
    await expect(page.getByRole("button", { name: "Done" }).first()).toBeVisible();

    await signOut(page);
    await signIn(page, second);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "One thing for you" })).toBeVisible();
  });

  test("the payload carries the job to both people", async ({ page }) => {
    const { first, second } = await twoPeople(page);

    await page.goto("/together");
    await page
      .getByRole("button", { name: /^Ask .* to do this$/ })
      .first()
      .click();
    await expect(page.getByRole("button", { name: "Done" }).first()).toBeVisible();

    const asFirst = (await (
      await page.request.get("/api/household/together?stage=pregnancy-w28")
    ).json()) as { jobs: { status: string; assignedTo: string }[] };
    expect(asFirst.jobs).toHaveLength(1);
    expect(asFirst.jobs[0]!.status).toBe("open");

    await signOut(page);
    await signIn(page, second);
    const asSecond = (await (
      await page.request.get("/api/household/together?stage=pregnancy-w28")
    ).json()) as { jobs: { status: string; assignedTo: string }[] };
    expect(asSecond.jobs).toHaveLength(1);
    expect(asSecond.jobs[0]!.assignedTo).toBe(asFirst.jobs[0]!.assignedTo);
  });

  test("the endpoint refuses a signed-out caller", async ({ page }) => {
    await page.goto("/");
    const response = await page.request.post("/api/household/jobs", {
      data: { itemId: "a", title: "Book the glucose test", assignedTo: "nobody" },
    });
    expect(response.status()).toBe(401);
  });
});
