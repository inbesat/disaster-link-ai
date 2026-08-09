// ---------------------------------------------------------------------
// scripts/check-phase9-10.mjs
//
// Standalone Playwright verification for the Phase 9/10 browser checks
// that were pending in docs/CONTEXT_HANDOFF.md:
//
//   1. Guest + baseline /command-center render (KPI count-up + live IST
//      clock ticking, zero layout errors)
//   2. Offline banner (network offline → amber banner → Retry toast →
//      back online → dismiss)
//   3. One-handed (Reachability) mode at a <768px viewport (double-tap
//      gutter → content slides down + Restore chip; tab double-tap does
//      NOT toggle). The bottom nav only renders below md (768px) since the
//      Aug 9 breakpoint alignment — phones only.
//   4. Demo simulation (demo_sim_active flag → People-at-Risk bumps +
//      activity feed injections on /command-center)
//   5. ?demo=1 DemoController (bar hidden without param, visible with
//      it, scenario pills fire roadmap toasts)
//   6. ShortcutModal ("?" opens the kbd grid, Esc closes, ⌘/ navigates to
//      AI Planner and closes the dialog on route change)
//
// Run:  node scripts/check-phase9-10.mjs
//       (assumes `npm run dev` is already serving http://localhost:3000)
//
// Notes:
//   • The dev server's first load after a code change can be slow (module
//     recompile + hydration); sensitive steps wait for a hydration signal
//     (the LiveClock [role="timer"] at lg+ widths) before proceeding.
//   • The Supabase DB is unreachable in this dev env → /api/alerts 500s
//     and offline mode breaks chunk/websocket loads; those console errors
//     are known noise, filtered out below.
//
// Output: JSON with { results, knownNoise, realErrors }.
// ---------------------------------------------------------------------

import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const results = [];
const errors = [];

function record(name, ok, detail) {
  results.push({ name, ok: Boolean(ok), detail: detail ?? "" });
}

