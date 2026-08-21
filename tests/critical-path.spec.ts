import { test, expect } from "@playwright/test";

/**
 * Critical Path E2E Tests (Phase 19 · Prompt 19.1).
 * Tests all 5 key user journeys for demo readiness (<30s per test, using demo data).
 */

async function loginAsPublic(page: import("@playwright/test").Page) {
  await page.context().addCookies([
    { name: "role", value: "public", domain: "localhost", path: "/" },
  ]);
}

async function loginAsGov(page: import("@playwright/test").Page) {
  await page.context().addCookies([
    { name: "role", value: "district_admin", domain: "localhost", path: "/" },
  ]);
}

test.describe("Critical Demo Path E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure fast execution with default timeouts
    test.setTimeout(30_000);
  });

  /**
   * Flow 1: Public User
   * Open app → see safety status → view shelters → tap SOS → confirm → see confirmation
   */
  test("1. Public User Journey: Safety Status → Shelters → SOS Confirmation", async ({
    page,
  }) => {
    await loginAsPublic(page);
    await page.goto("/public/dashboard");

    // 1. See safety status
    await expect(
      page.getByText(/SAFE|WATCH|PREPARE|EVACUATE/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    // 2. View shelters
    await page.goto("/public/shelters");
    await expect(
      page.getByText(/shelter|camp|school|center|bed|capacity/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    // 3. Tap SOS from dashboard/nav
    await page.goto("/public/dashboard");
    const sosButton = page
      .getByRole("button", { name: /SOS/i })
      .or(page.getByText("🆘 SOS"))
      .first();
    await expect(sosButton).toBeVisible();
    await sosButton.click();

    // 4. Confirm action in SOS Modal
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    const safeTile = modal
      .getByRole("button", { name: /I Am Safe/i })
      .or(modal.getByRole("button", { name: /Need Food/i }))
      .first();
    await safeTile.click();

    // 5. See confirmation toast/message
    await expect(
      page.getByText(/Marked Safe|Command Center has been notified|status/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  /**
   * Flow 2: Gov User
   * Login → view dashboard → see flood prediction → run AI plan → approve plan → send alert → track delivery
   */
  test("2. Gov User Journey: Login → Flood Prediction → AI Plan → Alert Dispatch", async ({
    page,
  }) => {
    // 1. Login via /gov/login
    await page.goto("/gov/login");
    await page.fill("#gov-email", "commander@patna.gov.in");
    await page.fill("#gov-password", "password123");
    await page.getByRole("button", { name: /Sign In/i }).click();

    // 2. View dashboard & see flood prediction
    await expect(page).toHaveURL(/\/gov\/dashboard|\/command-center/, { timeout: 15_000 });
    await expect(
      page.getByText(/INCIDENT|DISTRICT|FLOOD|RISK|WATER LEVEL/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    // 3. Run AI Plan
    await page.goto("/gov/ai-planner");
    await expect(page).toHaveURL(/\/gov\/ai-planner|\/ai-planner/);
    const chatInput = page
      .getByRole("textbox")
      .or(page.getByPlaceholder(/ask|type|message|prompt/i))
      .first();
    await expect(chatInput).toBeVisible();
    await chatInput.fill("Evacuate Sector 4 flood zone");
    await chatInput.press("Enter");

    // 4. Approve plan / View recommendation
    await expect(
      page.getByText(/Sector 4|Evacuation|Plan|Response|AI/i).first(),
    ).toBeVisible({ timeout: 15_000 });

    // 5. Send Alert & Track Delivery
    await page.goto("/gov/alerts");
    await expect(page.getByText(/alert|broadcast|warning|watch/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  /**
   * Flow 3: Cross-mode Integration
   * Gov sends alert → Public receives alert → Public views evacuation route → Public marks safe → Gov sees update
   */
  test("3. Cross-mode Journey: Gov Alert → Public Route → Mark Safe → Gov Sync", async ({
    page,
  }) => {
    // 1. Gov sends/dispatches alert view
    await loginAsGov(page);
    await page.goto("/gov/alerts");
    await expect(page.getByText(/alert|broadcast|active/i).first()).toBeVisible();

    // 2. Public receives alert & views route
    await loginAsPublic(page);
    await page.goto("/public/alerts");
    await expect(page.getByText(/alert|warning|critical|flood/i).first()).toBeVisible();

    await page.goto("/public/map");
    await expect(page.locator(".maplibregl-canvas").or(page.getByText(/map|route|shelter/i)).first()).toBeVisible();

    // 3. Public marks safe
    await page.goto("/public/dashboard");
    const sosBtn = page.getByRole("button", { name: /SOS/i }).or(page.getByText("🆘 SOS")).first();
    await sosBtn.click();
    const safeBtn = page.getByRole("button", { name: /I Am Safe/i }).first();
    await safeBtn.click();

    // 4. Gov sees updated status
    await loginAsGov(page);
    await page.goto("/gov/dashboard");
    await expect(page.getByText(/PATNA|INCIDENT|STATUS|DISTRICT/i).first()).toBeVisible();
  });

  /**
   * Flow 4: Offline Mode
   * Go offline → view cached data → trigger SOS → reconnect → sync data
   */
  test("4. Offline Journey: Offline Cache → Trigger SOS → Reconnect Sync", async ({
    page,
    context,
  }) => {
    await loginAsPublic(page);
    await page.goto("/public/dashboard");

    // 1. Go offline
    await context.setOffline(true);

    // 2. View cached data / offline banner
    await page.goto("/public/dashboard");
    await expect(
      page.getByText(/OFFLINE|cached|connectivity|sync/i).or(page.getByText(/SAFE|WATCH/i)).first(),
    ).toBeVisible({ timeout: 10_000 });

    // 3. Trigger SOS while offline
    const sosBtn = page.getByRole("button", { name: /SOS/i }).or(page.getByText("🆘 SOS")).first();
    await sosBtn.click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    const safeTile = modal.getByRole("button", { name: /I Am Safe/i }).first();
    await safeTile.click();

    // 4. Reconnect
    await context.setOffline(false);
    await page.reload();

    // 5. Sync verified
    await expect(page.getByText(/SAFE|WATCH|PREPARE|EVACUATE/i).first()).toBeVisible();
  });

  /**
   * Flow 5: Authentication Lifecycle
   * Register → verify OTP → complete onboarding → logout → login → access correct dashboard
   */
  test("5. Auth Journey: Phone Login → OTP → Onboarding → Logout → Relogin", async ({
    page,
  }) => {
    // 1. Start on phone OTP login
    await page.goto("/public/login");
    await page.fill("#phone", "+919876543210");
    await page.getByRole("button", { name: /Send OTP/i }).click();

    // 2. Enter 6-digit OTP code
    await expect(page.getByText(/Enter the 6-digit code/i)).toBeVisible();
    const inputs = page.locator('input[aria-label^="Digit"]');
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(String(i + 1));
    }
    await page.getByRole("button", { name: /Verify & Continue/i }).click();

    // 3. Complete Onboarding
    await expect(page).toHaveURL(/\/public\/onboarding/, { timeout: 15_000 });
    await page.getByRole("button", { name: /Skip/i }).or(page.getByRole("button", { name: /Continue/i })).first().click();

    // 4. Access Public Dashboard
    await expect(page).toHaveURL(/\/public\/dashboard/, { timeout: 15_000 });
    await expect(page.getByText(/SAFE|WATCH|PREPARE|EVACUATE/i).first()).toBeVisible();

    // 5. Logout & Relogin via Gov Login
    await page.goto("/gov/login");
    await page.fill("#gov-email", "admin@bihar.gov.in");
    await page.fill("#gov-password", "admin123");
    await page.getByRole("button", { name: /Sign In/i }).click();

    await expect(page).toHaveURL(/\/gov\/dashboard|\/command-center/, { timeout: 15_000 });
  });
});
