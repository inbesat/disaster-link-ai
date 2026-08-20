import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * Overlap regression E2E (map action toolbar vs Live Activity Feed).
 *
 * Guards the Phase 27 overlap fix: the right-edge map action toolbar
 * (Share Alert / Measure / Mark Road Closed / Draw Risk Area) used to be
 * an ad-hoc absolute stack at `right-3 top-32 z-10` that was clipped by
 * sibling panels — the command-center mobile bottom sheet and the /map
 * MeasurementToolbar painted on top of its lower buttons, leaving only a
 * thin colored sliver visible. It is now ONE self-contained flex column
 * (components/map/MapActionToolbar.tsx) with a consistent gap, a max
 * width, and a z-index above every other floating map control.
 *
 * This spec captures before/after screenshots of the command-center map
 * with the toolbar AND the Live Activity Feed visible together, and
 * asserts they never overlap / clip at the three target viewports:
 * desktop 1920, laptop 1366, and mobile (PWA / offline-first).
 */

/** Intersection test for two DOM bounding boxes. */
function intersects(
  a: { x: number; y: number; width: number; height: number } | null,
  b: { x: number; y: number; width: number; height: number } | null,
): boolean {
  if (!a || !b) return false;
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

/** Every toolbar button must be fully inside the viewport (never clipped). */
async function expectFullyVisible(locator: Locator, page: Page) {
  const vp = page.viewportSize();
  if (!vp) throw new Error("no viewport");
  const buttons = locator.locator("button");
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const box = await buttons.nth(i).boundingBox();
    expect(box, `toolbar button #${i} visible`).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height);
  }
}

// The demo guest flow (homepage → /access → enableGuestMode) sets role=public
// and bounces to /public/dashboard, so it can never reach the responder
// command center. A bare guest_mode cookie (no role) is exactly what the
// middleware admits to /command-center — the same session shape setGuestMode
// used to write — so we set it directly and skip the stale UI flow.
async function loginAsGuest(page: Page) {
  await page.context().addCookies([
    {
      name: "guest_mode",
      value: "true",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto("/command-center");
  await expect(page).toHaveURL(/\/command-center/, { timeout: 60_000 });
}

async function waitForMapAndToolbar(page: Page) {
  // Real MapLibre canvas has mounted under the floating controls.
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 60_000 });
  const toolbar = page.locator('[aria-label="Map actions"]');
  await expect(toolbar).toBeVisible({ timeout: 60_000 });
  return toolbar;
}

test.describe("command-center toolbar vs Live Activity Feed overlap", () => {
  test("desktop 1920 — toolbar and feed never overlap", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginAsGuest(page);

    const toolbar = await waitForMapAndToolbar(page);

    // The feed lives in the left sidebar on desktop. It renders in BOTH the
    // desktop aside and the mobile bottom sheet (CommandCenterClient mounts
    // `sidebar` in each), so scope to the visible instance.
    const feedHeading = page.getByText("LIVE ACTIVITY FEED").filter({ visible: true });
    await expect(feedHeading).toBeVisible({ timeout: 30_000 });
    const feedPanel = feedHeading.locator("xpath=ancestor::section[1]");

    const toolbarBox = await toolbar.boundingBox();
    const feedBox = await feedPanel.boundingBox();
    expect(toolbarBox).not.toBeNull();
    expect(feedBox).not.toBeNull();
    expect(intersects(toolbarBox, feedBox)).toBe(false);

    await expectFullyVisible(toolbar, page);
    await page.screenshot({
      path: "test-results/overlap/command-center-toolbar-feed-1920.png",
      fullPage: false,
    });
  });

  test("laptop 1366 — toolbar and feed never overlap", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await loginAsGuest(page);

    const toolbar = await waitForMapAndToolbar(page);

    const feedHeading = page.getByText("LIVE ACTIVITY FEED").filter({ visible: true });
    await expect(feedHeading).toBeVisible({ timeout: 30_000 });
    const feedPanel = feedHeading.locator("xpath=ancestor::section[1]");

    const toolbarBox = await toolbar.boundingBox();
    const feedBox = await feedPanel.boundingBox();
    expect(intersects(toolbarBox, feedBox)).toBe(false);

    await expectFullyVisible(toolbar, page);
    await page.screenshot({
      path: "test-results/overlap/command-center-toolbar-feed-1366.png",
      fullPage: false,
    });
  });

  test("mobile 390×844 — toolbar not clipped by the feed bottom sheet", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsGuest(page);

    const toolbar = await waitForMapAndToolbar(page);

    // On mobile the feed sits in the command-center bottom sheet; expand it
    // so both the toolbar and the feed are visible simultaneously. Force the
    // click: the dev-only DemoOrchestrator overlay (z-[800], bottom-right)
    // sits over the sheet handle in dev mode and would otherwise intercept
    // the actionability check.
    const expand = page.getByRole("button", { name: "Expand panel" });
    await expect(expand).toBeVisible({ timeout: 30_000 });
    await expand.click({ force: true });
    await expect(
      page.getByText("LIVE ACTIVITY FEED").filter({ visible: true }),
    ).toBeVisible({ timeout: 30_000 });

    // The toolbar sits above the sheet (z-50) — every button must stay fully
    // within the viewport, never clipped into the sheet's edge.
    await expectFullyVisible(toolbar, page);
    await page.screenshot({
      path: "test-results/overlap/command-center-toolbar-feed-mobile.png",
      fullPage: false,
    });
  });

  test("status badge tooltip is not clipped at the panel edge", async ({ page }) => {
    // Desktop 1366: the feed lives in the left sidebar here, and the badge's
    // tooltip used to be cut off ("Realti…") at the sidebar's right edge.
    await page.setViewportSize({ width: 1366, height: 768 });
    await loginAsGuest(page);
    await waitForMapAndToolbar(page);

    // The badge/tooltip also render inside the mobile bottom sheet, so scope
    // to the visible (sidebar) instance before hovering.
    const badge = page
      .locator('[aria-describedby="realtime-status-tooltip"]')
      .filter({ visible: true });
    await expect(badge).toBeVisible({ timeout: 30_000 });
    await badge.hover({ force: true });

    // Tooltip anchors right-0 to the badge and grows leftward — it must stay
    // fully inside the viewport (never clipped by the panel edge).
    const tooltip = page.locator("#realtime-status-tooltip").filter({ visible: true });
    await expect(tooltip).toBeVisible();
    const box = await tooltip.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(1366);
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
  });
});