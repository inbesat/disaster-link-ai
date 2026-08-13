// ---------------------------------------------------------------------
// lib/offline-sync/config.ts — Offline-First Architecture · Phase 2
// Per-dataset sync configuration for the 48-hour offline window. Every
// dataset maps to a live internal API route (same endpoints the dashboards
// already use) with an update cadence, a 48h TTL, a storage estimate and a
// priority band that drives the sync queue order in sync-engine.ts.
//
// Fetch functions are resilient by design, mirroring the app's "never 500
// the UI" convention: a failed/offline fetch resolves to an empty array
// instead of throwing, so a fullSync() never aborts because one upstream
// is down (Promise.allSettled + per-type catch).
// ---------------------------------------------------------------------

import type { DataSourceConfig, DataType } from "./types";

/** Districts the offline engine caches by default (hackathon scope). */
export const SYNC_DISTRICTS = ["Patna", "Ernakulam", "Kamrup"] as const;

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const response = await fetch(url, { signal, cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/** Array of district names taken from any endpoint's list payload. */
function rowsFrom<T>(
  payload: unknown,
  key: string,
): Array<{ id?: unknown; district?: unknown } & Record<string, unknown>> {
  if (!payload || typeof payload !== "object") return [];
  const list = (payload as Record<string, unknown>)[key];
  if (!Array.isArray(list)) return [];
  return list as Array<{ id?: unknown; district?: unknown } & Record<string, unknown>>;
}

/** Fetches flood/cyclone predictions for the 48h window (every 6h). */
async function fetchPredictions(options: {
  district: string;
  signal?: AbortSignal;
}): Promise<Array<{ id: string; district: string; data: unknown }>> {
  const payload = await fetchJson<{ source?: string; points?: Array<{ day?: string }> }>(
    `/api/predictions/history?days=2`,
    options.signal,
  );
  const points = payload?.points ?? [];
  return points
    .map((point, i) => ({
      id: `${options.district}:${point.day ?? i}`,
      district: options.district,
      data: { ...point, source: payload?.source },
    }))
    .concat([{ id: `${options.district}:meta`, district: options.district, data: { source: payload?.source } }]);
}

/** Fetches active alerts (real-time source). */
async function fetchAlerts(options: {
  district: string;
  signal?: AbortSignal;
}): Promise<Array<{ id: string; district: string }>> {
  const payload = await fetchJson<{ alerts?: Array<{ id?: unknown; district?: unknown }> }>(
    `/api/alerts?limit=50`,
    options.signal,
  );
  return rowsFrom(payload, "alerts").map((row) => ({
    id: String(row.id ?? `${options.district}:${Math.random().toString(36).slice(2, 7)}`),
    district: String(row.district ?? options.district),
    data: row,
  }));
}

/** Fetches safe routes / evacuation plans (every 12h). */
async function fetchRoutes(options: {
  district: string;
  signal?: AbortSignal;
}): Promise<Array<{ id: string; district: string; data: unknown }>> {
  const payload = await fetchJson<{ plans?: Array<{ id?: unknown; villageName?: unknown }> }>(
    `/api/evacuation-plans`,
    options.signal,
  );
  return rowsFrom(payload, "plans").map((row) => ({
    id: String(row.id ?? `${options.district}:${String(row.villageName ?? Math.random())}`),
    district: options.district,
    data: row,
  }));
}

/** Fetches resource locations (shelters / hospitals, daily). */
async function fetchResources(options: {
  district: string;
  signal?: AbortSignal;
}): Promise<Array<{ id: string; district: string }>> {
  const payload = await fetchJson<{ shelters?: Array<{ id?: unknown; district?: unknown }> }>(
    `/api/public/shelters`,
    options.signal,
  );
  return rowsFrom(payload, "shelters").map((row) => ({
    id: String(row.id ?? `${options.district}:${Math.random().toString(36).slice(2, 7)}`),
    district: String(row.district ?? options.district),
    data: row,
  }));
}

/** Fetches weather for the district (needs a representative coordinate). */
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  Patna: { lat: 25.5941, lng: 85.1376 },
  Ernakulam: { lat: 9.9816, lng: 76.2999 },
  Kamrup: { lat: 26.3161, lng: 91.5984 },
};

async function fetchWeather(options: {
  district: string;
  signal?: AbortSignal;
}): Promise<Array<{ id: string; district: string; data: unknown }>> {
  const coord = DISTRICT_COORDS[options.district];
  if (!coord) return [];
  const payload = await fetchJson<{ weather?: unknown }>(
    `/api/weather?lat=${coord.lat}&lng=${coord.lng}`,
    options.signal,
  );
  const row = payload?.weather;
  if (row === undefined || row === null) return [];
  return [
    {
      id: `${options.district}:${new Date().toISOString()}`,
      district: options.district,
      data: row,
    },
  ];
}

/** Fetches the user's district profile (on change → daily in cache). */
async function fetchProfiles(options: {
  district: string;
  signal?: AbortSignal;
}): Promise<Array<{ id: string; district: string; data: unknown }>> {
  // The profile is client-known (preferred language, district); keep the
  // sync payload a snapshot built locally so it works in the demo without
  // a dedicated endpoint.
  if (typeof window === "undefined") {
    return [
      {
        id: `${options.district}:profile`,
        district: options.district,
        data: { source: "cache", cachedFor: options.district },
      },
    ];
  }
  return [
    {
      id: `${options.district}:profile`,
      district: options.district,
      data: {
        district: options.district,
        preferredLanguage: window.localStorage.getItem("lang") ?? "hi",
        cachedFor: options.district,
      },
    },
  ];
}

/** Fetches RAG context chunks for the knowledge table (weekly). */
async function fetchKnowledge(options: {
  district: string;
  signal?: AbortSignal;
}): Promise<Array<{ id: string; district: string }>> {
  // RAG chunks are per-query normally; here we snapshot a general district
  // briefing via the same retrieval endpoint so judges can demo offline QA.
  const payload = await fetchJson<{ results?: Array<{ title?: unknown; content?: unknown }> }>(
    `/api/retrieval/embed?district=${encodeURIComponent(options.district)}`,
    options.signal,
  );
  return rowsFrom(payload, "results").map((row, i) => ({
    id: `${options.district}:knowledge:${i}`,
    district: options.district,
    data: row,
  }));
}

/**
 * The full dataset registry, ordered by priority band (critical first).
 * `maps` intentionally has no fetch (map tiles are cached by the service
 * worker at runtime) — it appears in the status dashboard as a runtime
 * cache only.
 */
export const DATA_SOURCE_CONFIGS: Array<DataSourceConfig<unknown>> = [
  {
    type: "alerts",
    sizeBytes: 200_000,
    expectedRows: 200,
    refreshHours: 1,
    ttlHours: 48,
    priority: "critical",
    fetch: fetchAlerts as DataSourceConfig["fetch"],
  },
  {
    type: "predictions",
    sizeBytes: 500_000,
    expectedRows: 200,
    refreshHours: 6,
    ttlHours: 48,
    priority: "high",
    fetch: fetchPredictions as DataSourceConfig["fetch"],
  },
  {
    type: "weather",
    sizeBytes: 300_000,
    expectedRows: 24,
    refreshHours: 3,
    ttlHours: 48,
    priority: "high",
    fetch: fetchWeather as DataSourceConfig["fetch"],
  },
  {
    type: "routes",
    sizeBytes: 1_000_000,
    expectedRows: 50,
    refreshHours: 12,
    ttlHours: 48,
    priority: "normal",
    fetch: fetchRoutes as DataSourceConfig["fetch"],
  },
  {
    type: "resources",
    sizeBytes: 800_000,
    expectedRows: 200,
    refreshHours: 24,
    ttlHours: 48,
    priority: "normal",
    fetch: fetchResources as DataSourceConfig["fetch"],
  },
  {
    type: "knowledge",
    sizeBytes: 2_000_000,
    expectedRows: 2000,
    refreshHours: 168,
    ttlHours: 48 * 7, // weekly refresh, 7-day shelf life
    priority: "low",
    fetch: fetchKnowledge as DataSourceConfig["fetch"],
  },
  {
    type: "profiles",
    sizeBytes: 50_000,
    expectedRows: 50,
    refreshHours: 24,
    ttlHours: 48 * 7,
    priority: "low",
    fetch: fetchProfiles as DataSourceConfig["fetch"],
  },
  {
    // Runtime cache only — no fetch; fresh when the SW cached tiles exist.
    type: "maps",
    sizeBytes: 8_000_000,
    expectedRows: 0,
    refreshHours: 24,
    ttlHours: 48,
    priority: "low",
    fetch: async (): Promise<[]> => [],
  },
];

/** Priority band order (used by the queue to order datasets). */
export const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export type { DataType } from "./types";

export function isDataType(value: unknown): value is DataType {
  return (
    typeof value === "string" &&
    (DATA_SOURCE_CONFIGS as unknown as Array<{ type: string }>).some((c) => c.type === value)
  );
}

/** Dataset config lookup (typesafe accessor used by the engine). */
export function configForType(type: DataType): DataSourceConfig<unknown> | undefined {
  return DATA_SOURCE_CONFIGS.find((c) => c.type === type);
}