// Throwaway verification for Phase 13 · Step 2 (Extreme Low-Bandwidth
// Mode): flipping the toggle in citizen Settings must swap the MapLibre
// map for a plain-text shelter list on /public/map and hide the AI
// teaser + chat bubble on /public/dashboard.
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const errors = [];
const results = [];
const record = (name, ok, detail) => results.push({ name, ok: Boolean(ok), detail: detail ?? "" });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(e.message));

// --- Baseline: map page renders the real map (not low-bandwidth) -------
await page.goto(`${BASE}/public/map`, { waitUntil: "domcontentloaded", timeout: 120000 });
// Hydration + paint signal: the MapLibre attribution control only exists
// once the map painted. Cold first compile can take 60s+.
await page.waitForSelector("text=FIND YOUR WAY", { timeout: 120000 });
let baselineText = "";
for (let attempt = 0; attempt < 6 && !baselineText.includes("© CARTO"); attempt++) {
  await page.waitForTimeout(3000);
  baselineText = await page.locator("body").innerText().catch(() => "");
}
const markers = (baselineText.match(/🏠/g) ?? []).length;
record(
  "map page baseline renders (MapLibre painted)",
  baselineText.includes("© CARTO") && markers > 0,
  `attribution=${baselineText.includes("© CARTO")} shelterMarkers=${markers}`,
);
record(
  "map NOT in low-bandwidth mode by default",
  !baselineText.includes("Map hidden in low-bandwidth mode"),
  "no data-saver banner by default",
);

// --- Toggle ON via Settings ---------------------------------------------
await page.goto(`${BASE}/public/settings`, { waitUntil: "domcontentloaded", timeout: 120000 });
const toggle = page.getByRole("switch", { name: /low-bandwidth/i });
await toggle.waitFor({ timeout: 60000 });
await toggle.click();
await page.waitForTimeout(500);
const activeNote = await page
  .locator("text=Active — maps and the AI assistant are hidden")
  .isVisible()
  .catch(() => false);
record("settings toggle persists + shows active note", activeNote, "switch flipped, note visible");

// --- Map page now shows the text shelter list ---------------------------
await page.goto(`${BASE}/public/map`, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(2500);
const lowText = await page.locator("body").innerText().catch(() => "");
const bannerShown = lowText.includes("Map hidden in low-bandwidth mode to save data");
const hasShelterList = lowText.includes("Nearest shelters") || /shelter/i.test(lowText);
const hasMapSkeleton = lowText.includes("Loading your map");
record(
  "map swapped for text shelter list",
  bannerShown && hasShelterList && !hasMapSkeleton,
  `banner=${bannerShown} shelters=${hasShelterList} mapSkeleton=${hasMapSkeleton}`,
);

// --- Dashboard hides AI teaser + chat bubble -----------------------------
await page.goto(`${BASE}/public/dashboard`, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(2500);
const dashText = await page.locator("body").innerText().catch(() => "");
const aiTeaserGone = !dashText.includes("Need help preparing");
record(
  "dashboard AI teaser hidden in low-bandwidth mode",
  aiTeaserGone,
  aiTeaserGone ? "no 'Need help preparing' teaser" : "teaser still visible!",
);
const chatFabGone = !dashText.includes("Ask Sahayak") && !dashText.includes("Sahayak");
record(
  "AI chat bubble hidden in low-bandwidth mode",
  chatFabGone,
  chatFabGone ? "no Sahayak FAB" : "chat bubble still visible!",
);

// --- Toggle OFF restores the map -----------------------------------------
await page.goto(`${BASE}/public/settings`, { waitUntil: "domcontentloaded", timeout: 120000 });
await toggle.click();
await page.waitForTimeout(300);
await page.goto(`${BASE}/public/map`, { waitUntil: "domcontentloaded", timeout: 120000 });
await page.waitForTimeout(2000);
const restoredText = await page.locator("body").innerText().catch(() => "");
record(
  "toggling off restores the map",
  !restoredText.includes("Map hidden in low-bandwidth mode"),
  "data-saver banner gone",
);

await browser.close();

const realErrors = errors.filter(
  (e) => !e.includes("ERR_NAME_NOT_RESOLVED") && !e.includes("Failed to load") && !e.includes("WebSocket"),
);
console.log(JSON.stringify({ results, realErrors }, null, 2));
process.exit(results.every((r) => r.ok) && realErrors.length === 0 ? 0 : 1);
