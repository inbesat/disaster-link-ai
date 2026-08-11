// ---------------------------------------------------------------------
// lib/mock-data/resource-inventory.ts — Phase 10 · Steps 1–2 · District
// Resource Inventory.
//
// Single source of truth for the Resource Inventory page (app/gov/
// resources): the TanStack data table (Step 1) and the MapLibre map view
// (Step 2) both render the same rows, so the type + dataset + pure
// helpers live here — pure, deterministic, and unit-tested (see
// resource-inventory.test.ts).
//
// Coordinates are real Patna / Punpun-sector anchors (the Phase 9 flood
// theatre) so the map view plots resources where the ops actually are.
// ---------------------------------------------------------------------

export type ResourceStatus = "available" | "deployed" | "maintenance";

export type ResourceCategory = "boat" | "medical" | "food" | "tent";

export type ResourceItem = {
  id: string;
  /** Display name, e.g. "NDRF Rescue Boats". */
  name: string;
  category: ResourceCategory;
  quantity: number;
  unit: string;
  /** Depot / staging / shelter where the item sits. */
  location: string;
  status: ResourceStatus;
  /** Agency or team the item is assigned to. */
  assignedTo: string;
  /** Human-readable timestamp, e.g. "11 Aug 10:32 IST". */
  lastUpdated: string;
  /** WGS84 coordinates (map view). */
  lat: number;
  lng: number;
};

/** Colour/emoji metadata per category — shared by table icon + map pin. */
export const CATEGORY_META: Record<
  ResourceCategory,
  { label: string; emoji: string; hex: string }
> = {
  boat: { label: "Boats", emoji: "🚤", hex: "#3b82f6" },
  medical: { label: "Medical Kits", emoji: "🩺", hex: "#10b981" },
  food: { label: "Food Rations", emoji: "🍱", hex: "#f59e0b" },
  tent: { label: "Tents", emoji: "⛺", hex: "#a855f7" },
};

/** Status label + marker/dot colour (green/amber/red per spec). */
export const STATUS_META: Record<
  ResourceStatus,
  { label: string; dot: string; marker: string; hex: string }
> = {
  available: {
    label: "Available",
    dot: "bg-severity-green-500",
    marker: "bg-severity-green-500",
    hex: "#10b981",
  },
  deployed: {
    label: "Deployed",
    dot: "bg-severity-amber-500",
    marker: "bg-severity-amber-500",
    hex: "#f59e0b",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-severity-red-500",
    marker: "bg-severity-red-500",
    hex: "#ef4444",
  },
};

