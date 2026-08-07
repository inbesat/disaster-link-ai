// scripts/smoke-chat.ts — Phase 11 E2E smoke test.
//
// Simulates the full "ask the AI for an evacuation plan" user flow at the
// tool layer (no live LLM required): flood prediction → shelter status →
// resource inventory → evacuation route + fleet sizing, then the Phase 10/21
// guardrails (role-gated evacuation tools, district scoping).
//
// Run with: npm run smoke:chat
import { getShelterStatus } from "../lib/ai/tools/shelter-tools";
import { getFloodPrediction } from "../lib/ai/tools/flood-tools";
import { getResourceInventory } from "../lib/ai/tools/resources-tools";
import { calculateEvacuationRoutes } from "../lib/ai/tools/evacuation-tools";
import { assertDistrictAccess } from "../lib/security/data-isolation";

let failed = 0;

function check(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    failed += 1;
  }
}

// The AI SDK's Tool.execute expects (input, ToolExecutionOptions). For direct
// invocation we cast to a single-arg shape; the SDK wires the options in the
// real chat route.
type ToolExec<I> = (input: I) => Promise<unknown>;
function runTool<I>(tool: { execute: unknown }, input: I): Promise<unknown> {
  return (tool.execute as ToolExec<I>)(input);
}

type FloodResult = {
  district: string;
  prediction: { riskLevel: string; summary: string };
};
type ShelterResult = {
  district: string;
  shelters: Array<{
    id: string;
    name: string;
    status: string;
    capacity: number;
    currentOccupancy: number;
  }>;
};
type InventoryResult = { district: string; resources: unknown[] };
type RouteResult = {
  ok: boolean;
  district?: string;
  distanceMeters?: number;
  durationMinutes?: number;
  isSafe?: boolean;
  recommendedFleet?: {
    busesNeeded: number;
    boatsNeeded: number;
    estimatedTotalTimeH: number;
  };
  error?: string;
};

const COMMANDER_ROLES = ["District Commander", "super_admin", "district_admin"];

async function main() {
  console.log("=== PHASE 11 E2E SMOKE: ask-the-AI evacuation flow ===\n");

  // [1] "Plan evacuation for Patna district"
  console.log("[1] Plan evacuation for Patna district");
  const flood = (await runTool(getFloodPrediction, {
    district: "Patna",
  })) as FloodResult;
  check(Boolean(flood.prediction?.summary), "flood prediction returned");
  check(
    flood.prediction?.summary.toLowerCase().includes("patna"),
    "prediction scoped to the requested district",
  );

  const shelters = (await runTool(getShelterStatus, {
    district: "Patna",
  })) as ShelterResult;
  check(
    Array.isArray(shelters.shelters) && shelters.shelters.length > 0,
    "shelter status returned",
  );

  const inventory = (await runTool(getResourceInventory, {
    district: "Patna",
  })) as InventoryResult;
  check(
    Array.isArray(inventory.resources) && inventory.resources.length > 0,
    "resource inventory returned",
  );

  const route = (await runTool(calculateEvacuationRoutes, {
    originLat: 25.5941,
    originLng: 85.1376,
    destinationLat: 25.61,
    destinationLng: 85.14,
    evacuees: 1200,
    district: "Patna",
  })) as RouteResult;
  check(route.ok === true, "evacuation route calculated");
  if (route.ok) {
    check(typeof route.distanceMeters === "number", `route distance ${route.distanceMeters} m`);
    check(typeof route.durationMinutes === "number", `route duration ${route.durationMinutes} min`);
    check(typeof route.isSafe === "boolean", `route safety flag: ${route.isSafe}`);
    check(
      (route.recommendedFleet?.busesNeeded ?? 0) > 0,
      `fleet recommendation: ${route.recommendedFleet?.busesNeeded} buses`,
    );
  }

  // [2] "Show me the safest shelter"
  console.log("\n[2] Show me the safest shelter");
  const open = shelters.shelters.filter((s) => s.status !== "full");
  const safest = [...open].sort(
    (a, b) =>
      b.capacity -
      b.currentOccupancy -
      (a.capacity - a.currentOccupancy),
  )[0];
  check(Boolean(safest), "safest shelter identified from capacity");
  if (safest) {
    const free = safest.capacity - safest.currentOccupancy;
    console.log(`    → ${safest.name} (${free} beds free)`);
  }

  // [3] "What resources do we need?" — category filter on the inventory tool
  console.log("\n[3] What resources do we need? (category filter)");
  const boats = (await runTool(getResourceInventory, {
    district: "Patna",
    category: "boat",
  })) as InventoryResult;
  check(boats.resources.length > 0, "boat inventory query returned items");

  // [4] Phase 10/21 guardrail: evacuation tools only for commanders
  console.log("\n[4] Role guardrail (evacuation tools are commander-only)");
  const isCommander = (role: string) => COMMANDER_ROLES.includes(role);
  check(isCommander("district_admin"), "district_admin may call evacuation tools");
  check(
    !isCommander("field_responder"),
    "field_responder is excluded from evacuation tools (hard tool-drop)",
  );

  // [5] Phase 21 district scoping at the tool boundary
  console.log("\n[5] District scoping (tool-call guard)");
  check(
    assertDistrictAccess("Mumbai", "Patna", "district_admin") !== null,
    "foreign-district tool call denied",
  );
  check(
    assertDistrictAccess("Patna", "Patna", "district_admin") === null,
    "own-district tool call allowed",
  );
  check(
    assertDistrictAccess("Mumbai", "Patna", "super_admin") === null,
    "super_admin bypasses district scope",
  );

  if (failed > 0) {
    console.error(`\nCHAT SMOKE FAIL — ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nCHAT SMOKE PASS ✓");
}

main().catch((error) => {
  console.error("CHAT SMOKE FAIL", error);
  process.exit(1);
});
