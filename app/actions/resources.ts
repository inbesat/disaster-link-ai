"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/prisma";

// ---------------------------------------------------------------------
// Types (mirror the Prisma models so the UI can use one shape everywhere).
// ---------------------------------------------------------------------
export type InventoryResource = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string | null;
  lat: number;
  lng: number;
  status: string;
  depotName: string | null;
  createdAt?: string;
};

export type ResourceRequest = {
  id: string;
  requestedBy: string;
  category: string;
  quantityNeeded: number;
  urgency: string;
  lat: number;
  lng: number;
  status: string;
  createdAt?: string;
};

// ---------------------------------------------------------------------
// Mock fallbacks — used whenever the database is unreachable / not pushed,
// so the Resource Inventory demo never breaks (hackathon DB bypass).
// Coordinates are real Patna-area lat/lng so they can sit on the map.
// ---------------------------------------------------------------------
const MOCK_INVENTORY: InventoryResource[] = [
  {
    id: "res-1",
    name: "NDRF Rescue Boats",
    category: "boat",
    quantity: 12,
    unit: "boats",
    lat: 25.62,
    lng: 85.14,
    status: "available",
    depotName: "Patna NDRF Depot",
  },
  {
    id: "res-2",
    name: "Medical First-Aid Kits",
    category: "medical",
    quantity: 200,
    unit: "kits",
    lat: 25.594,
    lng: 85.132,
    status: "deployed",
    depotName: "Sadar Hospital Depot",
  },
  {
    id: "res-3",
    name: "Bottled Water Pallets",
    category: "water",
    quantity: 350,
    unit: "pallets",
    lat: 25.608,
    lng: 85.12,
    status: "available",
    depotName: "Gandhi Maidan Store",
  },
  {
    id: "res-4",
    name: "Search & Rescue Teams",
    category: "personnel",
    quantity: 8,
    unit: "teams",
    lat: 25.63,
    lng: 85.16,
    status: "deployed",
    depotName: "Danapur Unit",
  },
  {
    id: "res-5",
    name: "High-Power Generators",
    category: "power",
    quantity: 14,
    unit: "units",
    lat: 25.585,
    lng: 85.1,
    status: "maintenance",
    depotName: "Rajendra Nagar Yard",
  },
];

const MOCK_REQUESTS: ResourceRequest[] = [
  {
    id: "req-1",
    requestedBy: "Kankarbagh Ward Officer",
    category: "boat",
    quantityNeeded: 6,
    urgency: "critical",
    lat: 25.604,
    lng: 85.153,
    status: "pending",
  },
  {
    id: "req-2",
    requestedBy: "Phaganpur Field Responder",
    category: "medical",
    quantityNeeded: 40,
    urgency: "high",
    lat: 25.63,
    lng: 85.16,
    status: "pending",
  },
  {
    id: "req-3",
    requestedBy: "Sonepur Relief Camp",
    category: "food",
    quantityNeeded: 120,
    urgency: "low",
    lat: 25.72,
    lng: 85.19,
    status: "pending",
  },
];

/**
 * Fetch the full resource inventory. Falls back to 5 realistic mock items
 * (spread across available/deployed/maintenance) if the DB is unreachable.
 */
export async function getInventory(): Promise<InventoryResource[]> {
  try {
    const rows = await prisma.resource.findMany({ orderBy: { createdAt: "desc" } });
    if (!rows.length) return MOCK_INVENTORY;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      quantity: r.quantity,
      unit: r.unit,
      lat: r.lat,
      lng: r.lng,
      status: r.status,
      depotName: r.depotName,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.warn("[resources] getInventory fell back to mock data.", error);
    return MOCK_INVENTORY;
  }
}

/**
 * Fetch pending field resource requests. Falls back to 3 mock requests
 * if the DB is unreachable.
 */
