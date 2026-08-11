// ---------------------------------------------------------------------
// lib/demo/seeder.ts — Phase 2 · Step 4 · Shared demo data seeder.
//
// The app needs realistic data to look good during the pitch. This module
// generates complete, deterministic scenario datasets — affected villages,
// shelters, resources, responders and alerts — so every surface (gov map,
// dashboards, citizen app) can render believable numbers without touching
// the production database.
//
//   • seedDemoData(scenario)  → the full dataset for one of 4 scenarios:
//       normal_day / flood_watch / evacuation_order / critical_emergency
//   • activateDemoScenario()  → seeds + persists to localStorage and
//       dispatches the global `demo:scenario-change` event so maps and
//       dashboards refresh instantly (Step 5's ScenarioSelector uses it).
//
// EVERY record is tagged `isDemo: true` — any consumer can filter on that
// flag so demo data is never mistaken for real ops data.
//
// Pure + SSR-safe: seeding is plain data; the localStorage/event side only
// runs when `window` exists.
// ---------------------------------------------------------------------

export type DemoScenarioKey =
  | "normal_day"
  | "flood_watch"
  | "evacuation_order"
  | "critical_emergency";

export const DEMO_SCENARIO_STORAGE_KEY = "drip:demo-scenario";
export const DEMO_SEED_STORAGE_KEY = "drip:demo-seed";

/** Dropdown options shared by the ScenarioSelector (Step 5). */
export const DEMO_SCENARIOS: ReadonlyArray<{ key: DemoScenarioKey; label: string }> = [
  { key: "normal_day", label: "Normal Day" },
  { key: "flood_watch", label: "Flood Watch" },
  { key: "evacuation_order", label: "Evacuation Order" },
  { key: "critical_emergency", label: "⚫ Critical Emergency" },
] as const;

export const DEMO_SCENARIO_LABEL: Record<DemoScenarioKey, string> = {
  normal_day: "Normal Day",
  flood_watch: "Flood Watch",
  evacuation_order: "Evacuation Order",
  critical_emergency: "⚫ Critical Emergency",
};

export type DemoRiskLevel = "low" | "moderate" | "high" | "critical";

export type DemoAffectedVillage = {
  name: string;
  district: string;
  population: number;
  evacuees: number;
  riskLevel: DemoRiskLevel;
  status: string;
  /** Demo flag — never treat as real ops data. */
  isDemo: true;
};

export type DemoShelter = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  status: "open" | "filling" | "full";
  isDemo: true;
};

export type DemoResource = {
  id: string;
  name: string;
  category: "boat" | "medical" | "food" | "water" | "personnel";
  quantity: number;
  unit: string;
  status: "available" | "deployed" | "low";
  isDemo: true;
};

export type DemoResponder = {
  id: string;
  name: string;
  team: "NDRF" | "SDRF" | "Police" | "Fire" | "Health";
  status: "standby" | "en_route" | "on_scene";
  isDemo: true;
};

export type DemoAlert = {
  id: string;
  severity: "info" | "watch" | "warning" | "critical";
  message: string;
  district: string;
  minutesAgo: number;
  isDemo: true;
};

/** The full dataset for one scenario — the interface from the slide. */
export type DemoScenarioData = {
  scenario: DemoScenarioKey;
  affectedVillages: DemoAffectedVillage[];
  shelters: DemoShelter[];
  resources: DemoResource[];
  responders: DemoResponder[];
  alerts: DemoAlert[];
};

// ---------------------------------------------------------------------
// Reusable Patna building blocks (spread/shape per scenario below).
// ---------------------------------------------------------------------

const VILLAGES = [
  { name: "Kankarbagh Lowlands", district: "Patna (Ganga)" },
  { name: "Rajendra Nagar Basti", district: "Patna (Ganga)" },
  { name: "Patliputra Colony", district: "Patna (Ganga)" },
  { name: "Danapur Nala", district: "Patna (Ganga)" },
  { name: "Sampatchak", district: "Patna (Ganga)" },
  { name: "Gandhi Ghat", district: "Patna (Ganga)" },
];

const SHELTER_BASES = [
  { lat: 25.6, lng: 85.14, capacity: 450, name: "Central Community Hall" },
  { lat: 25.585, lng: 85.13, capacity: 380, name: "Riverside High School" },
  { lat: 25.608, lng: 85.12, capacity: 300, name: "District Hospital Annex" },
  { lat: 25.6125, lng: 85.145, capacity: 500, name: "Patliputra Sports Complex" },
];

