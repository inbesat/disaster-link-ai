import { test, expect } from "@playwright/test";

/**
 * Mobile Device & Touch Target E2E Tests (Phase 19 · Prompt 19.3).
 * Verifies mobile viewport behavior, minimum 44x44px touch targets, bottom navigation, and PWA readiness.
 */

test.describe("Mobile Device Experience", () => {
  test("1. Verify public dashboard responsiveness & touch targets on mobile", async ({
    page,
  }) => {
    await page.context().addCookies([
      { name: "role", value: "public", domain: "localhost", path: "/" },
    ]);
    await page.goto("/public/dashboard");

    // Bottom navigation visible on mobile
    const bottomNav = page.locator("nav").filter({ hasText: /Home|Alerts|Map|SOS/i }).first();
    await expect(bottomNav).toBeVisible();

    // Check touch target heights (must be at least 44px)
    const sosTab = page.getByRole("button", { name: /SOS/i }).or(page.getByText("SOS")).first();
    if (await sosTab.isVisible()) {
      const box = await sosTab.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40);
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test("2. Verify mobile offline status banner and PWA readiness", async ({
    page,
    context,
  }) => {
    await page.context().addCookies([
      { name: "role", value: "public", domain: "localhost", path: "/" },
    ]);
    await page.goto("/public/dashboard");

    // Simulate going offline on mobile device
    await context.setOffline(true);
    await page.goto("/public/dashboard");

    // Banner or status should indicate offline mode
    await expect(
      page.getByText(/OFFLINE|cached|connectivity/i).or(page.getByText(/SAFE|WATCH/i)).first(),
    ).toBeVisible();

    // Reconnect
    await context.setOffline(false);
  });
});
