import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E & Mobile Device Config (Phase 19 · Prompt 19.3).
 * Boots the Next.js dev server automatically and runs spec files in tests/*.spec.ts.
 *
 *   npx playwright test
 *   npm run test:e2e
 */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  // Cold Next.js dev compiles (server action + command-center + map chunk)
  // can take 60s+ on the first run — allow plenty of headroom.
  timeout: 180_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome (Pixel 5)",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari (iPhone 12)",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // first Next.js compile can be slow
  },
});
