import { test, expect } from "@playwright/test";

/**
 * Critical path E2E (Phase 23 · Step 4).
 *
 * Flow: Homepage → Sign In → Continue as Guest (Demo) → Command Center
 * → "Flood Risk Zones" map layer toggle is present and ON, and the
 * MapLibre canvas has actually mounted.
 */
test("guest reaches the command center and the flood map layer is visible", async ({
  page,
}) => {
  // 1. Homepage loads with its hero CTA.
  await page.goto("/");
  await expect(page).toHaveTitle(/Disaster Response Intelligence/);
  await expect(page.getByRole("link", { name: "Sign In" }).first()).toBeVisible();

  // 2. Go to the login page and enter demo guest mode.
  //    (Generous timeouts: the Next.js dev server compiles each route on
  //    first request, including the server action and the map chunk.)
  await page.getByRole("link", { name: "Sign In" }).first().click();
  await expect(page).toHaveURL(/\/login/, { timeout: 45_000 });
  await page.getByRole("button", { name: "Continue as Guest (Demo)" }).click();

  // 3. Guest mode redirects straight to the command center.
  await expect(page).toHaveURL(/\/command-center/, { timeout: 60_000 });

  // 4. The flood layer toggle exists and is switched ON by default.
  const floodLayer = page.getByRole("checkbox", { name: "Flood Risk Zones" });
  await expect(floodLayer).toBeVisible({ timeout: 30_000 });
  await expect(floodLayer).toBeChecked();

  // 5. The real MapLibre map canvas has mounted underneath the toggles.
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({
    timeout: 60_000,
  });
});