const RESPONDER_TEAMS: Array<[string, DemoResponder["team"]]> = [
  ["Sunita Das", "NDRF"],
  ["Ravi Kumar", "NDRF"],
  ["Meera Nair", "SDRF"],
  ["Arjun Singh", "SDRF"],
  ["Priya Lakra", "NDRF"],
  ["Vikram Yadav", "SDRF"],
  ["Anita Gupta", "Police"],
  ["Rahul Sharma", "NDRF"],
  ["Divya Patel", "Health"],
  ["Sanjay Kumar", "Fire"],
  ["Kavita Rao", "Health"],
  ["Mohammed Irfan", "SDRF"],
];

const RESOURCE_BASES: Array<{
  id: string;
  name: string;
  category: DemoResource["category"];
  quantity: number;
  unit: string;
}> = [
  { id: "res-boat", name: "Rescue Boats", category: "boat", quantity: 12, unit: "boats" },
  { id: "res-medical", name: "Medical First-Aid Kits", category: "medical", quantity: 40, unit: "kits" },
  { id: "res-food", name: "Dry Food Packets", category: "food", quantity: 2000, unit: "packets" },
  { id: "res-water", name: "Drinking Water Bottles", category: "water", quantity: 5000, unit: "bottles" },
  { id: "res-team", name: "NDRF Rescue Teams", category: "personnel", quantity: 6, unit: "teams" },
];

function villages(
  count: number,
  riskLevels: DemoRiskLevel[],
  evacuees: number[],
  statuses: string[],
): DemoAffectedVillage[] {
  return VILLAGES.slice(0, count).map((v, i) => ({
    ...v,
    population: 300 + i * 120,
    riskLevel: riskLevels[i] ?? riskLevels[riskLevels.length - 1],
    evacuees: evacuees[i] ?? 0,
    status: statuses[i] ?? "monitoring",
    isDemo: true,
  }));
}

function shelters(
  occupancy: number[],
  statuses: DemoShelter["status"][],
): DemoShelter[] {
  return SHELTER_BASES.map((s, i) => ({
    ...s,
    id: s.name.toLowerCase().replace(/[^a-z]+/g, "-"),
    occupancy: occupancy[i] ?? 0,
    status: statuses[i] ?? "open",
    isDemo: true,
  }));
}

function responders(count: number, statuses: DemoResponder["status"][]): DemoResponder[] {
  return RESPONDER_TEAMS.slice(0, count).map(([name, team], i) => ({
    id: `responder-${i + 1}`,
    name,
    team,
    status: statuses[i] ?? "standby",
    isDemo: true,
  }));
}

function resources(statuses: DemoResource["status"][]): DemoResource[] {
  return RESOURCE_BASES.map((r, i) => ({ ...r, status: statuses[i] ?? "available", isDemo: true }));
}

function alerts(items: Array<Omit<DemoAlert, "id" | "isDemo">>): DemoAlert[] {
  return items.map((a, i) => ({ ...a, id: `demo-alert-${i + 1}`, isDemo: true }));
}

// ---------------------------------------------------------------------
// The four scenario generators.
// ---------------------------------------------------------------------

function normalDay(): DemoScenarioData {
  return {
    scenario: "normal_day",
    affectedVillages: villages(
      3,
      ["low", "low", "moderate"],
      [12, 8, 40],
      ["monitoring", "monitoring", "monitoring"],
    ),
    shelters: shelters([84, 32, 46, 0], ["open", "open", "open", "open"]),
    resources: resources(["available", "available", "available", "available", "available"]),
    responders: responders(3, ["standby", "standby", "standby"]),
    alerts: alerts([{
      severity: "info",
      message: "🌤 All clear. Ganga level steady — routine district monitoring continues.",
      district: "Patna (Ganga)",
      minutesAgo: 40,
    }]),
  };
}

function floodWatch(): DemoScenarioData {
  return {
    scenario: "flood_watch",
    affectedVillages: villages(
      4,
      ["moderate", "moderate", "high", "low"],
      [120, 90, 300, 40],
      ["watching", "watching", "watching", "monitoring"],
    ),
    shelters: shelters([284, 220, 96, 0], ["filling", "filling", "open", "open"]),
    resources: resources(["available", "available", "available", "available", "available"]),
    responders: responders(6, ["standby", "en_route", "standby", "en_route", "standby", "standby"]),
    alerts: alerts([
      {
        severity: "watch",
        message: "🌊 Watch: river discharge rising near Patna. Monitor shelter occupancy.",
        district: "Patna (Ganga)",
        minutesAgo: 25,
      },
      {
        severity: "info",
        message: "📡 Forecast updated: moderate rainfall likely over the next 6 hours.",
        district: "Patna (Ganga)",
        minutesAgo: 12,
      },
    ]),
  };
}

