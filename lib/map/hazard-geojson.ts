// ---------------------------------------------------------------------
// Generic multi-hazard geometry generator.
//
// Produces a FeatureCollection of warning polygons for any disaster type
// (flood / earthquake / hurricane / wildfire / tsunami) around a center
// using @turf/turf. Bigger + more intense when severity is higher or the
// forecast is farther ahead. Fully location-agnostic (seeded PRNG).
//
// Properties carry everything the UI reads:
//   riskLevel   -> severity coloring (green/amber/red/purple)
//   heatValue   -> normalized 0-1 intensity for the heatmap weight
//   intensity   -> raw magnitude in the hazard's own unit (popup)
//   label       -> zone name for the popup
// ---------------------------------------------------------------------

import { circle, ellipse, destination, bbox } from "@turf/turf";
import type { Feature, FeatureCollection, Point, Polygon } from "geojson";
import type { DisasterType } from "@/lib/disasters/disaster-types";
import { DISASTER_META } from "@/lib/disasters/disaster-types";
import type { FloodRiskLevel } from "./flood-geojson";

export type HazardZoneProperties = {
  hazardType: DisasterType;
  riskLevel: FloodRiskLevel;
  intensity: number;
  heatValue: number;
  label: string;
  radiusKm: number;
};

export type HazardZoneFeature = Feature<Polygon, HazardZoneProperties>;
export type HazardFeatureCollection = FeatureCollection<Polygon, HazardZoneProperties>;

// Deterministic PRNG so geometry is stable per (lat,lng) seed.
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const SEVERITY_ORDER: FloodRiskLevel[] = ["low", "medium", "high", "critical"];

function round1(value: number): number {
  return Number(value.toFixed(1));
}

// Deterministic value across the low..critical band with mild jitter.
function band(riskLevel: FloodRiskLevel, lo: number, hi: number, seed: number): number {
  const idx = SEVERITY_ORDER.indexOf(riskLevel);
  const t = idx / (SEVERITY_ORDER.length - 1);
  const jitter = seeded(seed);
  return lo + (hi - lo) * Math.min(0.999, t + (jitter - 0.5) * 0.15);
}

function normalizedHeat(hazardType: DisasterType, intensity: number): number {
  const max = DISASTER_META[hazardType].heatMax;
  return Number(Math.min(1, Math.max(0, intensity / max)).toFixed(3));
}

function makeFeature(
  center: [number, number],
  radiusKm: number,
  riskLevel: FloodRiskLevel,
  hazardType: DisasterType,
  intensity: number,
  label: string,
): Feature<Polygon, HazardZoneProperties> {
  const geom = circle(center, radiusKm, { units: "kilometers" }).geometry;
  return {
    type: "Feature",
    geometry: geom,
    properties: {
      hazardType,
      riskLevel,
      intensity: round1(intensity),
      heatValue: normalizedHeat(hazardType, intensity),
      label,
      radiusKm: Number(radiusKm.toFixed(1)),
    },
  };
}

function makeEllipseFeature(
  center: [number, number],
  longKm: number,
  shortKm: number,
  rotationDeg: number,
  riskLevel: FloodRiskLevel,
  hazardType: DisasterType,
  intensity: number,
  label: string,
): Feature<Polygon, HazardZoneProperties> {
  const geom = ellipse(center, longKm, shortKm, {
    units: "kilometers",
    angle: rotationDeg,
  }).geometry;
  return {
    type: "Feature",
    geometry: geom,
    properties: {
      hazardType,
      riskLevel,
      intensity: round1(intensity),
      heatValue: normalizedHeat(hazardType, intensity),
      label,
      radiusKm: Number(longKm.toFixed(1)),
    },
  };
}

function offsetPoint(
  center: [number, number],
  distanceKm: number,
  bearingDeg: number,
): [number, number] {
  return destination(center, distanceKm, bearingDeg, {
    units: "kilometers",
  }).geometry?.coordinates as [number, number];
}

