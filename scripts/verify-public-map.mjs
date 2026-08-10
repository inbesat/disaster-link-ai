// Temp verification script — Phase 4 · Steps 1–2 public map DOM audit.
// Checks: map canvas renders, zero zoom/measure/layer chrome, Locate Me FAB,
// pulsing blue location dot (with a saved manual location), area chip label,
// BottomNav tabs + active Map tab, FAB recenter, console errors.
import { chromium } from "@playwright/test";

const PORT = process.env.MAP_PORT ?? "3002";
const BASE = `http://localhost:${PORT}/public/map`;
const results = [];
const consoleErrors = [];

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 }, // phone frame — the citizen surface
});
// Simulate a saved manual location BEFORE any page script runs.
await context.addInitScript(() => {
  try {
    localStorage.setItem(
      "citizen_location",
      JSON.stringify({
        type: "manual",
        district: "Patna",
        village: "Kankarbagh",
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {}
});
context.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
context.on("pageerror", (err) => consoleErrors.push("pageerror: " + err.message));

const page = await context.newPage();
await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
await page
  .waitForSelector(".maplibregl-canvas", { timeout: 30000 })
  .then(
    () => check("map canvas (.maplibregl-canvas) renders", true),
    () => check("map canvas (.maplibregl-canvas) renders", false, "not found"),
  );
await page.waitForTimeout(4000); // settle tiles + marker

// --- Step 1: zero chrome ---
const zoomCtrls = await page.$$eval(
  ".maplibregl-ctrl-zoom, button.maplibregl-ctrl-zoom-in, button.maplibregl-ctrl-zoom-out, .maplibregl-ctrl-scale",
  (els) => els.length,
);
check("no zoom controls / scale bar", zoomCtrls === 0, `found ${zoomCtrls}`);
const extraTools = await page.$$eval(
  "[class*=measure], [class*=draw-], [class*=layer-panel], [class*=search], [class*=navigation-control]",
  (els) => els.length,
);
check("no measure / draw / layer / search tools", extraTools === 0, `found ${extraTools}`);
// Only allowed maplibre control is the compact attribution.
const ctrls = await page.$$eval(".maplibregl-ctrl", (els) =>
  els.map((e) => (e.className || "").toString()).join(" | "),
);
check(
  "attribution is the only maplibre control",
  /attrib/.test(ctrls) && !/(zoom|scale)/.test(ctrls),
  `controls: "${ctrls || "none"}"`,
);

// --- Step 2: FAB ---
const fab = await page.$('button[aria-label="Recenter map on your location"]');
check("Locate Me FAB present", !!fab);
check("Locate Me FAB visible", fab ? await fab.isVisible() : false);

// --- Area chip ---
const chipText = await page.$$eval("p", (els) =>
  els.map((p) => (p.textContent || "").trim()).filter(Boolean).join(" | "),
);
check("area chip shows 'Kankarbagh, Patna'", chipText.includes("Kankarbagh, Patna"), `"${chipText}"`);

// --- Pulsing blue dot ---
const markers = await page.$$(".maplibregl-marker");
check("user-location marker present", markers.length >= 1, `${markers.length} marker(s)`);
let ping = false;
let dotColor = "";
if (markers.length) {
  ping = !!(await markers[0].$(".animate-ping"));
  dotColor = await markers[0].$eval("span span", (el) => getComputedStyle(el).backgroundColor).catch(() => "");
}
check("marker has pulsing ring (.animate-ping)", ping);
check("marker dot is blue", /rgb\(56, 189, 248\)|rgba\(56, 189, 248|rgb\(14, 165, 233\)/.test(dotColor), dotColor);

// --- BottomNav ---
const navText = await page.$$eval("a, button", (els) =>
  els
    .filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    })
    .map((e) => (e.textContent || "").trim().toUpperCase())
    .filter(Boolean),
);
check(
  "BottomNav has HOME ALERTS MAP SOS",
  ["HOME", "ALERTS", "MAP", "SOS"].every((t) => navText.join(" | ").includes(t)),
  [...new Set(navText)].join(", "),
);
check("Map tab marked active (aria-current)", !!(await page.$('[aria-current="page"]')));

// --- FAB recenter click ---
if (fab) {
  await fab.click();
  await page.waitForTimeout(2600); // flyTo is 1800ms
  check("FAB click does not crash", true, "map still alive");
}

// --- Visible text inventory (ground truth for the 'no extra chrome' claim) ---
const visibleText = await page.$$eval("body *", (els) =>
  els
    .filter((e) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
    })
    .map((e) => (e.textContent || "").trim())
    .filter((t) => t && t.length > 0 && t.length < 60),
);
check("visible text inventory", true, JSON.stringify([...new Set(visibleText)].slice(0, 25)));

check("zero console errors", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | ") || "none");

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
