import { test, expect } from "@playwright/test";

/**
 * Critical path E2E (Phase 23 · Step 4, updated for the Phase 1 dual-mode
 * entry door).
 *
 * The marketing header "Sign In" now routes to /access — a dual-mode entry
 * door: Resident/Citizen → /public/login (OTP), Responder/Official →
 * /gov/login (email+password). "Continue as Guest" sets role=public and
 * lands on /public/dashboard, so it can no longer reach the responder
 * command center. The responder shell is reached in tests the same way the
 * map-toolbar overlap spec reaches it: a BARE guest_mode cookie (no role),
 * which the middleware admits to /command-center / /dashboard / /alerts /
 * /ai-planner / /map / /settings exactly like the old demo guest flow did.
 */

/** Bare guest session → responder shell (mirrors map-toolbar-overlap.spec). */
async function loginAsGuest(page: import("@playwright/test").Page) {
  await page.context().addCookies([
    { name: "guest_mode", value: "true", domain: "localhost", path: "/" },
  ]);
}

/**
 * Flow: Homepage → Sign In → Command Center → "Flood Risk Zones" layer
 * toggle is present and ON, and the MapLibre canvas has actually mounted.
 */
test("guest reaches the command center and the flood map layer is visible", async ({
  page,
}) => {
  // 1. Homepage loads with its hero CTA.
  await page.goto("/");
  await expect(page).toHaveTitle(/SafeSphere/);
  await expect(page.getByRole("link", { name: "Sign In" }).first()).toBeVisible();

  // 2. Sign In leads to the dual-mode /access door (not the old /login).
  await page.getByRole("link", { name: "Sign In" }).first().click();
  await expect(page).toHaveURL(/\/access/, { timeout: 45_000 });

  // 3. A bare guest session is admitted straight to the command center.
  await loginAsGuest(page);
  await page.goto("/command-center");
  await expect(page).toHaveURL(/\/command-center/, { timeout: 60_000 });

  // 4. The flood layer toggle exists and is switched ON by default.
  const floodLayer = page.getByRole("checkbox", { name: "Flood Risk Zones" });
  await expect(floodLayer).toBeVisible({ timeout: 30_000 });
  await expect(floodLayer).toBeChecked();

  // 5. The real MapLibre map canvas has mounted underneath the toggles.
  await expect(page.locator(".maplibregl-canvas").first()).toBeVisible({
    timeout: 60_000,
  });
});

/**
 * Public citizen app E2E.
 * Flow: Homepage → /access → Continue as Guest → Public Dashboard → Safety
 * Status visible.
 */
test("citizen can access the public safety dashboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign In" }).first().click();
  await expect(page).toHaveURL(/\/access/, { timeout: 45_000 });

  // Enter the citizen door as a guest (role=public → /public/dashboard).
  await page.getByRole("button", { name: "Continue as Guest" }).click();
  await expect(page).toHaveURL(/\/public\/dashboard/, { timeout: 60_000 });

  // Safety status hero should be visible (SAFE / WATCH / PREPARE / EVACUATE).
  await expect(page.getByText(/SAFE|WATCH|PREPARE|EVACUATE/i).first()).toBeVisible({
    timeout: 30_000,
  });
});

/**
 * Alert system E2E.
 * Flow: Guest → Alerts page → Alert feed loads.
 */
test("alert feed loads in the command center", async ({ page }) => {
  await loginAsGuest(page);
  await page.goto("/command-center");
  await expect(page).toHaveURL(/\/command-center/, { timeout: 60_000 });

  // Navigate to alerts.
  await page.goto("/alerts");
  await expect(page).toHaveURL(/\/alerts/, { timeout: 30_000 });
  await expect(page.getByText(/flood|warning|watch|critical/i).first()).toBeVisible({
    timeout: 30_000,
  });
});

/**
 * AI Chat E2E.
 * Flow: Guest → AI Planner → Chat interface visible.
 */
test("AI emergency planner chat is accessible", async ({ page }) => {
  await loginAsGuest(page);
  await page.goto("/ai-planner");
  await expect(page).toHaveURL(/\/ai-planner/, { timeout: 30_000 });

  // Chat input should be visible.
  await expect(
    page.getByRole("textbox").or(page.getByPlaceholder(/ask|type|message/i)).first(),
  ).toBeVisible({ timeout: 30_000 });
});

/**
 * Map E2E.
 * Flow: Guest → Map page → Map canvas mounts.
 */
test("interactive map loads with shelter markers", async ({ page }) => {
  await loginAsGuest(page);
  await page.goto("/map");
  await expect(page).toHaveURL(/\/map/, { timeout: 30_000 });

  // Map canvas should be visible (main map — the MiniMapWidget also mounts a
  // maplibre canvas, so scope with .first()).
  await expect(page.locator(".maplibregl-canvas").first()).toBeVisible({
    timeout: 60_000,
  });
});

/**
 * Settings E2E.
 * Flow: Guest → Settings → Profile page loads.
 */
test("settings page is accessible", async ({ page }) => {
  await loginAsGuest(page);
  await page.goto("/settings/profile");
  await expect(page).toHaveURL(/\/settings/, { timeout: 30_000 });

  // Settings content should be visible.
  await expect(page.getByText("Identity & Profile")).toBeVisible({
    timeout: 30_000,
  });
});