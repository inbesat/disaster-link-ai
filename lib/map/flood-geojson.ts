// ---------------------------------------------------------------------
// Generates a mock GeoJSON FeatureCollection of flood inundation polygons
// around a center point using @turf/turf. Used to visualise ML predictions
// on the map (Phase 6).
//
// Bigger + deeper polygons when risk is higher / the forecast is farther
// ahead. Properties carry the styling + analysis hooks the UI reads.
// ---------------------------------------------------------------------

import { circle, destination, bbox, booleanPointInPolygon } from "@turf/turf";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";

export type FloodRiskLevel = "low" | "medium" | "high" | "critical";

type Zone = {
  center: [number, number];
  radiusKm: number;
  riskLevel: FloodRiskLevel;
  depthMeters: number;
  population: number;
};

const RISK_META: Record<
  FloodRiskLevel,
  { depthMin: number; depthMax: number; baseRadius: number; weight: number }
> = {
  low: { depthMin: 0.3, depthMax: 1.0, baseRadius: 1.2, weight: 0.35 },
  medium: { depthMin: 1.0, depthMax: 2.0, baseRadius: 2.0, weight: 0.6 },
  high: { depthMin: 2.0, depthMax: 3.5, baseRadius: 3.2, weight: 0.85 },
  critical: { depthMin: 3.5, depthMax: 6.0, baseRadius: 4.5, weight: 1.0 },
};

const SEVERITY_ORDER: FloodRiskLevel[] = ["low", "medium", "high", "critical"];

// Small deterministic PRNG so the geometry is stable per (lat,lng) seed,
// avoiding layout jitter on every render.
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function downgrade(level: FloodRiskLevel, steps: number): FloodRiskLevel {
  const idx = SEVERITY_ORDER.indexOf(level);
  const fallback = Math.max(0, idx - steps);
  return SEVERITY_ORDER[fallback];
}

function buildZones(
  centerLat: number,
  centerLng: number,
  riskLevel: FloodRiskLevel,
  hoursAhead: number,
): Zone[] {
  const meta = RISK_META[riskLevel];

  // Growth factor: higher severity + farther forecast = wider spread.
  const timeFactor = 1 + hoursAhead / 168; // linear up to ~7 days ahead
  const scale = Math.max(1, timeFactor * (0.7 + meta.weight * 0.5));
  const baseRadiusKm = meta.baseRadius * scale;

  const seed = centerLat * 1000 + centerLng;
  const zones: Zone[] = [];

  const addZone = (center: [number, number], radiusKm: number, level: FloodRiskLevel) => {
    const m = RISK_META[level];
    const r = seeded(radiusKm * 13.37 + seed);
    const depthMeters = Number((m.depthMin + (m.depthMax - m.depthMin) * r).toFixed(2));
    const population = Math.round(
      radiusKm * radiusKm * 2400 * (0.4 + m.weight) * (0.5 + r),
    );
    zones.push({ center, radiusKm, riskLevel: level, depthMeters, population });
  };

  // Primary (dominant) zone on the centre.
  addZone([centerLng, centerLat], baseRadiusKm, riskLevel);

  // A belt of lower-severity satellite rings.
  const satellites: { bearing: number; dist: number; size: number; steps: number }[] = [
    { bearing: 65, dist: 0.7, size: 0.55, steps: 1 },
    { bearing: 180, dist: 0.9, size: 0.5, steps: 1 },
    { bearing: 295, dist: 0.55, size: 0.6, steps: 2 },
  ];

  for (const s of satellites) {
    const level = downgrade(riskLevel, s.steps);
    const center = destination([centerLng, centerLat], baseRadiusKm * s.dist, s.bearing, {
      units: "kilometers",
    }).geometry?.coordinates as [number, number];
    addZone(center, baseRadiusKm * s.size, level);
  }

  zones.sort((a, b) => b.radiusKm - a.radiusKm);
  return zones;
}

export type FloodZoneProperties = {
  riskLevel: FloodRiskLevel;
  depth_meters: number;
  estimated_population: number;
};

export type FloodZoneFeatureCollection = FeatureCollection<Polygon, FloodZoneProperties>;

export function generateFloodPolygons(
  centerLat: number,
  centerLng: number,
  riskLevel: FloodRiskLevel = "high",
  hoursAhead: number = 24,
): FloodZoneFeatureCollection {
  const zones = buildZones(centerLat, centerLng, riskLevel, hoursAhead);

  return {
    type: "FeatureCollection",
    features: zones.map((zone) => {
      const geom = circle(zone.center, zone.radiusKm, {
        units: "kilometers",
      }).geometry;
      return {
        type: "Feature",
        geometry: geom,
        properties: {
          riskLevel: zone.riskLevel,
          depth_meters: zone.depthMeters,
          estimated_population: zone.population,
        },
      };
    }),
  };
}

// ---------------------------------------------------------------------
// Depth heatmap: MapLibre heatmap layers need point data, so we densify
// each polygon with seeded sample points carrying its depth_meters.
// ---------------------------------------------------------------------

export type FloodDepthPoint = Feature<
  Point,
  { depth_meters: number; estimated_population: number }
>;

