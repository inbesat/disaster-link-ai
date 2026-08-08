// ---------------------------------------------------------------------
// lib/settings/org-settings.ts — Organization & District (Phase 5).
//
// Pure model + sanitizer + localStorage accessors for organization
// admin state: districts, per-district flood thresholds and global
// operational parameters. Every Phase 5 card reads/writes this one
// snapshot so the Admin UI is consistent and survives refresh.
// ---------------------------------------------------------------------

export type OrgBoundaryInfo = {
  name: string;
  sizeBytes: number;
  featureCount: number;
};

export type OrgDistrict = {
  id: string;
  name: string;
  state: string;
  centerLat: number;
  centerLng: number;
  active: boolean;
  geojsonActive: boolean;
  boundary: OrgBoundaryInfo | null;
};

/** Per-district local calibration — rainfall marks in mm/24h, river in metres. */
export type DistrictThresholds = {
  warningRain: number;
  criticalRain: number;
  warningRiver: number;
  criticalRiver: number;
};

export type OrgOperationalParams = {
  /** Shelter capacity % that triggers a Control Room warning. */
  shelterCapacityWarning: number;
  /** Flag a depot as low at or below this many units. */
  resourceLowStockThreshold: number;
  /** Auto-fire evacuations when a Level 4 Crisis is predicted. */
  autoEvacuation: boolean;
};

export type OrgSettings = {
  districts: OrgDistrict[];
  /** Calibration marks keyed by district id. */
  thresholds: Record<string, DistrictThresholds>;
  params: OrgOperationalParams;
};

export const DRIP_ORG_SETTINGS_KEY = "drip_org_settings_v1";

const BOUNDARY_PATNA: OrgBoundaryInfo = {
  name: "patna_boundary.geojson",
  sizeBytes: 184_320,
  featureCount: 1,
};

const BOUNDARY_ERNAKULAM: OrgBoundaryInfo = {
  name: "ernakulam_boundary.geojson",
  sizeBytes: 133_120,
  featureCount: 1,
};

export const DEFAULT_DISTRICTS: OrgDistrict[] = [
  {
    id: "d1",
    name: "Patna",
    state: "Bihar",
    centerLat: 25.5941,
    centerLng: 85.1376,
    active: true,
    geojsonActive: true,
    boundary: BOUNDARY_PATNA,
  },
  {
    id: "d2",
    name: "Ernakulam",
    state: "Kerala",
    centerLat: 9.9816,
    centerLng: 76.2999,
    active: true,
    geojsonActive: true,
    boundary: BOUNDARY_ERNAKULAM,
  },
  {
    id: "d3",
    name: "Purba Champaran",
    state: "Bihar",
    centerLat: 26.6587,
    centerLng: 84.9169,
    active: false,
    geojsonActive: false,
    boundary: null,
  },
];

export const DEFAULT_THRESHOLDS: Record<string, DistrictThresholds> = {
  d1: { warningRain: 100, criticalRain: 200, warningRiver: 2.5, criticalRiver: 3.8 },
  d2: { warningRain: 110, criticalRain: 220, warningRiver: 1.8, criticalRiver: 3.0 },
  d3: { warningRain: 90, criticalRain: 180, warningRiver: 2.2, criticalRiver: 3.4 },
};

export const DEFAULT_ORG_PARAMS: OrgOperationalParams = {
  shelterCapacityWarning: 80,
  resourceLowStockThreshold: 10,
  autoEvacuation: false,
};

export function cloneDefaultOrgSettings(): OrgSettings {
  return {
    districts: DEFAULT_DISTRICTS.map((d) => ({ ...d, boundary: d.boundary ? { ...d.boundary } : null })),
    thresholds: Object.fromEntries(
      Object.entries(DEFAULT_THRESHOLDS).map(([id, t]) => [id, { ...t }]),
    ),
    params: { ...DEFAULT_ORG_PARAMS },
  };
}

function sanitizeDistrict(raw: unknown): OrgDistrict | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.name !== "string" || typeof d.id !== "string") return null;
  const lat = Number(d.centerLat);
  const lng = Number(d.centerLng);
  const boundary =
    d.boundary && typeof d.boundary === "object"
      ? {
          name: String((d.boundary as Record<string, unknown>).name ?? "boundary.geojson"),
          sizeBytes: Number((d.boundary as Record<string, unknown>).sizeBytes ?? 0),
          featureCount: Number((d.boundary as Record<string, unknown>).featureCount ?? 1),
        }
      : null;
  return {
    id: d.id,
    name: String(d.name),
    state: typeof d.state === "string" ? d.state : "Unknown",
    centerLat: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : 0,
    centerLng: Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : 0,
    active: d.active === true,
    geojsonActive: d.geojsonActive === true,
    boundary,
  };
}

function sanitizeThreshold(v: unknown): DistrictThresholds {
  const t = (v ?? {}) as Record<string, unknown>;
  const num = (key: string, fallback: number) =>
    typeof t[key] === "number" && Number.isFinite(t[key] as number)
      ? (t[key] as number)
      : fallback;
  return {
    warningRain: num("warningRain", 100),
    criticalRain: num("criticalRain", 200),
    warningRiver: num("warningRiver", 2.5),
    criticalRiver: num("criticalRiver", 3.8),
  };
}

/** Guarded merge — corrupt or partial snapshots never break org settings. */
export function mergeOrgSettings(raw: unknown): OrgSettings {
  const base = cloneDefaultOrgSettings();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;

  if (Array.isArray(data.districts)) {
    const districts = data.districts
      .map(sanitizeDistrict)
      .filter((d): d is OrgDistrict => d !== null);
    if (districts.length) base.districts = districts;
  }

  if (data.thresholds && typeof data.thresholds === "object") {
    for (const id of Object.keys(base.thresholds)) {
      const stored = (data.thresholds as Record<string, unknown>)[id];
      if (stored !== undefined) base.thresholds[id] = sanitizeThreshold(stored);
    }
    // keep any persisted district that is missing from the keyed defaults
    for (const id of Object.keys(data.thresholds)) {
      if (!base.thresholds[id]) base.thresholds[id] = sanitizeThreshold((data.thresholds as Record<string, unknown>)[id]);
    }
  }

  if (data.params && typeof data.params === "object") {
    const p = data.params as Record<string, unknown>;
    if (typeof p.shelterCapacityWarning === "number") {
      base.params.shelterCapacityWarning = clamp(p.shelterCapacityWarning, 50, 95);
    }
    if (typeof p.resourceLowStockThreshold === "number") {
      base.params.resourceLowStockThreshold = Math.max(0, Math.round(p.resourceLowStockThreshold));
    }
    if (typeof p.autoEvacuation === "boolean") {
      base.params.autoEvacuation = p.autoEvacuation;
    }
  }

  return base;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function readStoredOrgSettings(): OrgSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRIP_ORG_SETTINGS_KEY);
    if (!raw) return null;
    return mergeOrgSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredOrgSettings(settings: OrgSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRIP_ORG_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage full / blocked — ignore for the demo
  }
}