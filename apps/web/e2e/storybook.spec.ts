import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Storybook is the design system's only visual contract. A story that throws,
 * renders unstyled, or fails axe is a component that will do the same in the
 * product — and this suite catches it before a parent does.
 *
 * Runs against the static build, so it needs `pnpm build:storybook` first.
 */
const STORYBOOK = "http://127.0.0.1:6006";

const STORIES = [
  "primitives-button--primary",
  "primitives-button--all-variants",
  "primitives-buttonlink--primary",
  "primitives-badge--all-tones",
  "primitives-card--raised",
  "primitives-progress--default",
  "primitives-textlink--external",
  "primitives-checkbox--with-hint",
  "primitives-radiogroup--with-hints",
  "primitives-tabs--default",
  "primitives-dialog--default",
  "primitives-toast--default",
  "app-actionitem--essential",
  "app-actionitem--with-options",
  "app-redflaglist--default",
  "app-sourcelist--default",
  "app-catchup--closed",
  "app-appshell--default",
  "app-weekview--default",
  "app-onboardingflow--default",
  "app-linkcard--official",
  "app-linkcard--app",
  "app-linkcard--paid",
  "app-linkcard--local-help",
  "app-weeksummarycard--open",
  "app-weeksummarycard--finished",
  "app-pinlist--with-pins",
  "app-pinlist--empty",
  "app-pinlist--stale",
  "app-profilepreview--nothing-hidden",
  "app-profilepreview--no-car",
  "app-profilepreview--tight-budget",
  "app-profilepreview--both",
  "app-schedulelist--upcoming",
  "app-schedulelist--single-day",
  "app-schedulelist--own",
  "app-schedulelist--empty",
  "app-historylist--with-weeks",
  "app-historylist--retired",
  "app-historylist--empty",
  "app-exportbuttons--default",
  "app-appointmentlist--scheduled",
  "app-sharecard--default",
  "app-progressline--some-progress",
];

/**
 * The a11y addon is set to manual, but it still starts one run when a story
 * mounts. Playwright's axe can arrive mid-run and axe refuses to run twice
 * ("Axe is already running"). One retry after the addon's run settles is
 * enough, and it is a real race rather than a flaky assertion.
 */
async function auditStory(page: Page) {
  const builder = () =>
    new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  try {
    return await builder().analyze();
  } catch (error) {
    if (!String(error).includes("Axe is already running")) throw error;
    await page.waitForTimeout(500);
    return await builder().analyze();
  }
}

for (const id of STORIES) {
  test(`story ${id} renders, is styled, and has no axe violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });

    await page.goto(`${STORYBOOK}/iframe.html?id=${id}&viewMode=story`);
    await page.waitForSelector("#storybook-root > *", { timeout: 15_000 });

    expect(errors, `console errors in ${id}`).toEqual([]);

    // The design system is applied, not just present. This is the check that
    // would have caught Tailwind failing to scan packages/ui: the tokens
    // resolve, and the paper background is actually painted.
    const tokens = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        ink: root.getPropertyValue("--color-ink").trim(),
        paper: getComputedStyle(document.body).backgroundColor,
      };
    });
    expect(tokens.ink, "design tokens are not loaded").not.toBe("");
    expect(tokens.paper, "the paper background is not painted").not.toBe("rgba(0, 0, 0, 0)");

    const results = await auditStory(page);
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
