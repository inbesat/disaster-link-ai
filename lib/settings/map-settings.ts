// ---------------------------------------------------------------------
// lib/settings/map-settings.ts — Map & GIS Settings (Phase 3).
//
// Pure, framework-free model for the tactical map display preferences.
// Everything the /settings/map page can tweak lives here as a single
// MapSettings snapshot, persisted to localStorage under
// DRIP_MAP_SETTINGS_KEY so the main /dashboard command-center map (and any
// other map surface) can rehydrate the exact same configuration.
//
// The module is deliberately side-effect free (no window/React access) so
// the merge/sanitize logic is unit-testable under node.
// ---------------------------------------------------------------------

export const DRIP_MAP_SETTINGS_KEY = "drip_map_settings_v1";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export type MapUnits = "metric" | "imperial";
export type CoordinateFormat = "dd" | "dms";
export type MapBasemapStyle =
  | "satellite"
  | "terrain"
  | "street"
  | "tactical_dark";
export type RefreshInterval =
  | "realtime"
  | "off"
  | "30s"
  | "1m"
  | "5m"
  | "15m";
export type FocusDistrict = string | null; // null → global view

export type MapLayerPreferences = {
  floodZones: boolean;
  shelters: boolean;
  resources: boolean;
  evacRoutes: boolean;
  responderPositions: boolean;
  roadClosures: boolean;
  groundReports: boolean;
};

export type DefaultViewSettings = {
  center: { lat: number; lng: number };
  zoom: number;
  focusDistrict: FocusDistrict;
};

export type DisplaySettings = {
  units: MapUnits;
  coordinateFormat: CoordinateFormat;
  basemapStyle: MapBasemapStyle;
  showDistrictLabels: boolean;
  showSeverityHeat: boolean;
  showScaleBar: boolean;
};

export type OfflineCacheSettings = {
  enabled: boolean;
  refreshInterval: RefreshInterval;
  /** Districts pre-downloaded for offline use. */
  cachedRegions: string[];
  /** Current offline footprint in MB. */
  cacheSizeMb: number;
  /** Operator-set storage ceiling: 100 | 500 | 1024 (1GB) | 2048 (2GB). */
  sizeLimitMb: number;
};

/** Opacity (0–1) applied to each flood-risk band when rendering hazard zones. */
export type FloodOpacityLevels = {
  safe: number;
  watch: number;
  warning: number;
  evacuate: number;
};

export type HazardVisualSettings = {
  floodOpacities: FloodOpacityLevels;
  /** Auto-preset: zero out Safe/Watch, max out Warning/Evacuate. */
  highlightCriticalZonesOnly: boolean;
};

export type PerformanceSettings = {
  /** Master switch: smooth pan/zoom, pulsing markers, animated routes. */
  animationsEnabled: boolean;
  /** Heavy 3D terrain layer (biggest battery drain on field devices). */
  terrain3d: boolean;
  /** Low-End Device preset: no animations, manual refresh, terrain off. */
  ecoMode: boolean;
};

export type AccessibilitySettings = {
  /** Replaces red/green severity with blue/orange + patterns for CVD users. */
  colorblindMode: boolean;
  /** Thickens road outlines and enlarges map-label fonts. */
  highContrast: boolean;
};

export type MapSettings = {
  defaultView: DefaultViewSettings;
  layers: MapLayerPreferences;
  display: DisplaySettings;
  hazards: HazardVisualSettings;
  performance: PerformanceSettings;
  accessibility: AccessibilitySettings;
  cache: OfflineCacheSettings;
};

// ---------------------------------------------------------------------
// Defaults — mirror the shipped tactical view (global start, all layers on).
// ---------------------------------------------------------------------

export const DEFAULT_MAP_CENTER = { lat: 22, lng: 20 };
export const DEFAULT_MAP_ZOOM = 12;
export const DEFAULT_FOCUS_DISTRICT: FocusDistrict = null;

export const DEFAULT_LAYER_PREFERENCES: MapLayerPreferences = {
  floodZones: true,
  shelters: true,
  resources: true,
  evacRoutes: false,
  responderPositions: true,
  roadClosures: true,
  groundReports: true,
};

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  units: "metric",
  coordinateFormat: "dd",
  basemapStyle: "tactical_dark",
  showDistrictLabels: true,
  showSeverityHeat: true,
  showScaleBar: true,
};

