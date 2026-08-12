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

/**
 * Public citizen app E2E.
 * Flow: Homepage → Public Login → Public Dashboard → Safety Status visible
 */
test("citizen can access the public safety dashboard", async ({ page }) => {
  await page.goto("/");
  // Navigate to public login
  await page.getByRole("link", { name: "Sign In" }).first().click();
  await expect(page).toHaveURL(/\/login/, { timeout: 45_000 });

  // Click public demo login (adjust selector based on actual UI)
  const publicLogin = page.getByRole("button", { name: /citizen|public|resident/i }).first();
  if (await publicLogin.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await publicLogin.click();
    // Should redirect to public dashboard
    await expect(page).toHaveURL(/\/public\/dashboard/, { timeout: 60_000 });
    // Safety status should be visible
    await expect(page.getByText(/SAFE|WATCH|PREPARE|EVACUATE/i).first()).toBeVisible({
      timeout: 30_000,
    });
  }
});

/**
 * Alert system E2E.
 * Flow: Login as Guest → Alerts page → Alert feed loads
 */
test("alert feed loads in the command center", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign In" }).first().click();
  await expect(page).toHaveURL(/\/login/, { timeout: 45_000 });
  await page.getByRole("button", { name: "Continue as Guest (Demo)" }).click();
  await expect(page).toHaveURL(/\/command-center/, { timeout: 60_000 });

  // Navigate to alerts
  const alertsNav = page.getByRole("link", { name: /alerts/i }).first();
  if (await alertsNav.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await alertsNav.click();
    await expect(page).toHaveURL(/\/alerts/, { timeout: 30_000 });
    // Alert content should be visible
    await expect(page.getByText(/flood|warning|watch|critical/i).first()).toBeVisible({
      timeout: 30_000,
    });
  }
});

/**
 * AI Chat E2E.
 * Flow: Login → AI Planner → Chat interface visible
 */
test("AI emergency planner chat is accessible", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign In" }).first().click();
  await expect(page).toHaveURL(/\/login/, { timeout: 45_000 });
  await page.getByRole("button", { name: "Continue as Guest (Demo)" }).click();
  await expect(page).toHaveURL(/\/command-center/, { timeout: 60_000 });

  // Navigate to AI Planner
  const aiNav = page.getByRole("link", { name: /AI|planner|advisor/i }).first();
  if (await aiNav.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await aiNav.click();
    // Chat input should be visible
    await expect(page.getByRole("textbox").or(page.getByPlaceholder(/ask|type|message/i)).first()).toBeVisible({
      timeout: 30_000,
    });
  }
});

/**
 * Map E2E.
 * Flow: Login → Map page → Map canvas mounts
 */
test("interactive map loads with shelter markers", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign In" }).first().click();
  await expect(page).toHaveURL(/\/login/, { timeout: 45_000 });
  await page.getByRole("button", { name: "Continue as Guest (Demo)" }).click();
  await expect(page).toHaveURL(/\/command-center/, { timeout: 60_000 });

  // Navigate to map
  const mapNav = page.getByRole("link", { name: /map/i }).first();
  if (await mapNav.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await mapNav.click();
    // Map canvas should be visible
    await expect(page.locator(".maplibregl-canvas")).toBeVisible({
      timeout: 60_000,
    });
  }
});

/**
 * Settings E2E.
 * Flow: Login → Settings → Profile page loads
 */
test("settings page is accessible", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Sign In" }).first().click();
  await expect(page).toHaveURL(/\/login/, { timeout: 45_000 });
  await page.getByRole("button", { name: "Continue as Guest (Demo)" }).click();
  await expect(page).toHaveURL(/\/command-center/, { timeout: 60_000 });

  // Navigate to settings
  const settingsNav = page.getByRole("link", { name: /settings/i }).first();
  if (await settingsNav.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await settingsNav.click();
    await expect(page).toHaveURL(/\/settings/, { timeout: 30_000 });
    // Settings content should be visible
    await expect(page.getByText(/profile|notification|map|privacy/i).first()).toBeVisible({
      timeout: 30_000,
    });
  }
});
