// ---------------------------------------------------------------------
// lib/demo/reset-scenario.ts — Phase 15 · Step 3 (shared reset logic).
//
// The single source of truth for the demo "Hero Scenario". Used by BOTH:
//   • scripts/seed-demo.ts   — `npm run demo:reset` (CLI, prints summary)
//   • /api/demo/reset        — the Shift+0 hotkey calls this live
//
// Wipes all operational demo tables and injects the pitch scenario
// (Patna district, 3 villages, 5 shelters, 12 responders, 1 critical
// flood prediction, reports + pending allocations, alerts, closure).
//
// Phase 2 · Step 8 (Session isolation): every row is tagged
// `{ isDemo: true, sessionId }` and the wipe only ever touches demo rows
// (`where: { isDemo: true }`) — a reset can NEVER delete real ops data,
// and demo data is owned by a single demo session (the `demo_session_id`
// cookie UUID passed in by the API layer).
//
// UNTOUCHED: users (upserted by email, never deleted), alert_rules,
// alert_templates, emergency_documents, weather_data, data_source,
// push_subscriptions.
//
// IMPORTANT: the Prisma client is imported lazily INSIDE the function so
// the CLI wrapper's .env loader runs before the client is constructed
// (module-level imports would construct it too early).
// ---------------------------------------------------------------------

/** N hours from now — used for allocation ETAs. */
const inHours = (hours: number) => new Date(Date.now() + hours * 3_600_000);

/** N minutes from now — used for alert send times. */
const inMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000);

// The 12 responders — deterministic emails so re-seeding upserts instead
// of duplicating rows.
const RESPONDERS = [
  { name: "Sunita Das", team: "NDRF" },
  { name: "Ravi Kumar", team: "NDRF" },
  { name: "Meera Nair", team: "SDRF" },
  { name: "Arjun Singh", team: "SDRF" },
  { name: "Priya Lakra", team: "NDRF" },
  { name: "Vikram Yadav", team: "SDRF" },
  { name: "Anita Gupta", team: "Police" },
  { name: "Rahul Sharma", team: "NDRF" },
  { name: "Divya Patel", team: "Health" },
  { name: "Sanjay Kumar", team: "Fire" },
  { name: "Kavita Rao", team: "Health" },
  { name: "Mohammed Irfan", team: "SDRF" },
];

export type ResetScenarioResult = {
  wiped: number;
  disasterEventId: string;
  shelterIds: string[];
  responderCount: number;
  allocationCount: number;
};

/**
 * Wipe demo rows and re-seed the hero scenario. Throws when the database
 * is unreachable — callers decide whether to fail or mock.
 *
 * @param options.sessionId — the owning demo session UUID. When set, every
 *   seeded row carries it so `demoWhere()` scoping can hand the row only
 *   back to that exact session. null keeps rows session-orphaned (legacy
 *   CLI-driven seeds) — still `isDemo: true` and never visible to real
 *   users.
 */