function attachErrorTrap(page, tag) {
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[${tag}] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${tag}] ${e.message}`));
}

/**
 * Guest auth: the guest_mode cookie is httpOnly (set by the setGuestMode
 * server action), so the deterministic path is to set it directly, then
 * land on /command-center — the same surface a judge sees.
 */
async function guestAuth(context, page) {
  await context.addCookies([
    { name: "guest_mode", value: "true", domain: "localhost", path: "/" },
  ]);
  await page.goto(`${BASE}/command-center`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForSelector("text=People at Risk", { timeout: 60000 });
}

/**
 * Wait until React has hydrated + the page settled. At md+ widths the
 * LiveClock in the top bar renders [role="timer"] only after its mount
 * effect runs (i.e. after hydration). Below md the clock is hidden, so we
 * fall back to a short settle wait.
 */
async function waitHydrated(page, { viewportWidth }) {
  if (viewportWidth >= 768) {
    await page.waitForSelector('[role="timer"]', { timeout: 90000 });
  } else {
    await page.waitForTimeout(2500);
  }
}

/**
 * innerText of the "People at Risk" KPI value on /command-center — the
 * legacy KPICards card (div.rounded-eoc) wraps the number in CountUpNumber
 * inside p.tabular-nums. Initial value 48,210 (counts up from 0 on load).
 */
function readRiskValue(page) {
  return page
    .locator('div.rounded-eoc:has-text("People at Risk") p[class*="tabular-nums"]')
    .innerText({ timeout: 15000 });
}

/** Feed row count — LiveActivityFeed section's <li> entries. */
function readFeedCount(page) {
  return page.locator('section:has-text("LIVE ACTIVITY FEED") ul li').count();
}

const browser = await chromium.launch();

// ============================= CHECK 1 — baseline =======================
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  attachErrorTrap(page, "baseline");
  try {
    await guestAuth(ctx, page);
    await waitHydrated(page, { viewportWidth: 1280 });
    record("guest lands on /command-center", true, page.url());

    const early = await readRiskValue(page);
    await page.waitForTimeout(2800);
    const late = await readRiskValue(page);
    const settled = late.replace(/[^\d]/g, "") === "48210";
    record(
      "KPI count-up animation",
      early !== late && settled,
      `early=${early} late=${late} (expects animation + exact 48,210)`,
    );

    const t1 = await page.locator('[role="timer"]').innerText();
    await page.waitForTimeout(1600);
    const t2 = await page.locator('[role="timer"]').innerText();
    record("live IST clock ticks", t1 !== t2, `t1=${t1} t2=${t2}`);
  } catch (e) {
    record("baseline check", false, String(e));
  }
  await ctx.close();
}

// ============================= CHECK 2 — offline banner =================
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  attachErrorTrap(page, "offline");
  try {
    await guestAuth(ctx, page);
    await waitHydrated(page, { viewportWidth: 1280 }); // listeners attached

    await ctx.setOffline(true);
    await page.waitForSelector("text=Offline Mode", { timeout: 30000 });
    record("offline banner appears", true, "amber 'Offline Mode' strip at top");

    await page.getByRole("button", { name: /Retry Connection/ }).click();
    await page.waitForTimeout(2200);
    const body = await page.locator("body").innerText();
    const toastFired =
      body.includes("Still offline") || body.includes("Connection restored");
    record(
      "Retry Connection fires toast",
      toastFired,
      "expects 'Still offline' while offline",
    );

    await ctx.setOffline(false);
    await page.waitForSelector("text=Offline Mode", {
      state: "detached",
      timeout: 15000,
    });
    record("offline banner dismisses on reconnect", true, "banner removed from DOM");
  } catch (e) {
    record("offline banner check", false, String(e));
  }
  await ctx.close();
}

// ====================== CHECK 3 — one-handed mode (<768px) ==============
{
  const ctx = await browser.newContext({ viewport: { width: 600, height: 800 } });
  const page = await ctx.newPage();
  attachErrorTrap(page, "one-handed");
  try {
    await guestAuth(ctx, page);
    await waitHydrated(page, { viewportWidth: 600 });
    // /command-center is a MAP_ROUTES route → bottom nav renders MAP mode.
    await page.waitForSelector('nav[aria-label="Map tools"]', { timeout: 60000 });
    record("bottom nav visible at 600px", true, "nav in MAP mode on /command-center");

    // Guard the click coordinates: until hydration + CSS settle the fixed
    // nav can report a rect outside the viewport (Playwright boundingBox on
    // a not-yet-styled element). Poll until the nav actually sits in view.
    await page.waitForFunction(
      () => {
        const r = document
          .querySelector('nav[aria-label="Map tools"]')
          ?.getBoundingClientRect();
        return r && r.height === 72 && r.top >= 0 && r.bottom <= window.innerHeight + 1;
      },
      undefined,
      { timeout: 30000 },
    );

    const nav = page.locator('nav[aria-label="Map tools"]');
    const box = await nav.boundingBox();
    // LEFT gutter: the bottom-right corner's fixed overlays (SimulationToggle
    // moved to bottom-left; EmergencyContactCard hidden below md — both
    // audit-pass fixes) no longer cover the nav on phones, so any gutter
    // works; the left one stays deterministic.
    const x = box.x + 40;
    const y = box.y + box.height / 2;

    const chip = page.getByRole("button", { name: "Restore" });
    let oneHandedOn = false;
    for (let attempt = 1; attempt <= 2 && !oneHandedOn; attempt++) {
      await page.mouse.click(x, y);
      await page.waitForTimeout(150);
      await page.mouse.click(x, y);
      await page.waitForTimeout(1000); // 300ms transition + margin
      oneHandedOn = (await page.locator("nav[data-one-handed]").count()) === 1;
    }
    record(
      "double-tap gutter activates one-handed mode",
      oneHandedOn && (await chip.isVisible()),
      "content slid down + Restore chip shown",
    );

    await chip.click();
    await page.waitForTimeout(1000);
    record(
      "Restore chip returns content",
      (await page.locator("nav[data-one-handed]").count()) === 0 &&
        !(await chip.isVisible().catch(() => false)),
      "one-handed off, chip gone",
    );

    // Negative control: double-tap a NAV-mode tab must not toggle it.
    await page.goto(`${BASE}/alerts`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector('nav[aria-label="Main navigation"]', { timeout: 60000 });
    await page.waitForTimeout(2500); // let /alerts hydrate
    const tab = page.getByRole("button", { name: /Alerts/ }).first();
    await tab.click();
    await page.waitForTimeout(150);
    await tab.click();
    await page.waitForTimeout(1000);
    record(
      "double-tap on a tab does NOT toggle one-handed",
      (await page.locator("nav[data-one-handed]").count()) === 0,
      "negative control passed",
    );
  } catch (e) {
    record("one-handed mode check", false, String(e));
  }
  await ctx.close();
}

// ====================== CHECK 4 — demo simulation =======================
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  attachErrorTrap(page, "demo-sim");
  try {
    await guestAuth(ctx, page);
    await waitHydrated(page, { viewportWidth: 1280 });
    await page.evaluate(() => localStorage.setItem("demo_sim_active", "true"));

    const riskBefore = await readRiskValue(page);
    const feedBefore = await readFeedCount(page);

    await page.reload({ waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector("text=People at Risk", { timeout: 60000 });
    await page.waitForTimeout(26000); // ~3 interval ticks @ 8s

    const riskAfter = await readRiskValue(page);
    const feedAfter = await readFeedCount(page);
    const bumped = riskAfter !== riskBefore;
    const feedGrew = feedAfter > feedBefore;
    record(
      "demo simulation injects live data",
      bumped || feedGrew,
      `people-at-risk ${riskBefore} -> ${riskAfter}; feed ${feedBefore} -> ${feedAfter}`,
    );
  } catch (e) {
    record("demo simulation check", false, String(e));
  }
  await ctx.close();
}

// ====================== CHECK 6 — ? shortcuts modal =====================
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  attachErrorTrap(page, "shortcuts");
  try {
    await guestAuth(ctx, page);
    await waitHydrated(page, { viewportWidth: 1280 });

    const hiddenByDefault = (await page.getByRole("dialog").count()) === 0;

    await page.keyboard.press("Shift+/"); // "?"
    await page.waitForSelector('[role="dialog"][aria-label="Keyboard shortcuts"]', {
      timeout: 10000,
    });
    const kbdCount = await page
      .locator('[role="dialog"][aria-label="Keyboard shortcuts"] kbd')
      .count();
    const hasMod1 = await page
      .locator('[role="dialog"] kbd:has-text("1")')
      .isVisible()
      .catch(() => false);
    record(
      "? opens ShortcutModal with kbd grid",
      hiddenByDefault && kbdCount >= 8 && hasMod1,
      `kbd chips: ${kbdCount}; hidden before pressing ?: ${hiddenByDefault}`,
    );

    await page.keyboard.press("Escape");
    await page.waitForSelector('[role="dialog"]', { state: "detached", timeout: 10000 });
    record("Esc closes the modal", true, "dialog removed from DOM");

    // ⌘/ → AI Planner while the panel is open: navigates AND closes the
    // dialog (close-on-route-change). Generous timeout: the first-ever
    // dev compile of /ai-planner can take 60s+.
    await page.keyboard.press("Shift+/"); // reopen
    await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
    await page.keyboard.press(process.platform === "darwin" ? "Meta+/" : "Control+/");
    await page.waitForURL(/ai-planner/, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.waitForSelector('[role="dialog"]', { state: "detached", timeout: 10000 });
    record(
      "⌘/ navigates to AI Planner + modal closes",
      true,
      `${page.url()} (dialog closed on route change)`,
    );
  } catch (e) {
    record("shortcut modal check", false, String(e));
  }
  await ctx.close();
}

// ====================== CHECK 5 — ?demo=1 controller ====================
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  attachErrorTrap(page, "demo-controller");
  try {
    await guestAuth(ctx, page);
    await waitHydrated(page, { viewportWidth: 1280 });
    const hiddenWithoutParam = (await page.getByText("Demo Mode Active").count()) === 0;

    await page.goto(`${BASE}/command-center?demo=1`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector("text=Demo Mode Active", { timeout: 30000 });
    record(
      "DemoController hidden w/o ?demo=1, shown with it",
      hiddenWithoutParam,
      "watermark + scenario pills visible at ?demo=1",
    );

    await page.getByRole("button", { name: /Trigger Critical Flood/ }).click();
    await page.waitForTimeout(900);
    const toastShown = await page
      .getByText("Critical Flood Triggered")
      .isVisible()
      .catch(() => false);
    record(
      "scenario pill fires roadmap toast",
      toastShown,
      "'Critical Flood Triggered' toast card",
    );
  } catch (e) {
    record("demo controller check", false, String(e));
  }
  await ctx.close();
}

await browser.close();

// Known, documented dev-environment noise (Supabase DB unreachable in dev;
// offline mode breaking chunk/websocket loads; pre-existing tel: console
// warning from the emergency contact card):
const NOISE_PATTERNS = [
  "Failed to load alerts",
  "500 (Internal Server Error)",
  "net::ERR_INTERNET_DISCONNECTED",
  "Loading CSS chunk",
  "Error: Loading CSS chunk",
  "WebSocket connection to",
  'URL scheme "tel" is not supported',
  // Direct consequences of the deliberate offline state in check 2:
  "Simulator prediction failed",
  "maplibre-gl",
];
const knownNoise = errors.filter((e) => NOISE_PATTERNS.some((p) => e.includes(p)));
const realErrors = errors.filter((e) => !knownNoise.includes(e));

console.log(JSON.stringify({ results, knownNoise, realErrors }, null, 2));
process.exit(results.every((r) => r.ok) && realErrors.length === 0 ? 0 : 1);