export const RESOURCE_INVENTORY: ResourceItem[] = [
  // ------------------------------------------------------------- BOATS --
  {
    id: "res-boat-01",
    name: "NDRF Rescue Boats",
    category: "boat",
    quantity: 12,
    unit: "boats",
    location: "Punpun Ghat",
    status: "deployed",
    assignedTo: "NDRF 2nd Bn",
    lastUpdated: "11 Aug 10:32 IST",
    lat: 25.479,
    lng: 85.104,
  },
  {
    id: "res-boat-02",
    name: "SDRF Motor Boats",
    category: "boat",
    quantity: 6,
    unit: "boats",
    location: "Sadar Boat Yard",
    status: "available",
    assignedTo: "SDRF 7th Bn",
    lastUpdated: "11 Aug 09:10 IST",
    lat: 25.594,
    lng: 85.136,
  },
  {
    id: "res-boat-03",
    name: "Inflatable Rescue Boats",
    category: "boat",
    quantity: 4,
    unit: "boats",
    location: "District Workshop",
    status: "maintenance",
    assignedTo: "District Fleet Cell",
    lastUpdated: "10 Aug 18:45 IST",
    lat: 25.532,
    lng: 85.179,
  },
  {
    id: "res-boat-04",
    name: "Fisher Co-op Boats",
    category: "boat",
    quantity: 18,
    unit: "boats",
    location: "Rampur Landing",
    status: "available",
    assignedTo: "Village Task Force",
    lastUpdated: "11 Aug 08:02 IST",
    lat: 25.501,
    lng: 85.068,
  },
  // ---------------------------------------------------------- MEDICAL ----
  {
    id: "res-med-01",
    name: "First-Aid Kits",
    category: "medical",
    quantity: 200,
    unit: "kits",
    location: "Sadar Hospital Depot",
    status: "available",
    assignedTo: "District Health Dept",
    lastUpdated: "11 Aug 07:55 IST",
    lat: 25.589,
    lng: 85.141,
  },
  {
    id: "res-med-02",
    name: "First-Aid Kits",
    category: "medical",
    quantity: 80,
    unit: "kits",
    location: "Rampur High School",
    status: "deployed",
    assignedTo: "Medical Corps Team A",
    lastUpdated: "11 Aug 10:12 IST",
    lat: 25.492,
    lng: 85.076,
  },
  {
    id: "res-med-03",
    name: "Field Ambulances",
    category: "medical",
    quantity: 8,
    unit: "ambulances",
    location: "Zilla School Cluster",
    status: "deployed",
    assignedTo: "108 EMRI Fleet",
    lastUpdated: "11 Aug 09:58 IST",
    lat: 25.517,
    lng: 85.121,
  },
  {
    id: "res-med-04",
    name: "Cholera Care Packs",
    category: "medical",
    quantity: 40,
    unit: "packs",
    location: "Community Hall",
    status: "maintenance",
    assignedTo: "District Health Dept",
    lastUpdated: "10 Aug 21:30 IST",
    lat: 25.476,
    lng: 85.146,
  },
  // ------------------------------------------------------------ FOOD -----
  {
    id: "res-food-01",
    name: "Ready-to-Eat Rations",
    category: "food",
    quantity: 350,
    unit: "pallets",
    location: "Gandhi Maidan Store",
    status: "available",
    assignedTo: "Civil Supplies Dept",
    lastUpdated: "11 Aug 06:40 IST",
    lat: 25.611,
    lng: 85.144,
  },
  {
    id: "res-food-02",
    name: "Ready-to-Eat Rations",
    category: "food",
    quantity: 120,
    unit: "pallets",
    location: "NH-01 Staging Camp",
    status: "deployed",
    assignedTo: "Relief Distribution Unit",
    lastUpdated: "11 Aug 10:20 IST",
    lat: 25.455,
    lng: 85.088,
  },
  {
    id: "res-food-03",
    name: "Drinking Water Bottles",
    category: "food",
    quantity: 500,
    unit: "crates",
    location: "Water Tanker Point",
    status: "maintenance",
    assignedTo: "PHED Cell",
    lastUpdated: "11 Aug 08:22 IST",
    lat: 25.527,
    lng: 85.095,
  },
  {
    id: "res-food-04",
    name: "Baby Food & Milk",
    category: "food",
    quantity: 60,
    unit: "crates",
    location: "Punpun Ghat",
    status: "deployed",
    assignedTo: "ICDS Block Office",
    lastUpdated: "11 Aug 09:41 IST",
    lat: 25.481,
    lng: 85.102,
  },
  // ------------------------------------------------------------ TENTS ----
  {
    id: "res-tent-01",
    name: "Relief Tents (10-seater)",
    category: "tent",
    quantity: 150,
    unit: "tents",
    location: "District Store",
    status: "available",
    assignedTo: "Civil Supplies Dept",
    lastUpdated: "11 Aug 07:18 IST",
    lat: 25.6,
    lng: 85.165,
  },
  {
    id: "res-tent-02",
    name: "Relief Tents (10-seater)",
    category: "tent",
    quantity: 80,
    unit: "tents",
    location: "Rampur High School",
    status: "deployed",
    assignedTo: "Shelter Management Unit",
    lastUpdated: "11 Aug 10:05 IST",
    lat: 25.493,
    lng: 85.078,
  },
  {
    id: "res-tent-03",
    name: "Field Hospital Tents",
    category: "tent",
    quantity: 12,
    unit: "tents",
    location: "Zilla School Cluster",
    status: "deployed",
    assignedTo: "Medical Corps Team A",
    lastUpdated: "11 Aug 09:47 IST",
    lat: 25.516,
    lng: 85.119,
  },
  {
    id: "res-tent-04",
    name: "Relief Tents (10-seater)",
    category: "tent",
    quantity: 30,
    unit: "tents",
    location: "Daulatpur Camp",
    status: "maintenance",
    assignedTo: "Shelter Management Unit",
    lastUpdated: "10 Aug 17:22 IST",
    lat: 25.468,
    lng: 85.131,
  },
];

/** All items of a category, in dataset order. */
export function resourcesByCategory(category: ResourceCategory): ResourceItem[] {
  return RESOURCE_INVENTORY.filter((item) => item.category === category);
}

/** All items in a status, in dataset order. */
export function resourcesByStatus(status: ResourceStatus): ResourceItem[] {
  return RESOURCE_INVENTORY.filter((item) => item.status === status);
}

/** Human-readable quantity string, e.g. "12 boats" / "200 kits". */
export function formatQuantity(item: ResourceItem): string {
  return `${item.quantity.toLocaleString("en-IN")} ${item.unit}`;
}
