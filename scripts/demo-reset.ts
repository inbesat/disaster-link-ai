/**
 * Demo Reset / Hero Scenario Seeder (Phase 23 · Step 3)
 * ------------------------------------------------------------------
 * Wipes operational demo tables, then injects a deterministic "Hero
 * Scenario" for the judge pitch:
 *
 *   • 1 critical Flood Prediction for Patna (Ganga)
 *   • 1 active disaster event ("Ganga Flood Emergency — Patna")
 *   • 3 shelters (open / full / open) matching the map's demo markers
 *   • 5 depot resources + 5 pending resource allocations
 *   • 2 alert logs, 3 ground reports, 2 evacuation plans, 1 road closure
 *
 * Untouched (production/config content): users, alert_rules,
 * alert_templates, emergency_documents (RAG KB), weather_data,
 * data_source, push_subscriptions.
 *
 * Run:
 *   npx tsx scripts/demo-reset.ts
 *   (or) npm run demo:reset
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------
// Minimal .env loader (zero dependencies). Runs BEFORE the Prisma client
// is imported so DATABASE_URL / DIRECT_URL are available at construction.
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

/** N hours from now — used for allocation ETAs. */
const inHours = (hours: number) => new Date(Date.now() + hours * 3_600_000);

async function main() {
  const { prisma } = await import("../server/prisma");

  console.log("🌊 DRIP demo reset — wiping operational tables…\n");

  // -------------------------------------------------------------------
  // 1. WIPE — dependency order (children before parents).
  // -------------------------------------------------------------------
  const wiped = await prisma.$transaction([
    prisma.resourceMovement.deleteMany(),
    prisma.resourceRequest.deleteMany(),
    prisma.planFeedback.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.evacuationPlan.deleteMany(),
    prisma.roadClosure.deleteMany(),
    prisma.crowdsourcedReport.deleteMany(),
    prisma.alertLog.deleteMany(),
    prisma.emergencyPlan.deleteMany(),
    prisma.resourceAllocation.deleteMany(),
    prisma.floodPrediction.deleteMany(),
    prisma.disasterEvent.deleteMany(),
    prisma.resource.deleteMany(),
    prisma.shelter.deleteMany(),
  ]);

  const wipedTotal = wiped.reduce((sum, r) => sum + r.count, 0);
  console.log(`   Deleted ${wipedTotal} rows across ${wiped.length} tables.`);

  // -------------------------------------------------------------------
  // 2. SEED — the Hero Scenario.
  // -------------------------------------------------------------------
  console.log("\n🚨 Injecting Hero Scenario…\n");

  // Active disaster event (required by resource_allocations FK).
  const disasterEvent = await prisma.disasterEvent.create({
    data: {
      name: "Ganga Flood Emergency — Patna",
      type: "flood",
      status: "active",
      district: "Patna (Ganga)",
      startedAt: inHours(-6),
    },
  });

  // Critical ML flood prediction (drives the map risk banner + alerts).
  await prisma.floodPrediction.create({
    data: {
      lat: 25.5941,
      lng: 85.1376,
      predictionTimestamp: new Date(),
      riskLevel: "critical",
      confidenceScore: 0.92,
    },
  });

  // 3 shelters — same names/coords as the map's SHELTER_MOCK so the
  // database replaces the mock seamlessly.
  const [shelterCentral, shelterRiverside, shelterHospital] = await Promise.all([
    prisma.shelter.create({
      data: {
        name: "Central Community Hall",
        district: "Patna (Ganga)",
        lat: 25.6,
        lng: 85.14,
        capacity: 450,
        currentOccupancy: 312,
        facilities: { water: true, food: true, medical: true, electricity: true },
        status: "open",
        contactPerson: "Ramesh Kumar",
        phone: "+91-98765-43210",
      },
    }),
    prisma.shelter.create({
      data: {
        name: "Riverside High School",
        district: "Patna (Ganga)",
        lat: 25.585,
        lng: 85.13,
        capacity: 380,
        currentOccupancy: 380,
        facilities: { water: true, food: true, medical: false, electricity: true },
        status: "full",
        contactPerson: "Sunita Devi",
        phone: "+91-91234-56780",
      },
    }),
    prisma.shelter.create({
      data: {
        name: "District Hospital Annex",
        district: "Patna (Ganga)",
        lat: 25.608,
        lng: 85.12,
        capacity: 300,
        currentOccupancy: 94,
        facilities: { water: true, food: false, medical: true, electricity: true },
        status: "open",
        contactPerson: "Dr. A. Sharma",
        phone: "+91-90000-11111",
      },
    }),
  ]);

  // 5 depot resources backing the allocations below.
  const [boats, medical, food, water, teams] = await Promise.all([
    prisma.resource.create({
      data: { name: "Rescue Boats", category: "boat", quantity: 12, unit: "boats", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
    prisma.resource.create({
      data: { name: "Medical First-Aid Kits", category: "medical", quantity: 40, unit: "kits", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
    prisma.resource.create({
      data: { name: "Dry Food Packets", category: "food", quantity: 2000, unit: "packets", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
    prisma.resource.create({
      data: { name: "Drinking Water Bottles", category: "water", quantity: 5000, unit: "bottles", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
    prisma.resource.create({
      data: { name: "NDRF Rescue Team", category: "personnel", quantity: 6, unit: "teams", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
  ]);

  // 5 pending resource allocations — varied destinations & priorities.
  const allocationPlans = [
    { resource: boats, qty: 4, lat: 25.604, lng: 85.153, priority: 0.95, eta: 2 }, // Kankarbagh
    { resource: medical, qty: 10, lat: 25.62, lng: 85.16, priority: 0.9, eta: 2.5 },
    { resource: food, qty: 500, lat: 25.61, lng: 85.1, priority: 0.82, eta: 3 },
    { resource: water, qty: 1200, lat: 25.63, lng: 85.14, priority: 0.78, eta: 3.5 },
    { resource: teams, qty: 2, lat: 25.595, lng: 85.145, priority: 0.97, eta: 1.5 }, // Rajendra Nagar
  ];

  for (const plan of allocationPlans) {
    await prisma.resourceAllocation.create({
      data: {
        resourceId: plan.resource.id,
        disasterEventId: disasterEvent.id,
        destinationLat: plan.lat,
        destinationLng: plan.lng,
        quantityAllocated: plan.qty,
        status: "pending",
        priorityScore: plan.priority,
        estimatedArrival: inHours(plan.eta),
      },
    });
  }

  // 2 alert logs — one critical (lights up the ticker + notification
  // center), one watch-tier. The AlertSimulator still forces new ones.
  await Promise.all([
    prisma.alertLog.create({
      data: {
        severity: "critical",
        channel: "in_app",
        message:
          "⚠️ CRITICAL: Ganga water level at danger mark — evacuate floodplain villages in Patna immediately. Zones: Kankarbagh, Rajendra Nagar.",
        district: "Patna (Ganga)",
        triggerCondition: "critical_flood",
      },
    }),
    prisma.alertLog.create({
      data: {
        severity: "watch",
        channel: "in_app",
        message: "🌊 Watch: river discharge rising near Patna. Monitor shelter occupancy.",
        district: "Patna (Ganga)",
        triggerCondition: "high_flood",
      },
    }),
  ]);

  // 3 ground reports — 2 verified + 1 unverified ("?" marker demo).
  await Promise.all([
    prisma.crowdsourcedReport.create({
      data: {
        lat: 25.606,
        lng: 85.152,
        reportType: "flooding",
        source: "app",
        rawText: "Water entered ground floor of houses near Kankarbagh bridge.",
        confidenceScore: 0.85,
        verificationStatus: "verified",
      },
    }),
    prisma.crowdsourcedReport.create({
      data: {
        lat: 25.615,
        lng: 85.098,
        reportType: "road_blocked",
        source: "social",
        rawText: "Ashok Rajpath under water, vehicles stalled.",
        confidenceScore: 0.7,
        verificationStatus: "verified",
      },
    }),
    prisma.crowdsourcedReport.create({
      data: {
        lat: 25.62,
        lng: 85.12,
        reportType: "rescue",
        source: "app",
        rawText: "Family stranded on rooftop near Patna University.",
        confidenceScore: 0.6,
        verificationStatus: "unverified",
      },
    }),
  ]);

  // 2 evacuation plans (populate the evacuations page + map routes).
  await Promise.all([
    prisma.evacuationPlan.create({
      data: {
        villageName: "Ganga Floodplain Village",
        assignedShelterId: shelterCentral.id,
        shelterId: shelterCentral.id,
        estimatedEvacuees: 150,
        status: "in_transit",
        routeGeoJson: JSON.stringify({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [[85.1376, 25.5941], [85.14, 25.6]] },
        }),
      },
    }),
    prisma.evacuationPlan.create({
      data: {
        villageName: "Kankarbagh North",
        assignedShelterId: shelterHospital.id,
        shelterId: shelterHospital.id,
        estimatedEvacuees: 90,
        status: "pending",
        routeGeoJson: JSON.stringify({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [[85.153, 25.604], [85.12, 25.608]] },
        }),
      },
    }),
  ]);

  // 1 active road closure — lets judges demo the reroute flow.
  await prisma.roadClosure.create({
    data: {
      lat: 25.613,
      lng: 85.102,
      reason: "Flooded road — Ashok Rajpath",
      isActive: true,
    },
  });

  // -------------------------------------------------------------------
  // 3. SUMMARY.
  // -------------------------------------------------------------------
  console.log("   ✔ Disaster event:     Ganga Flood Emergency — Patna (active)");
  console.log("   ✔ Flood prediction:   1 critical (confidence 92%)");
  console.log("   ✔ Shelters:           3 (Central Hall open · Riverside full · Hospital open)");
  console.log("   ✔ Resources:          5 (boats, medical, food, water, NDRF teams)");
  console.log("   ✔ Allocations:        5 pending");
  console.log("   ✔ Alerts:             2 (critical + watch)");
  console.log("   ✔ Ground reports:     3 (2 verified, 1 unverified)");
  console.log("   ✔ Evacuation plans:   2");
  console.log("   ✔ Road closures:      1 active");
  console.log("\n✅ Hero Scenario ready for the judges. 🚀");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("\n❌ Demo reset failed:", error);
  process.exit(1);
});
