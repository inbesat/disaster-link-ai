/**
 * Demo Data Seeder / Reset Switch (Phase 15 · Step 1)
 * ------------------------------------------------------------------
 * CLI entry point for `npm run demo:reset`. All wipe + seed logic lives
 * in lib/demo/reset-scenario.ts (shared with the Shift+0 hotkey's
 * /api/demo/reset endpoint) — this file only loads the environment and
 * prints the summary.
 *
 * Run:
 *   npx tsx scripts/seed-demo.ts
 *   (or) npm run demo:reset
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------
// Minimal .env loader (zero dependencies). Must run BEFORE the shared
// module is invoked, because the Prisma client is constructed lazily
// inside resetDemoScenario() — so env vars are present by then.
// ---------------------------------------------------------------------
function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnv();

async function main() {
  console.log("🎬 DRIP demo seeder — resetting to Hero Scenario…\n");

  // Dynamic import keeps the module-level env loader above in charge.
  const { resetDemoScenario } = await import("../lib/demo/reset-scenario");
  const result = await resetDemoScenario();

  console.log(`   Deleted ${result.wiped} rows across operational tables.`);
  console.log("\n🌊 Hero Scenario injected:");
  console.log("   ✔ District:          Patna (Ganga)");
  console.log("   ✔ Disaster event:    Ganga Flood Emergency — Patna (active)");
  console.log("   ✔ Flood prediction:  1 critical (confidence 92%)");
  console.log("   ✔ Villages:          3 (Kankarbagh, Rajendra Nagar, Patliputra)");
  console.log("   ✔ Shelters:          5 (Central 450 · Riverside 380 FULL · Hospital 300 · Sampatchak 250 · Patliputra 500)");
  console.log(`   ✔ Responders:        ${result.responderCount} field responders seeded`);
  console.log("   ✔ Resources:         5 (boats, medical, food, water, NDRF teams)");
  console.log(`   ✔ Allocations:       ${result.allocationCount} pending`);
  console.log("   ✔ Alerts:            2 (critical + watch)");
  console.log("   ✔ Ground reports:    3 (2 verified, 1 unverified)");
  console.log("   ✔ Road closures:     1 active");
  console.log("\n✅ Hero Scenario ready for the judges. 🚀");
}

main().catch(async (error) => {
  console.error("\n❌ Demo seeder failed:", error);
  process.exit(1);
});