export const DEFAULT_CACHE_SETTINGS: OfflineCacheSettings = {
  enabled: true,
  refreshInterval: "1m",
  cachedRegions: ["Patna", "Bihar Floodplain"],
  cacheSizeMb: 42,
  sizeLimitMb: 1024,
};

export const DEFAULT_HAZARD_SETTINGS: HazardVisualSettings = {
  floodOpacities: {
    safe: 0.15,
    watch: 0.3,
    warning: 0.55,
    evacuate: 0.8,
  },
  highlightCriticalZonesOnly: false,
};

export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  animationsEnabled: true,
  terrain3d: true,
  ecoMode: false,
};

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  colorblindMode: false,
  highContrast: false,
};

export const DEFAULT_MAP_SETTINGS: MapSettings = {
  defaultView: {
    center: { ...DEFAULT_MAP_CENTER },
    zoom: DEFAULT_MAP_ZOOM,
    focusDistrict: DEFAULT_FOCUS_DISTRICT,
  },
  layers: { ...DEFAULT_LAYER_PREFERENCES },
  display: { ...DEFAULT_DISPLAY_SETTINGS },
  hazards: { ...DEFAULT_HAZARD_SETTINGS },
  performance: { ...DEFAULT_PERFORMANCE_SETTINGS },
  accessibility: { ...DEFAULT_ACCESSIBILITY_SETTINGS },
  cache: { ...DEFAULT_CACHE_SETTINGS },
};

// ---------------------------------------------------------------------
// Guard helpers
// ---------------------------------------------------------------------

const UNITS: MapUnits[] = ["metric", "imperial"];
const COORDINATE_FORMATS: CoordinateFormat[] = ["dd", "dms"];
const BASEMAPS: MapBasemapStyle[] = [
  "satellite",
  "terrain",
  "street",
  "tactical_dark",
];
const REFRESH_OPTIONS: RefreshInterval[] = [
  "realtime",
  "off",
  "30s",
  "1m",
  "5m",
  "15m",
];
const CACHE_SIZE_LIMITS = [100, 500, 1024, 2048];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeLayers(raw: unknown): MapLayerPreferences {
  const out = { ...DEFAULT_LAYER_PREFERENCES };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(out) as (keyof MapLayerPreferences)[]) {
    if (typeof src[key] === "boolean") out[key] = src[key] as boolean;
  }
  return out;
}

function sanitizeDisplay(raw: unknown): DisplaySettings {
  const out = { ...DEFAULT_DISPLAY_SETTINGS };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  if (typeof src.units === "string" && UNITS.includes(src.units as MapUnits)) {
    out.units = src.units as MapUnits;
  }
  if (
    typeof src.coordinateFormat === "string" &&
    COORDINATE_FORMATS.includes(src.coordinateFormat as CoordinateFormat)
  ) {
    out.coordinateFormat = src.coordinateFormat as CoordinateFormat;
  }
  if (
    typeof src.basemapStyle === "string" &&
    BASEMAPS.includes(src.basemapStyle as MapBasemapStyle)
  ) {
    out.basemapStyle = src.basemapStyle as MapBasemapStyle;
  }
  for (const key of ["showDistrictLabels", "showSeverityHeat", "showScaleBar"] as const) {
    if (typeof src[key] === "boolean") out[key] = src[key] as boolean;
  }
  return out;
}

function sanitizeCache(raw: unknown): OfflineCacheSettings {
  const out = { ...DEFAULT_CACHE_SETTINGS };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  if (typeof src.enabled === "boolean") out.enabled = src.enabled as boolean;
  if (
    typeof src.refreshInterval === "string" &&
    REFRESH_OPTIONS.includes(src.refreshInterval as RefreshInterval)
  ) {
    out.refreshInterval = src.refreshInterval as RefreshInterval;
  }
  if (Array.isArray(src.cachedRegions)) {
    out.cachedRegions = src.cachedRegions.filter(
      (r): r is string => typeof r === "string",
    );
  }
  if (isFiniteNumber(src.cacheSizeMb)) {
    out.cacheSizeMb = Math.max(Math.round(src.cacheSizeMb), 0);
  }
  if (
    isFiniteNumber(src.sizeLimitMb) &&
    CACHE_SIZE_LIMITS.includes(src.sizeLimitMb)
  ) {
    out.sizeLimitMb = src.sizeLimitMb;
  }
  return out;
}

