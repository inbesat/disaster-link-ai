// ---------------------------------------------------------------------
// lib/mock-data/gov-alert-targets.ts — Phase 11 · Steps 1–2 ·
// Omni-Channel Alert Composer data layer.
//
// Pure, SSR-safe definitions behind the gov Alert Composer:
//   • Alert type / severity / channel catalogues (the form's option sets)
//   • Target-area vocabularies — districts, villages, district centres
//   • A deterministic mock recipient estimator (base population ×
//     target-area fraction × severity factor × per-channel reach) so the
//     composer can show "≈ 4.2M people via SMS" live as the official
//     composes, without any backend.
//   • polygonAreaKm2() — spherical area of the drawn alert polygon
//     (turf `area`), used both as the polygon-mode coverage fraction
//     and shown on the map panel as "Alert radius ≈ 12.4 km²".
//
// No React, no `window` — unit-testable and importable from anywhere.
// ---------------------------------------------------------------------

import { area as turfArea, polygon } from "@turf/turf";

/** The three alert kinds the composer can raise. */
export type GovAlertType = "flood_warning" | "evac_order" | "road_closure";

/** Severity ladder — maps to the roadmap's watch/warning/critical. */
export type GovAlertSeverity = "watch" | "warning" | "critical";

/** Delivery channels (multi-select). */
export type GovAlertChannel = "push" | "sms" | "whatsapp" | "voice";

/** Target-area modes (the Step 2 mini-map selector). */
export type AlertTargetMode = "entire" | "villages" | "polygon";

export type GovAlertTypeMeta = {
  value: GovAlertType;
  label: string;
  short: string;
  emoji: string;
};

export const GOV_ALERT_TYPES: GovAlertTypeMeta[] = [
  { value: "flood_warning", label: "Flood Warning", short: "Flood", emoji: "🌊" },
  { value: "evac_order", label: "Evacuation Order", short: "Evac", emoji: "🛟" },
  { value: "road_closure", label: "Road Closure", short: "Road", emoji: "🚧" },
];

export type GovSeverityMeta = {
  value: GovAlertSeverity;
  label: string;
  /** Live-pill tone classes (active state) for the segmented control. */
  tone: string;
  /** Dot color for summary rows. */
  dot: string;
};

export const GOV_SEVERITIES: GovSeverityMeta[] = [
  {
    value: "watch",
    label: "Watch",
    tone: "border-severity-amber-500/70 bg-severity-amber-500/15 text-severity-amber-300",
    dot: "bg-severity-amber-500",
  },
  {
    value: "warning",
    label: "Warning",
    tone: "border-orange-500/70 bg-orange-500/15 text-orange-300",
    dot: "bg-orange-500",
  },
  {
    value: "critical",
    label: "Critical",
    tone: "border-severity-red-500/70 bg-severity-red-500/15 text-severity-red-300",
    dot: "bg-severity-red-500",
  },
];

export type GovChannelMeta = {
  value: GovAlertChannel;
  label: string;
  /** General-purpose channel hint shown under the pill. */
  hint: string;
};

export const GOV_ALERT_CHANNELS: GovChannelMeta[] = [
  { value: "push", label: "In-App Push", hint: "Installed app devices" },
  { value: "sms", label: "SMS", hint: "All registered mobiles" },
  { value: "whatsapp", label: "WhatsApp", hint: "Business API broadcast" },
  { value: "voice", label: "Voice Call", hint: "Critical-only IVR blast" },
];

/** Districts the gov command center manages (mirrors SituationHeader). */
export const GOV_DISTRICTS = ["Patna", "Ernakulam", "Kamrup"] as const;

export type GovDistrictCenter = {
  district: string;
  lat: number;
  lng: number;
  /** Approximate district area (km²) — used for polygon coverage %. */
  areaKm2: number;
  /** Approximate district population — base of the recipient estimate. */
  population: number;
};

export const GOV_DISTRICT_CENTERS: Record<string, GovDistrictCenter> = {
  Patna: {
    district: "Patna",
    lat: 25.5941,
    lng: 85.1376,
    areaKm2: 3202,
    population: 4_630_000,
  },
  Ernakulam: {
    district: "Ernakulam",
    lat: 10.0,
    lng: 76.28,
    areaKm2: 3068,
    population: 3_509_000,
  },
  Kamrup: {
    district: "Kamrup",
    lat: 26.15,
    lng: 91.66,
    areaKm2: 4345,
    population: 4_400_000,
  },
};

export type AlertVillage = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

/** Mock villages of the Patna demo district for "Select Villages" targeting. */
export const GOV_ALERT_VILLAGES: AlertVillage[] = [
  { id: "v01", name: "Barh", lat: 25.475, lng: 85.71 },
  { id: "v02", name: "Danapur", lat: 25.64, lng: 85.052 },
  { id: "v03", name: "Fatuha", lat: 25.514, lng: 85.306 },
  { id: "v04", name: "Masaurhi", lat: 25.35, lng: 85.031 },
  { id: "v05", name: "Maner", lat: 25.645, lng: 84.872 },
  { id: "v06", name: "Bihta", lat: 25.557, lng: 84.883 },
  { id: "v07", name: "Punpun", lat: 25.492, lng: 84.934 },
  { id: "v08", name: "Naubatpur", lat: 25.524, lng: 85.242 },
  { id: "v09", name: "Khagaul", lat: 25.626, lng: 85.047 },
  { id: "v10", name: "Khusrupur", lat: 25.527, lng: 85.423 },
  { id: "v11", name: "Paliganj", lat: 25.421, lng: 84.911 },
  { id: "v12", name: "Sampatchak", lat: 25.561, lng: 85.177 },
];

