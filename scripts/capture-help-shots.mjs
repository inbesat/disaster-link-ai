// ---------------------------------------------------------------------
// scripts/capture-help-shots.mjs — Help Center screenshot generator.
//
// Captures real screenshots of every page the Help Center references and
// writes them to public/help/shots/<topic-id>.webp.
//
// Usage:
//   1. Start the dev server:   npm run dev
//   2. In another terminal:    npm run help:shots
//
// Notes:
//   • Gov-protected routes are captured by injecting the demo session
//     cookies directly (role=district_admin + guest_mode) — no login flow
//     needed, exactly mirroring how middleware admits demo sessions.
//   • Each route waits for network idle plus a settle delay so MapLibre
//     tiles and Recharts renders finish before the shutter fires.
//   • One broken route never kills the batch — failures are logged and
//     summarized at the end (the Help UI shows a styled "screenshot
//     pending" placeholder for any missing file).
// ---------------------------------------------------------------------

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const BASE_URL = process.env.HELP_SHOTS_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.resolve("public/help/shots");
const VIEWPORT = { width: 1280, height: 800, deviceScaleFactor: 2 };
const SETTLE_MS = Number(process.env.HELP_SHOTS_SETTLE_MS ?? 2500);

/** topicId → route. Keys MUST match lib/help-content.ts image fields.
 *  Map/chart-heavy routes get a longer settle so tiles finish rendering. */
const SHOTS = [
  // ---- Citizen portal ----
  { id: "landing", route: "/" },
  { id: "citizen-dashboard", route: "/public/dashboard" },
  { id: "send-sos", route: "/sos" },
  { id: "citizen-alerts", route: "/public/alerts" },
  { id: "citizen-map", route: "/public/map", settleMs: 6000 },
  { id: "report-issue", route: "/report" },
  { id: "nova-ai-chat", route: "/public/ai" },
  // ---- Account & access ----
  { id: "gov-login", route: "/login?mode=gov" },
  { id: "request-access", route: "/gov/signup" },
  // ---- Gov portal ----
  { id: "command-center-dashboard", route: "/gov/dashboard", settleMs: 6000 },
  { id: "operations-overview", route: "/dashboard", settleMs: 5000 },
  { id: "live-map", route: "/command-center", settleMs: 6000 },
  { id: "ai-planner", route: "/ai-planner", settleMs: 4000 },
  { id: "alerts-console", route: "/alerts" },
  { id: "access-requests", route: "/access-requests" },
  { id: "shelters", route: "/shelters" },
];

const DEMO_COOKIES = [
  { name: "role", value: "district_admin", domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  { name: "guest_mode", value: "true", domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
];

async function waitForServer(url, tries = 30) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 600) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function main() {
  console.log(`[help-shots] target: ${BASE_URL}`);
  const serverUp = await waitForServer(BASE_URL);
  if (!serverUp) {
    console.error(
      `[help-shots] ✖ dev server not reachable at ${BASE_URL}. Start it first: npm run dev`,
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  // Cookie domain must match the host we browse (localhost vs 127.0.0.1).
  const host = new URL(BASE_URL).hostname;
  const cookies = DEMO_COOKIES.map((c) => ({ ...c, domain: host }));

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-color-profile=srgb"],
  });

  /** Existing shots let us skip re-captures unless HELP_SHOTS_FORCE=1 */
  const existing = new Set(await readdir(OUT_DIR).catch(() => []));
  const force = process.env.HELP_SHOTS_FORCE === "1";

  // Optional subset: npm run help:shots -- --only=send-sos,live-map
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.split("=")[1].split(",").map((s) => s.trim()) : null;

  const results = { ok: [], skipped: [], failed: [] };

  try {
    for (const shot of SHOTS) {
      if (only && !only.includes(shot.id)) continue;
      const file = `${shot.id}.webp`;
      if (!force && existing.has(file)) {
        results.skipped.push(file);
        continue;
      }

      const page = await browser.newPage();
      try {
        await page.setViewport(VIEWPORT);
        await page.setCookie(...cookies);

        // NOTE: domcontentloaded (NOT networkidle) — this app holds
        // persistent sockets (Supabase realtime, analytics beacons), so
        // the network never goes fully idle and networkidle* hangs.
        await page.goto(`${BASE_URL}${shot.route}`, {
          waitUntil: "domcontentloaded",
          timeout: 120_000,
        });
        // Settle window: fonts, map tiles, chart renders.
        await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
        await new Promise((r) => setTimeout(r, shot.settleMs ?? SETTLE_MS));

        // Clean-UI pass (HELP_SHOTS_CLEAN_UI=0 to keep dev overlays).
        // Dev-only floaters — Demo Orchestrator, Support FAB, Simulation
        // toggle, toasts, network widget — all mount as position:fixed
        // children of <body>. Hiding exactly those gives clean product
        // shots without touching the app shell itself.
        if (process.env.HELP_SHOTS_CLEAN_UI !== "0") {
          await page.evaluate(() => {
            // Next.js dev-error badge lives in <nextjs-portal> shadow DOM.
            document.querySelectorAll("nextjs-portal").forEach((el) => el.remove());
            // Dev-only floaters mount as position:fixed children of <body>.
            document.querySelectorAll("body > *").forEach((el) => {
              const cs = getComputedStyle(el);
              if (cs.position === "fixed") el.style.display = "none";
            });
          });
          await new Promise((r) => setTimeout(r, 150));
        }

        await page.screenshot({
          path: path.join(OUT_DIR, file),
          type: "webp",
          quality: 82,
        });
        results.ok.push(file);
        console.log(`[help-shots] ✓ ${file}  ← ${shot.route}`);
      } catch (error) {
        results.failed.push({ file: shot.id, route: shot.route });
        console.warn(
          `[help-shots] ✖ ${shot.id} (${shot.route}): ${error.message.split("\n")[0]}`,
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log(
    `\n[help-shots] done — ${results.ok.length} captured · ` +
      `${results.skipped.length} skipped (already exist, use HELP_SHOTS_FORCE=1 to redo) · ` +
      `${results.failed.length} failed`,
  );
  if (results.failed.length > 0) {
    console.table(results.failed);
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error("[help-shots] fatal:", error);
  process.exit(1);
});