// ---------------------------------------------------------------------
// Merge / sanitize (pure, testable)
// ---------------------------------------------------------------------

function sanitizeHazards(raw: unknown): HazardVisualSettings {
  const out: HazardVisualSettings = {
    floodOpacities: { ...DEFAULT_HAZARD_SETTINGS.floodOpacities },
    highlightCriticalZonesOnly:
      DEFAULT_HAZARD_SETTINGS.highlightCriticalZonesOnly,
  };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;

  if (typeof src.highlightCriticalZonesOnly === "boolean") {
    out.highlightCriticalZonesOnly = src.highlightCriticalZonesOnly;
  }

  const opacities = src.floodOpacities as Record<string, unknown> | undefined;
  if (opacities && typeof opacities === "object") {
    for (const key of Object.keys(out.floodOpacities) as (keyof FloodOpacityLevels)[]) {
      if (isFiniteNumber(opacities[key])) {
        out.floodOpacities[key] = Math.min(Math.max(opacities[key], 0), 1);
      }
    }
  }

  return out;
}

function sanitizePerformance(raw: unknown): PerformanceSettings {
  const out = { ...DEFAULT_PERFORMANCE_SETTINGS };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(out) as (keyof PerformanceSettings)[]) {
    if (typeof src[key] === "boolean") out[key] = src[key] as boolean;
  }
  return out;
}

function sanitizeAccessibility(raw: unknown): AccessibilitySettings {
  const out = { ...DEFAULT_ACCESSIBILITY_SETTINGS };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(out) as (keyof AccessibilitySettings)[]) {
    if (typeof src[key] === "boolean") out[key] = src[key] as boolean;
  }
  return out;
}

export function mergeMapSettings(raw: unknown): MapSettings {
  const base: MapSettings = {
    defaultView: {
      center: { ...DEFAULT_MAP_CENTER },
      zoom: DEFAULT_MAP_ZOOM,
      focusDistrict: DEFAULT_FOCUS_DISTRICT,
    },
    layers: { ...DEFAULT_LAYER_PREFERENCES },
    display: { ...DEFAULT_DISPLAY_SETTINGS },
    hazards: {
      floodOpacities: { ...DEFAULT_HAZARD_SETTINGS.floodOpacities },
      highlightCriticalZonesOnly:
        DEFAULT_HAZARD_SETTINGS.highlightCriticalZonesOnly,
    },
    performance: { ...DEFAULT_PERFORMANCE_SETTINGS },
    accessibility: { ...DEFAULT_ACCESSIBILITY_SETTINGS },
    cache: { ...DEFAULT_CACHE_SETTINGS },
  };

  if (!raw || typeof raw !== "object") return base;

  const data = raw as Record<string, unknown>;

  // defaultView
  const view = data.defaultView as Record<string, unknown> | undefined;
  if (view && typeof view === "object") {
    const center = view.center as Record<string, unknown> | undefined;
    if (center && typeof center === "object") {
      if (isFiniteNumber(center.lat)) base.defaultView.center.lat = center.lat;
      if (isFiniteNumber(center.lng)) base.defaultView.center.lng = center.lng;
    }
    if (isFiniteNumber(view.zoom)) {
      base.defaultView.zoom = Math.min(Math.max(view.zoom, 1), 20);
    }
    if (view.focusDistrict === null || typeof view.focusDistrict === "string") {
      base.defaultView.focusDistrict =
        typeof view.focusDistrict === "string" ? view.focusDistrict : null;
    }
  }

  base.layers = sanitizeLayers(data.layers);
  base.display = sanitizeDisplay(data.display);
  base.hazards = sanitizeHazards(data.hazards);
  base.performance = sanitizePerformance(data.performance);
  base.accessibility = sanitizeAccessibility(data.accessibility);
  base.cache = sanitizeCache(data.cache);

  return base;
}

/** Deep copy of the defaults — callers never mutate the shared const. */
export function cloneDefaultMapSettings(): MapSettings {
  return mergeMapSettings(null);
}

// ---------------------------------------------------------------------
// Storage accessors (guarded for SSR — no window at module scope)
// ---------------------------------------------------------------------

export function readStoredMapSettings(): MapSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRIP_MAP_SETTINGS_KEY);
    if (!raw) return null;
    return mergeMapSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredMapSettings(settings: MapSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRIP_MAP_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage full / unavailable — in-memory context still drives the page
  }
}