export async function resetDemoScenario(options?: {
  sessionId?: string | null;
}): Promise<ResetScenarioResult> {
  // Lazy import — the CLI's .env loader must run first (see header note).
  const { prisma } = await import("../../server/prisma");
  const sessionId = options?.sessionId ?? null;
  const DEMO_TAG = { isDemo: true, sessionId };

  // 1. WIPE — dependency order (children before parents). Only ever demo
  // rows: `npm run demo:reset` must never delete real ops data.
  const wiped = await prisma.$transaction([
    prisma.resourceMovement.deleteMany({ where: { isDemo: true } }),
    prisma.resourceRequest.deleteMany({ where: { isDemo: true } }),
    prisma.planFeedback.deleteMany({ where: { isDemo: true } }),
    prisma.auditLog.deleteMany({ where: { isDemo: true } }),
    prisma.evacuationPlan.deleteMany({ where: { isDemo: true } }),
    prisma.roadClosure.deleteMany({ where: { isDemo: true } }),
    prisma.crowdsourcedReport.deleteMany({ where: { isDemo: true } }),
    prisma.alertLog.deleteMany({ where: { isDemo: true } }),
    prisma.emergencyPlan.deleteMany({ where: { isDemo: true } }),
    prisma.resourceAllocation.deleteMany({ where: { isDemo: true } }),
    prisma.floodPrediction.deleteMany({ where: { isDemo: true } }),
    prisma.disasterEvent.deleteMany({ where: { isDemo: true } }),
    prisma.resource.deleteMany({ where: { isDemo: true } }),
    prisma.shelter.deleteMany({ where: { isDemo: true } }),
  ]);
  const wipedTotal = wiped.reduce((sum, r) => sum + r.count, 0);

  // 2. SEED — the Hero Scenario.
  const disasterEvent = await prisma.disasterEvent.create({
    data: {
      ...DEMO_TAG,
      name: "Ganga Flood Emergency — Patna",
      type: "flood",
      status: "active",
      district: "Patna (Ganga)",
      startedAt: inHours(-6),
    },
  });

  await prisma.floodPrediction.create({
    data: {
      ...DEMO_TAG,
      lat: 25.5941,
      lng: 85.1376,
      predictionTimestamp: new Date(),
      riskLevel: "critical",
      confidenceScore: 0.92,
      rawModelOutput: { model: "xgboost", horizonHrs: 24, features: { riverLevelM: 49.8 } },
    },
  });

  const [shelterCentral, shelterRiverside, shelterHospital, shelterSampatchak, shelterPatliputra] =
    await Promise.all([
      prisma.shelter.create({
        data: {
          ...DEMO_TAG,
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
          ...DEMO_TAG,
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
          ...DEMO_TAG,
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
      prisma.shelter.create({
        data: {
          ...DEMO_TAG,
          name: "Sampatchak Relief Camp",
          district: "Patna (Ganga)",
          lat: 25.5743,
          lng: 85.1376,
          capacity: 250,
          currentOccupancy: 138,
          facilities: { water: true, food: true, medical: false, electricity: false },
          status: "open",
          contactPerson: "Nisha Verma",
          phone: "+91-90123-45678",
        },
      }),
      prisma.shelter.create({
        data: {
          ...DEMO_TAG,
          name: "Patliputra Sports Complex",
          district: "Patna (Ganga)",
          lat: 25.6125,
          lng: 85.145,
          capacity: 500,
          currentOccupancy: 0,
          facilities: { water: true, food: false, medical: true, electricity: true },
          status: "open",
          contactPerson: "Col. R. Mehta",
          phone: "+91-92222-33333",
        },
      }),
    ]);
  const shelterIds = [
    shelterCentral.id,
    shelterRiverside.id,
    shelterHospital.id,
    shelterSampatchak.id,
    shelterPatliputra.id,
  ];

  await Promise.all(
    RESPONDERS.map((r, i) =>
      prisma.user.upsert({
        where: { email: `responder${String(i + 1).padStart(2, "0")}@drip.gov.in` },
        update: {
          name: r.name,
          role: "field_responder",
          organization: r.team,
          assignedDistrict: "Patna (Ganga)",
        },
        create: {
          email: `responder${String(i + 1).padStart(2, "0")}@drip.gov.in`,
          name: r.name,
          role: "field_responder",
          organization: r.team,
          assignedDistrict: "Patna (Ganga)",
          // Valid 10-digit Indian mobile (90xxxxxxxxx) so responder detail
          // panels show realistic numbers to the judges.
          phone: `+91-${String(9000000000 + i * 111111)}`,
          isApproved: true,
        },
      }),
    ),
  );

  const [boats, medical, food, water, teams] = await Promise.all([
    prisma.resource.create({
      data: { ...DEMO_TAG, name: "Rescue Boats", category: "boat", quantity: 12, unit: "boats", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
    prisma.resource.create({
      data: { ...DEMO_TAG, name: "Medical First-Aid Kits", category: "medical", quantity: 40, unit: "kits", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
    prisma.resource.create({
      data: { ...DEMO_TAG, name: "Dry Food Packets", category: "food", quantity: 2000, unit: "packets", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
    prisma.resource.create({
      data: { ...DEMO_TAG, name: "Drinking Water Bottles", category: "water", quantity: 5000, unit: "bottles", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
    prisma.resource.create({
      data: { ...DEMO_TAG, name: "NDRF Rescue Team", category: "personnel", quantity: 6, unit: "teams", lat: 25.594, lng: 85.132, status: "available", depotName: "Sadar Depot" },
    }),
  ]);

  const allocationPlans = [
    { resource: boats, qty: 4, lat: 25.604, lng: 85.153, priority: 0.95, eta: 2 },
    { resource: medical, qty: 10, lat: 25.62, lng: 85.16, priority: 0.9, eta: 2.5 },
    { resource: food, qty: 500, lat: 25.61, lng: 85.1, priority: 0.82, eta: 3 },
    { resource: water, qty: 1200, lat: 25.63, lng: 85.14, priority: 0.78, eta: 3.5 },
    { resource: teams, qty: 2, lat: 25.595, lng: 85.145, priority: 0.97, eta: 1.5 },
  ];
  for (const plan of allocationPlans) {
    await prisma.resourceAllocation.create({
      data: {
        ...DEMO_TAG,
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

  await Promise.all([
    prisma.alertLog.create({
      data: {
        ...DEMO_TAG,
        severity: "critical",
        channel: "in_app",
        message:
          "⚠️ CRITICAL: Ganga water level at danger mark — evacuate floodplain villages in Patna immediately. Zones: Kankarbagh, Rajendra Nagar.",
        district: "Patna (Ganga)",
        triggerCondition: "critical_flood",
        sentAt: inMinutes(-8),
      },
    }),
    prisma.alertLog.create({
      data: {
        ...DEMO_TAG,
        severity: "watch",
        channel: "in_app",
        message: "🌊 Watch: river discharge rising near Patna. Monitor shelter occupancy.",
        district: "Patna (Ganga)",
        triggerCondition: "high_flood",
        sentAt: inMinutes(-25),
      },
    }),
  ]);

  await Promise.all([
    prisma.crowdsourcedReport.create({
      data: {
        ...DEMO_TAG,
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
        ...DEMO_TAG,
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
        ...DEMO_TAG,
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

  await Promise.all([
    prisma.evacuationPlan.create({
      data: {
        ...DEMO_TAG,
        villageName: "Kankarbagh Lowlands",
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
        ...DEMO_TAG,
        villageName: "Rajendra Nagar Basti",
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
    prisma.evacuationPlan.create({
      data: {
        ...DEMO_TAG,
        villageName: "Patliputra Colony",
        assignedShelterId: shelterPatliputra.id,
        shelterId: shelterPatliputra.id,
        estimatedEvacuees: 220,
        status: "pending",
        routeGeoJson: JSON.stringify({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [[85.145, 25.6125], [85.145, 25.6125]] },
        }),
      },
    }),
  ]);

  await prisma.roadClosure.create({
    data: {
      ...DEMO_TAG,
      lat: 25.613,
      lng: 85.102,
      reason: "Flooded road — Ashok Rajpath",
      isActive: true,
    },
  });

  return {
    wiped: wipedTotal,
    disasterEventId: disasterEvent.id,
    shelterIds,
    responderCount: RESPONDERS.length,
    allocationCount: allocationPlans.length,
  };
}
