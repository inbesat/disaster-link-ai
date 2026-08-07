// Test: verifies getSafeWeatherData() gracefully returns synthetic data
// when the upstream pipeline is unavailable (simulated with a bad API key
// and an unreachable internal route).
import { getSafeWeatherData } from "../lib/data-ingestion/fetcher";

// Force the internal routes to be unreachable so the live path fails.
process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:9";
process.env.OPENWEATHER_API_KEY = "INVALID_KEY_FOR_TEST";

async function main() {
  console.log("Testing ingestion fallback with an intentionally broken API key...");
  console.log("  OPENWEATHER_API_KEY =", process.env.OPENWEATHER_API_KEY);

  const start = Date.now();
  const result = await getSafeWeatherData(25.5941, 85.1376);
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);

  console.log("\nResult:");
  console.log("  source:", result.source);
  console.log("  rainfall_mm:", result.rainfall_mm);
  console.log("  river_level_m:", result.river_level_m);
  console.log("  river_discharge_m3s:", result.river_discharge_m3s);
  console.log("  district:", result.district);
  console.log("  elapsed:", `${elapsed}s`);

  const passed =
    result.source === "synthetic" &&
    Number.isFinite(result.rainfall_mm) &&
    result.rainfall_mm >= 0 &&
    result.rainfall_mm <= 1000 &&
    typeof result.river_discharge_m3s === "number";

  console.log(passed ? "\nPASS: fallback returned valid synthetic data." : "\nFAIL");
  process.exit(passed ? 0 : 1);
}

main().catch((error) => {
  console.error("Unexpected crash (fallback did NOT protect us):", error);
  process.exit(1);
});