export function floodDepthPoints(
  polygons: FloodZoneFeatureCollection,
  pointsPerZone = 10,
): FeatureCollection<Point, { depth_meters: number; estimated_population: number }> {
  const features: FloodDepthPoint[] = [];
  let seed = 7;

  for (const feature of polygons.features) {
    const [minLng, minLat, maxLng, maxLat] = bbox(feature);
    for (let i = 0; i < pointsPerZone; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const u1 = seed / 233280;
      seed = (seed * 9301 + 49297) % 233280;
      const u2 = seed / 233280;
      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [minLng + (maxLng - minLng) * u1, minLat + (maxLat - minLat) * u2],
        },
        properties: {
          depth_meters: feature.properties.depth_meters,
          estimated_population: feature.properties.estimated_population,
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

// ---------------------------------------------------------------------
// Affected population estimator (Step 6).
// Mock villages are scattered around the polygons' bounding-box centre;
// any village inside a flood polygon counts as affected.
// ---------------------------------------------------------------------

export type VillagePoint = Feature<Point, { name: string; population: number }>;

export function generateVillagePoints(
  centerLat: number,
  centerLng: number,
  count = 16,
): FeatureCollection<Point, { name: string; population: number }> {
  const features: VillagePoint[] = [];
  const names = [
    "North Village",
    "East Township",
    "Riverside Settlement",
    "Hill Colony",
    "Central Ward",
    "Lakeside",
    "Market Town",
    "Highland Village",
    "Old Quarters",
    "Canal Colony",
    "New Extension",
    "Ferry Point",
    "Temple Ward",
    "Crossroads",
    "Mill Village",
    "South Colony",
  ];
  let seed = centerLat * 1000 + centerLng;

  for (let i = 0; i < count; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    const angle = (seed / 233280) * Math.PI * 2;
    seed = (seed * 9301 + 49297) % 233280;
    const radiusKm = 0.5 + (seed / 233280) * 5.5;
    seed = (seed * 9301 + 49297) % 233280;
    const population = Math.round(500 + (seed / 233280) * 3500);

    // Approx lat/lng offset (1 deg lat ≈ 111 km; lng scaled by cos(lat)).
    const lat = centerLat + (radiusKm * Math.cos(angle)) / 111;
    const lng =
      centerLng +
      (radiusKm * Math.sin(angle)) / (111 * Math.cos((centerLat * Math.PI) / 180));

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [Number(lng.toFixed(5)), Number(lat.toFixed(5))],
      },
      properties: { name: names[i % names.length], population },
    });
  }

  return { type: "FeatureCollection", features };
}

export type AffectedPopulationResult = {
  totalAffected: number;
  villagesAffected: number;
  villagesChecked: number;
  children: number;
  elderly: number;
  adults: number;
  districtPopulation: number;
  pctOfDistrict: number;
};

export function calculateAffectedPopulation(
  floodPolygons: FeatureCollection<Polygon, Record<string, unknown>>,
  centerLat?: number,
  centerLng?: number,
): AffectedPopulationResult {
  // Fall back to the polygons' bounding-box centre.
  const [minLng, minLat, maxLng, maxLat] = bbox(floodPolygons);
  const cLat = centerLat ?? (minLat + maxLat) / 2;
  const cLng = centerLng ?? (minLng + maxLng) / 2;

  const villages = generateVillagePoints(cLat, cLng);
  let totalAffected = 0;
  let villagesAffected = 0;
  let sampledPopulation = 0;

  for (const village of villages.features) {
    sampledPopulation += village.properties.population;
    const isAffected = floodPolygons.features.some((zone) =>
      booleanPointInPolygon(village.geometry.coordinates, zone),
    );
    if (isAffected) {
      villagesAffected += 1;
      totalAffected += village.properties.population;
    }
  }

  // Rough age-band split (mock demographics): ~25% children, ~13% elderly.
  const children = Math.round(totalAffected * 0.25);
  const elderly = Math.round(totalAffected * 0.13);
  const adults = totalAffected - children - elderly;

  // Villages are sampled within ~6 km of the center; a district is roughly
  // a 30 km radius, so ~25x the sampled population. Fully location-agnostic.
  const districtPopulation = Math.round(sampledPopulation * 25);
  const pctOfDistrict =
    districtPopulation > 0
      ? Number(((totalAffected / districtPopulation) * 100).toFixed(2))
      : 0;

  return {
    totalAffected,
    villagesAffected,
    villagesChecked: villages.features.length,
    children,
    elderly,
    adults,
    districtPopulation,
    pctOfDistrict,
  };
}

// ---------------------------------------------------------------------
// Scenario scaling (Step 8). Judges pick a "What-If" scenario that scales
// the forecast horizon and escalates severity for the generator. Shared
// by the map and the ImpactSummary sidebar so both stay consistent.
// ---------------------------------------------------------------------

export function applyScenario(
  riskLevel: FloodRiskLevel,
  hoursAhead: number,
  multiplier: number,
): { riskLevel: FloodRiskLevel; hoursAhead: number } {
  const effectiveHours = Math.max(0, Math.round(hoursAhead * multiplier));
  let level = riskLevel;
  if (multiplier >= 2) {
    // Extreme weather escalates one full severity band.
    if (level === "low") level = "medium";
    else if (level === "medium") level = "high";
    else level = "critical";
  }
  return { riskLevel: level, hoursAhead: effectiveHours };
}

// Affected population for a single zone (used by the map popup).
export function calculateZonePopulation(
  zone: Feature<Polygon, Record<string, unknown>>,
): number {
  const [minLng, minLat, maxLng, maxLat] = bbox(zone);
  const cLat = (minLat + maxLat) / 2;
  const cLng = (minLng + maxLng) / 2;
  const villages = generateVillagePoints(cLat, cLng);
  return villages.features
    .filter((village) => booleanPointInPolygon(village.geometry.coordinates, zone))
    .reduce((sum, village) => sum + village.properties.population, 0);
}
