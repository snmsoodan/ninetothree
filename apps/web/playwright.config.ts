import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /storybook\.spec\.ts|nojs\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // The week has to be readable before any script runs. This project
      // turns JavaScript off entirely, so a page that only renders after
      // hydration fails here rather than in a parent's browser.
      name: "no-js",
      testMatch: /nojs\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], javaScriptEnabled: false },
    },
    {
      name: "storybook",
      testMatch: /storybook\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:6006" },
    },
  ],
  webServer: [
    {
      command: "pnpm build && pnpm start --port 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        // A fixed secret so a session cookie survives a restart mid-run. It is
        // a test value and is not a secret anywhere else.
        AUTH_SECRET: "e2e-not-a-secret-0000000000000000",
        // Opens /api/auth/dev/link, which is how the suite gets a real magic
        // link without an inbox. Unset everywhere else.
        AUTH_TEST_MODE: "1",
        // The webhook secret the billing spec signs its deliveries with. There
        // is no Stripe account behind it; the point is that the route verifies
        // a real HMAC rather than trusting whatever arrives.
        STRIPE_WEBHOOK_SECRET: "whsec_e2e_secret",
      },
    },
    {
      command: "pnpm build-storybook && npx http-server storybook-static -p 6006 -s",
      url: "http://127.0.0.1:6006",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
