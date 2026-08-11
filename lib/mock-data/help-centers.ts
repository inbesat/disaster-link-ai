// ---------------------------------------------------------------------
// lib/mock-data/help-centers.ts — Phase 1 · Step 4 · Disaster Management
// Center Directory data.
//
// Mock "Nearby Help Centers" for the public dashboard: NDRF offices,
// police stations, hospitals and fire stations around the demo district
// (Patna). Pure + SSR-safe: coordinates are explicit so the component can
// compute distances, plot emoji pins on the mini-map, and unit tests can
// assert on the data + helpers without a DOM.
// ---------------------------------------------------------------------

export type HelpCenterType = "ndrf" | "police" | "hospital" | "fire";

export type HelpCenterStatus = "open" | "overloaded";

export type HelpCenterTag = "medical" | "247" | "rescue";

export type HelpCenter = {
  id: string;
  name: string;
  type: HelpCenterType;
  lat: number;
  lng: number;
  /** Walking distance from the default citizen location, in km. */
  distanceKm: number;
  hours: string;
  status: HelpCenterStatus;
  /** Short emergency number, e.g. "112". */
  phone: string;
  tags: HelpCenterTag[];
};

/** Distinct emoji per center type for the mini-map + card avatar. */
export const CENTER_TYPE_EMOJI: Record<HelpCenterType, string> = {
  ndrf: "🚨",
  police: "🚓",
  hospital: "🏥",
  fire: "🚒",
};

export const CENTER_TYPE_LABEL: Record<HelpCenterType, string> = {
  ndrf: "NDRF",
  police: "Police",
  hospital: "Hospital",
  fire: "Fire",
};

/** Filter chip options (All is implicit). */
export type CenterFilter = "all" | "medical" | "247" | "rescue";

export const CENTER_FILTERS: ReadonlyArray<{
  key: CenterFilter;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "medical", label: "Medical" },
  { key: "247", label: "24/7" },
  { key: "rescue", label: "Rescue" },
];

/**
 * Mock centers around Patna (25.5941, 85.1376 — the default citizen
 * location used across the citizen map + dashboards). Distances are
 * hardcoded walking ranges matching the hand-placed coordinates.
 */
export const HELP_CENTERS: HelpCenter[] = [
  {
    id: "ndrf-9th-bn",
    name: "NDRF 9th Battalion HQ",
    type: "ndrf",
    lat: 25.604,
    lng: 85.083,
    distanceKm: 1.6,
    hours: "24/7",
    status: "open",
    phone: "011-24363260",
    tags: ["rescue", "247"],
  },
  {
    id: "police-gandhi-maidan",
    name: "Gandhi Maidan Police Station",
    type: "police",
    lat: 25.607,
    lng: 85.151,
    distanceKm: 0.9,
    hours: "24/7",
    status: "open",
    phone: "0612-2211221",
    tags: ["rescue", "247"],
  },
  {
    id: "hospital-pmch",
    name: "Patna Medical College & Hospital",
    type: "hospital",
    lat: 25.602,
    lng: 85.13,
    distanceKm: 1.2,
    hours: "24/7",
    status: "overloaded",
    phone: "0612-2301694",
    tags: ["medical", "247"],
  },
  {
    id: "hospital-aiims",
    name: "AIIMS Patna",
    type: "hospital",
    lat: 25.5941,
    lng: 85.1376,
    distanceKm: 4.2,
    hours: "08:00–20:00",
    status: "open",
    phone: "0612-2457000",
    tags: ["medical"],
  },
  {
    id: "fire-kadamkuan",
    name: "Kadamkuan Fire Station",
    type: "fire",
    lat: 25.609,
    lng: 85.159,
    distanceKm: 1.4,
    hours: "24/7",
    status: "open",
    phone: "0612-2330214",
    tags: ["rescue", "247"],
  },
  {
    id: "police-kankarbagh",
    name: "Kankarbagh Police Station",
    type: "police",
    lat: 25.589,
    lng: 85.19,
    distanceKm: 3.1,
    hours: "24/7",
    status: "overloaded",
    phone: "0612-2354545",
    tags: ["rescue", "247"],
  },
];

/** Centers matching a filter chip. "all" returns every center. */
export function filterHelpCenters(
  centers: readonly HelpCenter[],
  filter: CenterFilter,
): HelpCenter[] {
  if (filter === "all") return [...centers];
  return centers.filter((c) => c.tags.includes(filter));
}

/**
 * Project centers onto a normalised 0–100 x/y grid (lat → y, lng → x,
 * north-up) so the mini-map can place emoji pins. Returns percentages the
 * component can drop straight into `style={{ left: `${x}%`, top: `${y}%` }}`.
 */
export type CenterPlotPoint = {
  center: HelpCenter;
  x: number;
  y: number;
};

export function plotHelpCenters(
  centers: readonly HelpCenter[],
  padding = 12,
): CenterPlotPoint[] {
  if (centers.length === 0) return [];
  const lats = centers.map((c) => c.lat);
  const lngs = centers.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;

  return centers.map((center) => ({
    center,
    // lat ↑ = north = top; lng → = east = right. Clamp inside the padded
    // box so pins never overflow the map's rounded corners.
    y: padding + (1 - (center.lat - minLat) / spanLat) * (100 - padding * 2),
    x: padding + ((center.lng - minLng) / spanLng) * (100 - padding * 2),
  }));
}
