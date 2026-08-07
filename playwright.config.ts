import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config (Phase 23 · Step 4).
 * Boots the Next.js dev server automatically and runs tests in tests/.
 *
 *   npx playwright test
 *   npm run test:e2e
 */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // first Next.js compile can be slow
  },
});