/**
 * Official-sounding message templates per alert type. The composer's
 * "Use official template" button fills the message area with these.
 */
export const GOV_ALERT_TEMPLATES: Record<GovAlertType, (district: string) => string> = {
  flood_warning: (district) =>
    `HEAVY RAIN WARNING — ${district} District\n\nHeavy rainfall in the catchment has pushed river levels above the danger mark. Low-lying areas along the river may experience waterlogging in the next 12–24 hours.\n\nAct now:\n- Move vehicles and livestock to higher ground\n- Keep documents, medicines and a torch ready\n- Follow instructions from local authorities`,
  evac_order: (district) =>
    `EVACUATION ORDER — ${district} District\n\nWater levels are rising. Evacuation is MANDATORY from the marked low-lying zones. Proceed immediately to the relief shelter assigned to your village.\n\n- Carry ID, medicines and phone chargers\n- Transport is available at assembly points\n- Do not return until authorities say it is safe`,
  road_closure: (district) =>
    `ROAD CLOSURE NOTICE — ${district} District\n\nThe following roads are closed to traffic until further notice:\n- Bailey Road riverfront stretch\n- NH-31 slip road near the bridge\n- Service road between Danapur and Maner\n\nUse the marked diversion routes. Never attempt to cross flooded stretches on foot or in vehicles.`,
};

/**
 * Deterministic mock reach: what fraction of a channel target actually
 * receives each alert type. These are static demo constants, not measurements.
 */
const CHANNEL_REACH: Record<GovAlertChannel, number> = {
  push: 0.9,
  sms: 0.8,
  whatsapp: 0.85,
  voice: 0.3,
};

/**
 * Severity scales the recipient footprint: a critical alert reaches more
 * people because the target zone widens and every avenue is pursued.
 */
const SEVERITY_FACTOR: Record<GovAlertSeverity, number> = {
  watch: 1,
  warning: 1.2,
  critical: 1.45,
};

export type RecipientRow = {
  channel: GovAlertChannel;
  label: string;
  count: number;
};

export type RecipientEstimate = {
  /** Human target label, e.g. "Entire Patna district". */
  targetLabel: string;
  /** Total overlapping reach across all selected channels. */
  total: number;
  /** Per-channel reach rows (unselected channels omitted). */
  perChannel: RecipientRow[];
};

/**
 * Estimate the people an alert will reach. Pure + deterministic:
 *
 *   count = districtPopulation × targetAreaFraction × severityFactor
 *   perChannel = count × CHANNEL_REACH[channel]
 *
 * Target-area fraction depends on the mode:
 *   entire   → 1
 *   villages → selectedVillages / GOV_ALERT_VILLAGES.length (min 5%)
 *   polygon  → clamp(polygonAreaKm2 / districtAreaKm2, 2%, 100%)
 */
export function estimateRecipients(opts: {
  district: string;
  severity: GovAlertSeverity;
  channels: GovAlertChannel[];
  mode: AlertTargetMode;
  selectedVillages: number;
  polygonAreaKm2: number;
}): RecipientEstimate {
  const center = GOV_DISTRICT_CENTERS[opts.district] ?? GOV_DISTRICT_CENTERS["Patna"];
  const channels: GovAlertChannel[] = opts.channels.length > 0 ? opts.channels : ["push"];

  let areaFraction = 1;
  let targetLabel = `Entire ${center.district} district`;
  if (opts.mode === "villages") {
    areaFraction = Math.max(0.05, opts.selectedVillages / GOV_ALERT_VILLAGES.length);
    targetLabel = `${opts.selectedVillages} village${
      opts.selectedVillages === 1 ? "" : "s"
    } · ${center.district}`;
  } else if (opts.mode === "polygon") {
    areaFraction = Math.min(1, Math.max(0.02, opts.polygonAreaKm2 / center.areaKm2));
    targetLabel = `Drawn polygon · ${center.district}`;
  }

  const base = center.population * areaFraction * SEVERITY_FACTOR[opts.severity];

  const perChannel: RecipientRow[] = channels.map((channel) => {
    const meta = GOV_ALERT_CHANNELS.find((c) => c.value === channel)!;
    return {
      channel,
      label: meta.label,
      count: Math.round(base * CHANNEL_REACH[channel]),
    };
  });

  return {
    targetLabel,
    total: perChannel.reduce((sum, row) => sum + row.count, 0),
    perChannel,
  };
}

/** Spherical polygon area in km² (turf `area`). 0 when fewer than 3 points. */
export function polygonAreaKm2(coords: readonly [number, number][]): number {
  if (coords.length < 3) return 0;
  const ring = [...coords, coords[0]];
  return turfArea(polygon([ring])) / 1_000_000;
}

/** Compact Indian-style magnitude rendering: 4,630,000 → "4.6M". */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${trimFraction(n / 1_000_000)}M`;
  if (n >= 1_000) return `${trimFraction(n / 1_000)}K`;
  return String(n);
}

/** One decimal only when the value isn't a whole number. */
function trimFraction(x: number): string {
  return Number.isInteger(x) ? String(x) : x.toFixed(1);
}
