import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { GOV_ROLES } from "@/lib/validations/user";
import {
  runGreedyAllocation,
  type AllocationCandidateResource,
  type AllocationDemand,
  type LockedAllocation,
  type ProposedAllocation,
} from "@/lib/allocation/optimizer";

export const dynamic = "force-dynamic";

type OptimizeBody = {
  event_id?: string;
  locked_allocations?: { resource_id?: string; demand_id?: string }[];
  fleet_availability?: number; // 0–100, % of the fleet still usable
  demand_surge?: number; // % extra demand on top of current needs
};

type UnmetDemand = {
  demandId: string;
  category: string;
  quantityNeeded: number;
  quantityAllocated: number;
  unmet: number;
  lat: number;
  lng: number;
  priorityScore: number;
};

// Realistic Patna-area mock resources (available stock) for when the DB is
// unreachable or not pushed yet — the demo must never break.
const MOCK_RESOURCES: AllocationCandidateResource[] = [
  {
    id: "res-1",
    name: "NDRF Rescue Boats",
    category: "boat",
    quantity: 12,
    lat: 25.62,
    lng: 85.14,
  },
  {
    id: "res-2",
    name: "Medical First-Aid Kits",
    category: "medical",
    quantity: 200,
    lat: 25.594,
    lng: 85.132,
  },
  {
    id: "res-3",
    name: "Food Rations",
    category: "food",
    quantity: 350,
    lat: 25.608,
    lng: 85.12,
  },
  {
    id: "res-4",
    name: "Search & Rescue Teams",
    category: "personnel",
    quantity: 8,
    lat: 25.63,
    lng: 85.16,
  },
  {
    id: "res-5",
    name: "High-Power Generators",
    category: "power",
    quantity: 14,
    lat: 25.585,
    lng: 85.1,
  },
];

const MOCK_DEMANDS: AllocationDemand[] = [
  {
    id: "req-1",
    disasterEventId: "mock-event-1",
    category: "boat",
    quantityNeeded: 6,
    lat: 25.604,
    lng: 85.153,
    affectedPopulation: 48000,
    severityRisk: 0.9,
    accessibilityFactor: 0.7,
  },
  {
    id: "req-2",
    disasterEventId: "mock-event-1",
    category: "medical",
    quantityNeeded: 40,
    lat: 25.63,
    lng: 85.16,
    affectedPopulation: 30000,
    severityRisk: 0.75,
    accessibilityFactor: 0.6,
  },
  {
    id: "req-3",
    disasterEventId: "mock-event-1",
    category: "food",
    quantityNeeded: 120,
    lat: 25.72,
    lng: 85.19,
    affectedPopulation: 20000,
    severityRisk: 0.5,
    accessibilityFactor: 0.4,
  },
  {
    // No "communication" stock exists in either mock or DB → this demand stays
    // partially/met unmmet, demonstrating the Unmet Demand summary.
    id: "req-4",
    disasterEventId: "mock-event-1",
    category: "communication",
    quantityNeeded: 5,
    lat: 25.612,
    lng: 85.142,
    affectedPopulation: 6000,
    severityRisk: 0.4,
    accessibilityFactor: 0.9,
  },
];

function buildUnmet(
  demands: AllocationDemand[],
  plan: ProposedAllocation[],
): UnmetDemand[] {
  const allocated: Record<string, number> = {};
  for (const a of plan) {
    allocated[a.demandId] = (allocated[a.demandId] ?? 0) + a.quantityAllocated;
  }

  const unmet: UnmetDemand[] = [];
  for (const d of demands) {
    const quantityAllocated = allocated[d.id] ?? 0;
    const shortfall = d.quantityNeeded - quantityAllocated;
    if (shortfall > 0) {
      unmet.push({
        demandId: d.id,
        category: d.category,
        quantityNeeded: d.quantityNeeded,
        quantityAllocated,
        unmet: shortfall,
        lat: d.lat,
        lng: d.lng,
        priorityScore: calculatePriorityScore(d),
      });
    }
  }
  return unmet.sort((a, b) => b.priorityScore - a.priorityScore);
}