function evacuationOrder(): DemoScenarioData {
  return {
    scenario: "evacuation_order",
    affectedVillages: villages(
      5,
      ["high", "critical", "high", "critical", "moderate"],
      [620, 880, 410, 500, 110],
      ["evacuating", "evacuating", "evacuating", "ordered", "watching"],
    ),
    shelters: shelters([312, 380, 178, 220], ["open", "full", "filling", "filling"]),
    resources: resources(["deployed", "deployed", "available", "available", "deployed"]),
    responders: responders(9, ["on_scene", "on_scene", "en_route", "on_scene", "en_route", "on_scene", "standby", "en_route", "standby"]),
    alerts: alerts([
      {
        severity: "warning",
        message: "🚨 EVACUATION ORDER: Kankarbagh & Rajendra Nagar floodplain — move to Central Community Hall now.",
        district: "Patna (Ganga)",
        minutesAgo: 6,
      },
      {
        severity: "watch",
        message: "🌊 Water levels rising faster than forecast — 1 m from danger mark.",
        district: "Patna (Ganga)",
        minutesAgo: 18,
      },
      {
        severity: "info",
        message: "🏠 Riverside High School at capacity — reroute evacuees to District Hospital Annex.",
        district: "Patna (Ganga)",
        minutesAgo: 30,
      },
    ]),
  };
}

function criticalEmergency(): DemoScenarioData {
  return {
    scenario: "critical_emergency",
    affectedVillages: villages(
      6,
      ["critical", "critical", "high", "critical", "high", "high"],
      [950, 1200, 540, 780, 420, 350],
      ["evacuating", "evacuating", "evacuating", "evacuating", "evacuating", "evacuating"],
    ),
    shelters: shelters([410, 380, 240, 315], ["filling", "full", "filling", "filling"]),
    resources: resources(["deployed", "deployed", "low", "low", "deployed"]),
    responders: responders(12, ["on_scene", "on_scene", "en_route", "on_scene", "on_scene", "en_route", "on_scene", "on_scene", "en_route", "on_scene", "en_route", "on_scene"]),
    alerts: alerts([
      {
        severity: "critical",
        message: "⚠️ CRITICAL: Ganga at danger mark — evacuate floodplain villages immediately. Zones: Kankarbagh, Rajendra Nagar.",
        district: "Patna (Ganga)",
        minutesAgo: 4,
      },
      {
        severity: "critical",
        message: "🛟 Rooftop rescue needed near Patna University — 2 teams dispatched.",
        district: "Patna (Ganga)",
        minutesAgo: 9,
      },
      {
        severity: "warning",
        message: "🚧 Ashok Rajpath flooded — road closed, use Bailey Road detour.",
        district: "Patna (Ganga)",
        minutesAgo: 15,
      },
      {
        severity: "watch",
        message: "⛑ NDRF 9th Battalion en route — arriving in approx. 25 min.",
        district: "Patna (Ganga)",
        minutesAgo: 22,
      },
    ]),
  };
}

const BUILDERS: Record<DemoScenarioKey, () => DemoScenarioData> = {
  normal_day: normalDay,
  flood_watch: floodWatch,
  evacuation_order: evacuationOrder,
  critical_emergency: criticalEmergency,
};

/**
 * Generate the full dataset for a scenario. Deterministic per key — the
 * exact same shapes every call, so tests and UI can assert on them.
 */
export function seedDemoData(scenario: DemoScenarioKey): DemoScenarioData {
  return BUILDERS[scenario]();
}

/**
 * Seed + persist + notify. Saves the dataset to localStorage and fires the
 * global `demo:scenario-change` event (detail: { scenario, data }) so every
 * subscribed surface refresh instantly. SSR-safe: no window → just returns
 * the data.
 */
export function activateDemoScenario(scenario: DemoScenarioKey): DemoScenarioData {
  const data = seedDemoData(scenario);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DEMO_SCENARIO_STORAGE_KEY, scenario);
      window.localStorage.setItem(DEMO_SEED_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable — the event still fires below.
    }
    window.dispatchEvent(new CustomEvent("demo:scenario-change", { detail: { scenario, data } }));
  }
  return data;
}

/** Currently stored scenario key (SSR-safe; null when unset). */
export function readStoredDemoScenario(): DemoScenarioKey | null {
  if (typeof window === "undefined") return null;
  try {
    const key = window.localStorage.getItem(DEMO_SCENARIO_STORAGE_KEY) as
      | DemoScenarioKey
      | null;
    return key && key in BUILDERS ? key : null;
  } catch {
    return null;
  }
}

/** Stored dataset (SSR-safe; null when unset or corrupt). */
export function readStoredDemoSeed(): DemoScenarioData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_SEED_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoScenarioData;
    return parsed && typeof parsed.scenario === "string" && Array.isArray(parsed.shelters)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/** Clear the stored scenario + dataset (used by Reset Demo Data). */
export function clearDemoSeed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DEMO_SCENARIO_STORAGE_KEY);
    window.localStorage.removeItem(DEMO_SEED_STORAGE_KEY);
  } catch {
    // Ignore — nothing else to do.
  }
}