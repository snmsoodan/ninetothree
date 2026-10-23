import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

/**
 * The print pages exist to leave the screen.
 *
 * So the assertions are about paper, not pixels: one sheet, black on white,
 * and every fact a parent needs when the phone is in the other room. The
 * "fits A4" requirement is checked by actually producing a PDF at A4 and at
 * US Letter and counting the pages, because a layout that fits one and spills
 * onto a second sheet is the failure this page is most likely to have.
 */

/*
 * Read the JSON off disk rather than importing `@ninetothree/content`: the
 * package imports its packs as JSON modules, and Playwright's ESM loader
 * refuses those without an import attribute. The files are the same ones the
 * build reads, so this is the shipped content, not a copy of it.
 */
function readJson<T>(relative: string): T {
  return JSON.parse(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8")) as T;
}

interface Pack {
  id: string;
  title: string;
  coreActions: { title: string }[];
  redFlags: { text: string }[];
  sources: { url: string }[];
}

interface Checklist {
  id: string;
  sections: { items: { label: string }[] }[];
}

const WEEK = readJson<Pack>("../../../packages/content/packs/pregnancy-w28.json");
const CHECKLIST = readJson<Checklist>("../../../packages/content/checklists/hospital-bag.json");

/** Count page objects in a PDF. `/Type /Page` also matches `/Type /Pages`. */
function pageCount(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

test("the week card prints on one A4 sheet", async ({ page }) => {
  await page.goto(`/print/week/${WEEK.id}`);
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  expect(pageCount(pdf)).toBe(1);
});

test("the week card prints on one US Letter sheet", async ({ page }) => {
  await page.goto(`/print/week/${WEEK.id}`);
  const pdf = await page.pdf({ format: "Letter", printBackground: true });
  expect(pageCount(pdf)).toBe(1);
});

/*
 * The checklist is 33 items with 22 notes, so it is allowed two sheets. What
 * it is not allowed is a third: two columns and a no-split rule on every item
 * keep it to a front and a back, which is what a packing list should be.
 */
test("the checklist prints on two A4 sheets at most", async ({ page }) => {
  await page.goto(`/print/checklist/${CHECKLIST.id}`);
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  expect(pageCount(pdf)).toBeLessThanOrEqual(2);
});

test("the checklist prints on two US Letter sheets at most", async ({ page }) => {
  await page.goto(`/print/checklist/${CHECKLIST.id}`);
  const pdf = await page.pdf({ format: "Letter", printBackground: true });
  expect(pageCount(pdf)).toBeLessThanOrEqual(2);
});

test("no checklist item is split across a page break", async ({ page }) => {
  await page.goto(`/print/checklist/${CHECKLIST.id}`);
  await page.emulateMedia({ media: "print" });
  const breaks = await page
    .locator(".print-columns li")
    .evaluateAll((items) => items.map((el) => getComputedStyle(el).breakInside));
  expect(breaks.every((value) => value === "avoid")).toBe(true);
});

test("the week card is black on white on paper", async ({ page }) => {
  await page.goto(`/print/week/${WEEK.id}`);
  await page.emulateMedia({ media: "print" });
  const ink = await page.locator("h1").evaluate((el) => getComputedStyle(el).color);
  const paper = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(ink).toBe("rgb(0, 0, 0)");
  expect(paper).toBe("rgb(255, 255, 255)");
});

test("the week card carries the three actions, the red flags and the sources", async ({ page }) => {
  await page.goto(`/print/week/${WEEK.id}`);
  for (const action of WEEK.coreActions) {
    await expect(page.getByText(action.title, { exact: false })).toBeVisible();
  }
  for (const flag of WEEK.redFlags) {
    await expect(page.getByText(flag.text, { exact: false })).toBeVisible();
  }
  for (const source of WEEK.sources) {
    await expect(page.getByText(source.url, { exact: false })).toBeVisible();
  }
});

test("the checklist carries every item", async ({ page }) => {
  await page.goto(`/print/checklist/${CHECKLIST.id}`);
  for (const section of CHECKLIST.sections) {
    for (const item of section.items) {
      await expect(page.getByText(item.label, { exact: false })).toBeVisible();
    }
  }
});

test("the toolbar is on screen and gone on paper", async ({ page }) => {
  await page.goto(`/print/week/${WEEK.id}`);
  const printButton = page.getByRole("button", { name: "Print this page" });
  await expect(printButton).toBeVisible();
  await page.emulateMedia({ media: "print" });
  await expect(printButton).toBeHidden();
});

test("a print page is not a dead end", async ({ page }) => {
  await page.goto(`/print/week/${WEEK.id}`);
  await page.getByRole("link", { name: `Back to ${WEEK.title}` }).click();
  await expect(page).toHaveURL(new RegExp(`/week/${WEEK.id}$`));
});

test("an unknown id is a 404, not an empty sheet", async ({ page }) => {
  const response = await page.goto("/print/week/not-a-week");
  expect(response?.status()).toBe(404);
});
