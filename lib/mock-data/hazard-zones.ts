// ---------------------------------------------------------------------
// lib/mock-data/hazard-zones.ts — Phase 2 · Step 3 · Mock geo-fence.
//
// The citizen's risk status is derived from their saved location
// (localStorage `citizen_location`, written by the Phase 1 location
// setup) cross-referenced against this mock table of "Active Hazard
// Zones". This is the single edit point for demo state: bump a
// district's `status` (or add a `villageOverrides` entry) and the
// citizen dashboard SafetyHero reflects it on next load.
//
// Two match paths:
//   • manual  — exact district match (case-insensitive), then an
//               optional village-level escalation override
//   • gps     — nearest district centroid within MATCH_RADIUS_KM;
//               outside every fence the citizen is treated as SAFE
// ---------------------------------------------------------------------

/**
 * Citizen-facing risk status — the SafetyHero card's prop union.
 * Defined here (the data layer) so mock data, hooks and UI all import
 * one source of truth; SafetyHero re-exports it for convenience.
 */
export type SafetyStatus = "SAFE" | "WATCH" | "PREPARE" | "EVACUATE";

/** Shape of the saved location — mirrors the location setup page. */
export type CitizenLocation =
  | { type: "gps"; lat: number; lng: number; savedAt: string }
  | { type: "manual"; district: string; village: string; savedAt: string };

export type HazardZone = {
  /** District name — must match the location setup's district list. */
  district: string;
  /** District-level current risk. */
  status: SafetyStatus;
  /** Approximate district centre (lat, lng) for GPS reverse-matching. */
  lat: number;
  lng: number;
  /** Optional village-level escalation within the district. */
  villageOverrides?: Record<string, SafetyStatus>;
};

/** How far (km) a GPS fix may be from a district centre and still count. */
export const MATCH_RADIUS_KM = 60;

/**
 * Active hazard zones (mock). Districts mirror the setup page's list
 * (Patna, Gaya, Bhagalpur, Muzaffarpur, Darbhanga, Purnia).
 */
export const HAZARD_ZONES: HazardZone[] = [
  {
    district: "Patna",
    status: "WATCH",
    lat: 25.5941,
    lng: 85.1376,
    villageOverrides: { Barh: "EVACUATE", Danapur: "PREPARE" },
  },
  {
    district: "Gaya",
    status: "SAFE",
    lat: 24.7955,
    lng: 85.0002,
  },
  {
    district: "Bhagalpur",
    status: "WATCH",
    lat: 25.2425,
    lng: 86.9842,
  },
  {
    district: "Muzaffarpur",
    status: "PREPARE",
    lat: 26.1209,
    lng: 85.3647,
    villageOverrides: { Motipur: "EVACUATE" },
  },
  {
    district: "Darbhanga",
    status: "SAFE",
    lat: 26.1542,
    lng: 85.8918,
  },
  {
    district: "Purnia",
    status: "EVACUATE",
    lat: 25.7767,
    lng: 87.4755,
  },
];

/** Great-circle distance in km (haversine). */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export type ResolvedStatus = {
  /** Risk status for the SafetyHero card. */
  status: SafetyStatus;
  /** Human area label, e.g. "Kankarbagh, Patna". */
  area: string;
  /** The matched hazard zone, if any. */
  zone: HazardZone | null;
};

/**
 * Pure resolver — cross-references a saved location against the hazard
 * table. Exported for unit tests (the hook just wraps it in localStorage
 * reads + state).
 */
export function resolveSafetyStatus(location: CitizenLocation | null): ResolvedStatus {
  if (!location) {
    return { status: "SAFE", area: "Location not set", zone: null };
  }

  if (location.type === "manual") {
    const zone = HAZARD_ZONES.find(
      (z) => z.district.toLowerCase() === location.district.toLowerCase(),
    );
    if (!zone) {
      return {
        status: "SAFE",
        area: `${location.village}, ${location.district}`,
        zone: null,
      };
    }
    const override = zone.villageOverrides?.[location.village];
    return {
      status: override ?? zone.status,
      area: `${location.village}, ${location.district}`,
      zone,
    };
  }

  // GPS — nearest district centre within the match radius.
  let best: HazardZone | null = null;
  let bestDist = Infinity;
  for (const zone of HAZARD_ZONES) {
    const dist = haversineKm(location.lat, location.lng, zone.lat, zone.lng);
    if (dist < bestDist) {
      bestDist = dist;
      best = zone;
    }
  }
  if (!best || bestDist > MATCH_RADIUS_KM) {
    return { status: "SAFE", area: "Outside monitored zones", zone: null };
  }
  return { status: best.status, area: `${best.district} area`, zone: best };
}

/** savedAt ISO → "HH:MM:SS IST" for the hero's UPD readout. */
export function formatSavedAt(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
  return `${time} IST`;
}