function buildHazardZones(
  hazardType: DisasterType,
  centerLat: number,
  centerLng: number,
  riskLevel: FloodRiskLevel,
  hoursAhead: number,
): Feature<Polygon, HazardZoneProperties>[] {
  const seed = centerLat * 1000 + centerLng;
  const center: [number, number] = [centerLng, centerLat];
  const timeFactor = 1 + hoursAhead / 168;
  const ver = SEVERITY_ORDER.indexOf(riskLevel); // 0..3
  const scale = timeFactor * (1 + ver * 0.5);
  const features: Feature<Polygon, HazardZoneProperties>[] = [];

  const downgrade = (steps: number): FloodRiskLevel =>
    SEVERITY_ORDER[Math.max(0, ver - steps)];

  if (hazardType === "flood") {
    // Flood: one dominant core + a belt of satellite rings. Depth in m.
    const coreRadius = 2.4 * scale;
    const depth = band(riskLevel, 0.3, 6, seed);
    features.push(
      makeFeature(center, coreRadius, riskLevel, hazardType, depth, "Primary flood"),
    );

    const rings: { dist: number; size: number; steps: number }[] = [
      { dist: 1.4, size: 0.6, steps: 1 },
      { dist: 2.1, size: 0.4, steps: 2 },
    ];
    for (const ring of rings) {
      const cc = offsetPoint(
        center,
        coreRadius * ring.dist,
        seeded(seed + ring.dist) * 360,
      );
      features.push(
        makeFeature(
          cc,
          coreRadius * ring.size,
          downgrade(ring.steps),
          hazardType,
          depth * (1 - ring.steps * 0.25),
          "Flooded area",
        ),
      );
    }
  } else if (hazardType === "tsunami") {
    // Tsunami: elongated run-up zone stretching inland along a coast bearing.
    const longKm = 60 * scale;
    const shortKm = 7 * scale;
    const rotation = seeded(seed + 9) * 60 - 30;
    const runup = band(riskLevel, 1, 10, seed);
    features.push(
      makeEllipseFeature(
        center,
        longKm,
        shortKm,
        rotation,
        riskLevel,
        hazardType,
        runup,
        "Primary run-up",
      ),
    );
    for (let i = 1; i <= 2; i++) {
      const cc = offsetPoint(center, longKm * (0.6 + i * 0.25), rotation + 90);
      features.push(
        makeEllipseFeature(
          cc,
          longKm * (0.8 - i * 0.2),
          shortKm * (0.9 - i * 0.2),
          rotation,
          downgrade(i),
          hazardType,
          runup * (1 - i * 0.3),
          i === 1 ? "Coastal inundation" : "Seaside surge",
        ),
      );
    }
  } else if (hazardType === "earthquake") {
    // Earthquake: epicenter footprint + aftershock rings. Magnitude M.
    const magnitude = band(riskLevel, 4.5, 8, seed);
    const epicenterR = (8 + (magnitude - 4.5) * 28) * Math.max(1, timeFactor * 0.6);
    features.push(
      makeFeature(
        center,
        epicenterR,
        riskLevel,
        hazardType,
        magnitude,
        "Shaking footprint",
      ),
    );
    for (let i = 1; i <= 2; i++) {
      const bearing = seeded(seed + i * 7) * 360;
      const cc = offsetPoint(center, epicenterR * 0.5 * i, bearing);
      features.push(
        makeFeature(
          cc,
          epicenterR * 0.4,
          downgrade(i),
          hazardType,
          Math.max(4, magnitude - i * 0.8),
          i === 1 ? "Aftershock zone" : "Triggered zone",
        ),
      );
    }
  } else if (hazardType === "hurricane") {
    // Hurricane: storm-core ellipse + rain bands along a track. Wind km/h.
    const wind = band(riskLevel, 90, 300, seed);
    const stormLong = (40 + wind * 0.55) * scale;
    const rotation = seeded(seed + 3) * 120 - 60;
    features.push(
      makeEllipseFeature(
        center,
        stormLong,
        stormLong * 0.55,
        rotation,
        riskLevel,
        hazardType,
        wind,
        "Storm core",
      ),
    );
    for (let i = 1; i <= 2; i++) {
      const cc = offsetPoint(
        center,
        stormLong * (0.4 + i * 0.45),
        rotation + 90 - i * 40,
      );
      features.push(
        makeEllipseFeature(
          cc,
          stormLong * (0.8 - i * 0.15),
          stormLong * 0.35,
          rotation - 20,
          downgrade(i),
          hazardType,
          Math.max(60, wind - i * 90),
          i === 1 ? "Rain band" : "Outer band",
        ),
      );
    }
  } else {
    // Wildfire: a cluster of small hot-spot fronts. Intensity 0-1.
    const fronts = 5 + ver;
    const spreadBearing = 35; // dominant downwind direction
    for (let i = 0; i < fronts; i++) {
      const angle = seeded(seed + i * 3) * Math.PI * 2;
      const rKm = 0.3 + seeded(seed + i * 5) * 2.2;
      const cLat = centerLat + (rKm * Math.cos(angle)) / 111;
      const cLng =
        centerLng +
        (rKm * Math.sin(angle)) / (111 * Math.cos((centerLat * Math.PI) / 180));
      const drifted = offsetPoint([cLng, cLat], 1.2, spreadBearing);
      const intensity = 0.2 + seeded(seed + i * 11) * 0.8;
      features.push(
        makeFeature(
          drifted,
          0.5 + seeded(seed + i * 2) * 2,
          downgrade(i > 0 ? 1 : 0),
          hazardType,
          intensity,
          i === 0 ? "Fire front" : "Active hotspot",
        ),
      );
    }
  }

  return features.sort((a, b) => b.properties.radiusKm - a.properties.radiusKm);
}

export function generateHazardPolygons(
  hazardType: DisasterType,
  centerLat: number,
  centerLng: number,
  riskLevel: FloodRiskLevel = "high",
  hoursAhead: number = 24,
): HazardFeatureCollection {
  return {
    type: "FeatureCollection",
    features: buildHazardZones(hazardType, centerLat, centerLng, riskLevel, hoursAhead),
  };
}

// ---------------------------------------------------------------------
// Heatmap: MapLibre heatmap layers need point data, so densify each
// polygon with seeded sample points carrying its normalized intensity.
// ---------------------------------------------------------------------

type HazardPoint = Feature<Point, { heatValue: number; intensity: number }>;

export function hazardIntensityPoints(
  polygons: HazardFeatureCollection,
  pointsPerZone = 10,
): FeatureCollection<Point, { heatValue: number; intensity: number }> {
  const features: HazardPoint[] = [];
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
          heatValue: feature.properties.heatValue,
          intensity: feature.properties.intensity,
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}
