"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/lib/security/require-role";
import { sanitizeInput } from "@/lib/security/sanitize";

// ---------------------------------------------------------------------
// Security: every mutating server action below is gated by requireSession().
// Server actions are directly invokable via a forged Next-Action POST, so the
// middleware alone cannot protect them. requireSession admits the demo cookie
// sessions (guest_mode / role cookie / Supabase user) that the UI relies on
// while rejecting fully anonymous callers. Swap to requireRole(GOV_ROLES)
// when real auth is wired up.
// ---------------------------------------------------------------------
async function assertWriteAccess(): Promise<string | null> {
  const auth = await requireSession();
  return auth.ok ? null : auth.error;
}

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
  notes?: string;
};

/**
 * Create a new field resource request. Falls back to a mock success (with a
 * fake id) if the DB is unreachable, so the mobile demo always works.
 */
export async function submitResourceRequest(
  input: NewResourceRequest,
): Promise<{ ok: boolean; id: string; error?: string }> {
  const authError = await assertWriteAccess();
  if (authError) return { ok: false, id: "", error: authError };

  // Validate input
  if (!input.category || typeof input.category !== "string") {
    return { ok: false, id: "", error: "Category is required." };
  }
  if (typeof input.quantity !== "number" || !Number.isFinite(input.quantity) || input.quantity < 0) {
    return { ok: false, id: "", error: "Invalid quantity." };
  }
  if (!input.urgency || !["low", "medium", "high", "critical"].includes(input.urgency)) {
    return { ok: false, id: "", error: "Invalid urgency level." };
  }
  if (typeof input.lat !== "number" || !Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90) {
    return { ok: false, id: "", error: "Invalid latitude." };
  }
  if (typeof input.lng !== "number" || !Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) {
    return { ok: false, id: "", error: "Invalid longitude." };
  }

  try {
    const created = await prisma.resourceRequest.create({
      data: {
        requestedBy: "Field Responder",
        category: input.category,
        quantityNeeded: Math.floor(input.quantity),
        urgency: input.urgency,
        lat: input.lat,
        lng: input.lng,
        status: "pending",
        notes: input.notes
          ? sanitizeInput(String(input.notes)).slice(0, 2000)
          : "",
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
  const authError = await assertWriteAccess();
  if (authError) return { ok: false, count: 0 };
  if (!rows.length) return { ok: false, count: 0 };
  try {
    await prisma.resource.createMany({
      data: rows.map((r) => ({
        name: sanitizeInput(String(r.name ?? "")).slice(0, 200) || "Imported resource",
        category: sanitizeInput(String(r.category ?? "other")).slice(0, 100),
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
  const authError = await assertWriteAccess();
  if (authError) return false;
  try {
    const [req, source] = await Promise.all([
      prisma.resourceRequest.findUnique({ where: { id: requestId } }).catch(() => null),
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

const VALID_CATEGORIES = ["boat", "medical", "water", "food", "personnel", "power", "shelter", "communication", "other"];
const VALID_STATUSES = ["available", "deployed", "maintenance", "retired"];
const MAX_NAME_LENGTH = 200;
const MAX_RESOURCE_QUANTITY = 1000000;

function validateResourceInput(input: NewResourceInput): string | null {
  if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
    return "Resource name is required.";
  }
  if (input.name.length > MAX_NAME_LENGTH) {
    return `Resource name must be under ${MAX_NAME_LENGTH} characters.`;
  }
  if (!input.category || !VALID_CATEGORIES.includes(input.category)) {
    return `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`;
  }
  if (typeof input.quantity !== "number" || !Number.isFinite(input.quantity) || input.quantity < 0 || input.quantity > MAX_RESOURCE_QUANTITY) {
    return `Quantity must be between 0 and ${MAX_RESOURCE_QUANTITY}.`;
  }
  if (input.lat !== undefined && (typeof input.lat !== "number" || !Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90)) {
    return "Invalid latitude value.";
  }
  if (input.lng !== undefined && (typeof input.lng !== "number" || !Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180)) {
    return "Invalid longitude value.";
  }
  if (input.status && !VALID_STATUSES.includes(input.status)) {
    return `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`;
  }
  return null;
}

/**
 * Create a single resource. Falls back to a mock id on DB failure so the Add
 * Resource form always "succeeds" during a demo without a live database.
 */
export async function addResource(
  input: NewResourceInput,
): Promise<{ ok: boolean; id: string; error?: string }> {
  const authError = await assertWriteAccess();
  if (authError) return { ok: false, id: "", error: authError };

  const validationError = validateResourceInput(input);
  if (validationError) {
    return { ok: false, id: "", error: validationError };
  }

  try {
    const created = await prisma.resource.create({
      data: {
        name: sanitizeInput(input.name.trim()).slice(0, MAX_NAME_LENGTH),
        category: input.category,
        quantity: Math.max(0, Math.floor(input.quantity)),
        unit: input.unit ? sanitizeInput(input.unit).slice(0, 100) : null,
        status: input.status || "available",
        lat: input.lat ?? MOCK_COORDINATES.lat,
        lng: input.lng ?? MOCK_COORDINATES.lng,
        depotName: input.depotName ? sanitizeInput(input.depotName).slice(0, 200) : null,
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
  const authError = await assertWriteAccess();
  if (authError) return false;

  const validationError = validateResourceInput(input);
  if (validationError) {
    console.warn("[resources] updateResource validation failed:", validationError);
    return false;
  }

  try {
    await prisma.resource.update({
      where: { id: input.id },
      data: {
        name: sanitizeInput(input.name.trim()).slice(0, MAX_NAME_LENGTH),
        category: input.category,
        quantity: Math.max(0, Math.floor(input.quantity)),
        unit: input.unit ? sanitizeInput(input.unit).slice(0, 100) : undefined,
        status: input.status || undefined,
        lat: input.lat ?? MOCK_COORDINATES.lat,
        lng: input.lng ?? MOCK_COORDINATES.lng,
        depotName: input.depotName ? sanitizeInput(input.depotName).slice(0, 200) : undefined,
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
  const authError = await assertWriteAccess();
  if (authError) return false;
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
  const authError = await assertWriteAccess();
  if (authError) return { ok: false, id: "" };
  try {
    const created = await prisma.resourceMovement.create({
      data: {
        resourceId: null,
        resourceName: sanitizeInput(input.resourceName).slice(0, 200),
        // Sanitize: clamp unknown action strings to the known vocabulary.
        action: MOVEMENT_ACTIONS.includes(input.action) ? input.action : "adjusted",
        fromLabel: input.fromLabel ? sanitizeInput(input.fromLabel).slice(0, 200) : null,
        toLabel: sanitizeInput(input.toLabel).slice(0, 200),
        toLat: input.toLat,
        toLng: input.toLng,
        quantity: Math.max(0, input.quantity || 0),
        note: input.note ? sanitizeInput(input.note).slice(0, 2000) : null,
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