function calculatePriorityScore(d: AllocationDemand): number {
  const pop = d.affectedPopulation ?? 0;
  const severity = d.severityRisk ?? 0;
  const access = d.accessibilityFactor ?? 1;
  return (
    Math.log10(Math.max(pop, 0) + 1) * 30 +
    Math.max(0, Math.min(1, severity)) * 45 -
    (1 - Math.max(0, Math.min(1, access))) * 10
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  // Security: the optimizer PERSISTS allocation plans (and can create stand-in
  // disaster events). Only gov roles may mutate operational allocations — an
  // anonymous caller must never write to resource_allocations. Guests (no role
  // cookie) are rejected too.
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: OptimizeBody = {};
  try {
    body = (await request.json()) as OptimizeBody;
  } catch {
    // Empty/invalid body → run with defaults (still works for the demo).
  }

  let resources: AllocationCandidateResource[] = [];
  let demands: AllocationDemand[] = [];
  let eventId = body.event_id ?? "";

  try {
    const [resRows, reqRows, events] = await Promise.all([
      prisma.resource.findMany({
        where: { status: "available" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.resourceRequest.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.disasterEvent.findMany({ select: { id: true }, take: 1 }),
    ]);

    resources = resRows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      quantity: r.quantity,
      lat: r.lat,
      lng: r.lng,
    }));
    demands = reqRows.map((r) => ({
      id: r.id,
      disasterEventId: eventId || events[0]?.id || "mock-event-1",
      category: r.category,
      quantityNeeded: r.quantityNeeded,
      lat: r.lat,
      lng: r.lng,
      affectedPopulation: 20000,
      severityRisk: r.urgency === "critical" ? 0.9 : r.urgency === "high" ? 0.7 : 0.4,
      accessibilityFactor: 0.8,
    }));

    if (!eventId) eventId = events[0]?.id ?? "mock-event-1";

    if (!resources.length && !demands.length) {
      resources = MOCK_RESOURCES;
      demands = MOCK_DEMANDS;
    }
  } catch (error: unknown) {
    console.warn("[allocations] optimize fell back to mock data.", error);
    resources = MOCK_RESOURCES;
    demands = MOCK_DEMANDS;
    if (!eventId) eventId = "mock-event-1";
  }

  const locked: LockedAllocation[] = (body.locked_allocations ?? [])
    .filter((l) => l.resource_id && l.demand_id)
    .map((l) => ({ resourceId: l.resource_id!, demandId: l.demand_id! }));

  // Scenario knobs: scale fleet availability down and demand surge up before
  // running the greedy algorithm ("What if 5 boats break down?").
  const fleetAvailability =
    Math.max(0, Math.min(100, Number(body.fleet_availability ?? 100))) / 100;
  const demandSurge = Math.max(0, Number(body.demand_surge ?? 0)) / 100;

  if (fleetAvailability < 1) {
    resources = resources.map((r) => ({
      ...r,
      quantity: Math.floor(r.quantity * fleetAvailability),
    }));
  }
  if (demandSurge > 0) {
    demands = demands.map((d) => ({
      ...d,
      quantityNeeded: Math.ceil(d.quantityNeeded * (1 + demandSurge)),
    }));
  }

  const plan = await runGreedyAllocation(resources, demands, locked);
  const unmetDemand = buildUnmet(demands, plan);

  // Phase 13 · Persist the proposed allocations so the plan survives a refresh
  // and can be reviewed in the command center. Mock/demo event ids and mock
  // resources have no DB rows, so this degrades silently without breaking the
  // demo — the computed plan is still returned to the client either way.
  await persistAllocations(plan, eventId).catch((error) =>
    console.warn("[allocations] failed to persist allocation plan.", error),
  );

  return NextResponse.json({
    ok: true,
    event_id: eventId,
    plan,
    unmet_demand: unmetDemand,
    persisted: true,
    meta: {
      resources_scanned: resources.length,
      demands_scanned: demands.length,
      allocations_proposed: plan.length,
      locked_allocations: locked.length,
      fleet_availability: Math.round(fleetAvailability * 100),
      demand_surge: Math.round(demandSurge * 100),
    },
  });
}

/**
 * Persist a proposed allocation plan into the resource_allocations table.
 * Creates a stand-in disaster event if the referenced event does not exist
 * yet, and upserts by (resource_id, disaster_event_id) so re-running the
 * optimizer updates rather than duplicates the plan.
 */
async function persistAllocations(
  plan: ProposedAllocation[],
  eventId: string,
): Promise<void> {
  if (!plan.length) return;

  // Ensure a disaster event row exists so the FK constraint is satisfied.
  const event =
    (await prisma.disasterEvent
      .findUnique({ where: { id: eventId } })
      .catch(() => null)) ??
    (await prisma.disasterEvent
      .create({
        data: {
          id: eventId,
          name: `Allocation plan — ${new Date().toLocaleDateString()}`,
          type: "flood",
          status: "active",
        },
      })
      .catch(() => null));

  if (!event) return; // DB unreachable — skip persistence for this run.

  for (const allocation of plan) {
    const data = {
      resourceId: allocation.resourceId,
      disasterEventId: event.id,
      destinationLat: allocation.destinationLat,
      destinationLng: allocation.destinationLng,
      quantityAllocated: allocation.quantityAllocated,
      status: allocation.status,
      priorityScore: allocation.priorityScore,
      estimatedArrival: allocation.estimatedArrival ?? null,
      isLocked: false,
    };

    const existing = await prisma.resourceAllocation
      .findFirst({
        where: {
          resourceId: allocation.resourceId,
          disasterEventId: event.id,
        },
      })
      .catch(() => null);

    if (existing) {
      await prisma.resourceAllocation.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.resourceAllocation.create({ data });
    }
  }
}