export async function getPendingRequests(): Promise<ResourceRequest[]> {
  try {
    const rows = await prisma.resourceRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    if (!rows.length) return MOCK_REQUESTS;
    return rows.map((r) => ({
      id: r.id,
      requestedBy: r.requestedBy,
      category: r.category,
      quantityNeeded: r.quantityNeeded,
      urgency: r.urgency,
      lat: r.lat,
      lng: r.lng,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.warn("[resources] getPendingRequests fell back to mock data.", error);
    return MOCK_REQUESTS;
  }
}

export type NewResourceRequest = {
  category: string;
  quantity: number;
  urgency: string;
  lat: number;
  lng: number;
};

/**
 * Create a new field resource request. Falls back to a mock success (with a
 * fake id) if the DB is unreachable, so the mobile demo always works.
 */
export async function submitResourceRequest(
  input: NewResourceRequest,
): Promise<{ ok: boolean; id: string }> {
  try {
    const created = await prisma.resourceRequest.create({
      data: {
        requestedBy: "Field Responder",
        category: input.category,
        quantityNeeded: input.quantity,
        urgency: input.urgency,
        lat: input.lat,
        lng: input.lng,
        status: "pending",
      },
    });
    revalidatePath("/dispatch");
    return { ok: true, id: created.id };
  } catch (error) {
    console.warn("[resources] submitResourceRequest fell back to mock success.", error);
    return { ok: true, id: `mock-${Date.now()}` };
  }
}

export type CsvResourceRow = {
  name: string;
  category: string;
  quantity: number;
  lat: number;
  lng: number;
};

/**
 * Bulk-import resources from a parsed CSV. Falls back to a mock success on DB
 * failure so the uploader demo always completes.
 */
export async function bulkImportResources(
  rows: CsvResourceRow[],
): Promise<{ ok: boolean; count: number }> {
  if (!rows.length) return { ok: false, count: 0 };
  try {
    await prisma.resource.createMany({
      data: rows.map((r) => ({
        name: r.name,
        category: r.category,
        quantity: r.quantity,
        unit: null,
        lat: r.lat,
        lng: r.lng,
        status: "available",
        depotName: null,
      })),
    });
    revalidatePath("/inventory");
    return { ok: true, count: rows.length };
  } catch (error) {
    console.warn("[resources] bulkImportResources fell back to mock success.", error);
    return { ok: true, count: rows.length };
  }
}

/**
 * Approve a field request and (optionally) mark the sourcing resource as
 * deployed. Appends a movement-trail entry (Phase 12: depot → disaster site)
 * when both rows exist. Returns true on success — and also on mock fallback,
 * so the demo UI always reflects an approval. Never throws.
 */
export async function approveRequest(
  requestId: string,
  resourceId: string,
): Promise<boolean> {
  try {
    const [req, source] = await Promise.all([
      prisma.resourceRequest
        .findUnique({ where: { id: requestId } })
        .catch(() => null),
      prisma.resource.findUnique({ where: { id: resourceId } }).catch(() => null),
    ]);

    await prisma.resourceRequest.update({
      where: { id: requestId },
      data: { status: "approved" },
    });

    if (source) {
      await prisma.resource.update({
        where: { id: resourceId },
        data: { status: "deployed" },
      });
    }

    // Phase 12 · movement trail: depot → disaster site, timestamped.
    if (req && source) {
      await prisma.resourceMovement
        .create({
          data: {
            resourceId: source.id,
            resourceName: source.name,
            action: "dispatched",
            fromLabel: source.depotName ?? "Central Depot",
            toLabel: req.requestedBy,
            toLat: req.lat,
            toLng: req.lng,
            quantity: req.quantityNeeded,
            note: `Fulfils field request ${req.id.slice(0, 8)}`,
          },
        })
        .catch(() => {
          // best-effort: a failed movement row never blocks the dispatch.
        });
    }

    revalidatePath("/resources");
    revalidatePath("/inventory");
    revalidatePath("/dispatch");
    return true;
  } catch (error) {
    console.warn("[resources] approveRequest fell back to mock success.", error);
    return true;
  }
}

// ---------------------------------------------------------------------
// Phase 12 · Full CRUD: create / update / delete a resource item so the
// inventory is editable beyond CSV bulk import.
// ---------------------------------------------------------------------

export type NewResourceInput = {
  name: string;
  category: string;
  quantity: number;
  unit?: string | null;
  status?: string;
  lat?: number;
  lng?: number;
  depotName?: string | null;
};

export type UpdateResourceInput = NewResourceInput & { id: string };

const MOCK_COORDINATES = { lat: 25.61, lng: 85.14 }; // Patna centre fallback.

/**
 * Create a single resource. Falls back to a mock id on DB failure so the Add
 * Resource form always "succeeds" during a demo without a live database.
 */
export async function addResource(
  input: NewResourceInput,
): Promise<{ ok: boolean; id: string }> {
  try {
    const created = await prisma.resource.create({
      data: {
        name: input.name,
        category: input.category,
        quantity: Math.max(0, input.quantity || 0),
        unit: input.unit || null,
        status: input.status || "available",
        lat: input.lat ?? MOCK_COORDINATES.lat,
        lng: input.lng ?? MOCK_COORDINATES.lng,
        depotName: input.depotName || null,
      },
    });
    revalidatePath("/inventory");
    return { ok: true, id: created.id };
  } catch (error) {
    console.warn("[resources] addResource fell back to mock success.", error);
    return { ok: true, id: `mock-${Date.now()}` };
  }
}

/**
 * Update a single resource. Returns false on failure (DB unavailable) so the
 * UI can surface it, but still reports success when the row is a mock.
 */
export async function updateResource(input: UpdateResourceInput): Promise<boolean> {
  try {
    await prisma.resource.update({
      where: { id: input.id },
      data: {
        name: input.name,
        category: input.category,
        quantity: Math.max(0, input.quantity || 0),
        unit: input.unit || undefined,
        status: input.status || undefined,
        lat: input.lat ?? MOCK_COORDINATES.lat,
        lng: input.lng ?? MOCK_COORDINATES.lng,
        depotName: input.depotName || undefined,
      },
    });
    revalidatePath("/inventory");
    return true;
  } catch (error) {
    console.warn("[resources] updateResource failed.", error);
    return false;
  }
}

/**
 * Delete a single resource. Falls back to success if the id is a mock row.
 */
export async function deleteResource(id: string): Promise<boolean> {
  try {
    await prisma.resource.delete({ where: { id } });
    revalidatePath("/inventory");
    return true;
  } catch (error) {
    console.warn("[resources] deleteResource failed.", error);
    // Mock rows (prefixed `mock-`/`res-`) don't exist in the DB — treat as
    // removed so the demo table can clear an item without a live database.
    return id.startsWith("mock-") || id.startsWith("res-");
  }
}

// ---------------------------------------------------------------------
// Phase 12 · Resource Movement Tracking — immutable trail of where
// resources went (depot → disaster site) with timestamps. Written on
// dispatch (approveRequest above) and by admins via the Record Movement
// form on the inventory page.
// ---------------------------------------------------------------------

export type ResourceMovement = {
  id: string;
  resourceId: string | null;
  resourceName: string;
  action: string; // dispatched | delivered | returned | adjusted
  fromLabel: string | null;
  toLabel: string;
  toLat: number;
  toLng: number;
  quantity: number;
  note: string | null;
  createdAt: string;
};

export type NewMovementInput = {
  resourceName: string;
  action: string;
  fromLabel?: string | null;
  toLabel: string;
  toLat: number;
  toLng: number;
  quantity?: number;
  note?: string | null;
};

// Seeded trail so the movements feed is never empty during a DB-less demo.
// Timestamps are minutes in the past so the relative-time labels read live.
const MOCK_MOVEMENTS: ResourceMovement[] = [
  {
    id: "mov-1",
    resourceId: "res-1",
    resourceName: "NDRF Rescue Boats",
    action: "dispatched",
    fromLabel: "Patna NDRF Depot",
    toLabel: "Kankarbagh Ward Office",
    toLat: 25.604,
    toLng: 85.153,
    quantity: 6,
    note: "Fulfils field request req-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "mov-2",
    resourceId: "res-3",
    resourceName: "Bottled Water Pallets",
    action: "delivered",
    fromLabel: "Gandhi Maidan Store",
    toLabel: "Sonepur Relief Camp",
    toLat: 25.72,
    toLng: 85.19,
    quantity: 120,
    note: "Delivery confirmed by camp manager",
    createdAt: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
  },
  {
    id: "mov-3",
    resourceId: "res-2",
    resourceName: "Medical First-Aid Kits",
    action: "dispatched",
    fromLabel: "Sadar Hospital Depot",
    toLabel: "Phaganpur Field Post",
    toLat: 25.63,
    toLng: 85.16,
    quantity: 40,
    note: "Priority: high",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "mov-4",
    resourceId: "res-5",
    resourceName: "High-Power Generators",
    action: "returned",
    fromLabel: "Rajendra Nagar Yard",
    toLabel: "Depot (maintenance)",
    toLat: 25.585,
    toLng: 85.1,
    quantity: 2,
    note: "Returned for servicing after deployment",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
];

/**
 * Fetch the most recent resource movements. Falls back to the seeded trail
 * when the DB is unreachable or empty, so the feed always renders.
 */
export async function getResourceMovements(limit = 15): Promise<ResourceMovement[]> {
  try {
    const rows = await prisma.resourceMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    if (!rows.length) return MOCK_MOVEMENTS;
    return rows.map((m) => ({
      id: m.id,
      resourceId: m.resourceId,
      resourceName: m.resourceName,
      action: m.action,
      fromLabel: m.fromLabel,
      toLabel: m.toLabel,
      toLat: m.toLat,
      toLng: m.toLng,
      quantity: m.quantity,
      note: m.note,
      createdAt: m.createdAt.toISOString(),
    }));
  } catch (error) {
    console.warn("[resources] getResourceMovements fell back to mock data.", error);
    return MOCK_MOVEMENTS.slice(0, limit);
  }
}

/**
 * Record a resource movement (manual log / dispatch trail). Falls back to a
 * mock id when the DB is unreachable, so the form always "succeeds" during a
 * demo without a live database.
 */
const MOVEMENT_ACTIONS = ["dispatched", "delivered", "returned", "adjusted"];

/**
 * Record a resource movement (manual log / dispatch trail). Falls back to a
 * mock id when the DB is unreachable, so the form always "succeeds" during a
 * demo without a live database.
 */
export async function logResourceMovement(
  input: NewMovementInput,
): Promise<{ ok: boolean; id: string }> {
  try {
    const created = await prisma.resourceMovement.create({
      data: {
        resourceId: null,
        resourceName: input.resourceName,
        // Sanitize: clamp unknown action strings to the known vocabulary.
        action: MOVEMENT_ACTIONS.includes(input.action)
          ? input.action
          : "adjusted",
        fromLabel: input.fromLabel || null,
        toLabel: input.toLabel,
        toLat: input.toLat,
        toLng: input.toLng,
        quantity: Math.max(0, input.quantity || 0),
        note: input.note || null,
      },
    });
    revalidatePath("/inventory");
    revalidatePath("/dispatch");
    return { ok: true, id: created.id };
  } catch (error) {
    console.warn("[resources] logResourceMovement fell back to mock success.", error);
    return { ok: true, id: `mock-${Date.now()}` };
  }
}
