// ---------------------------------------------------------------------
// Procedural shelter / resource GeoJSON for any map center.
// Coordinates are [longitude, latitude] per the GeoJSON spec.
//
// These are location-agnostic (global): the same center always renders
// the same features because the PRNG is seeded from (lat,lng). No place
// is hardcoded — shelters/resources follow the map wherever it goes.
// ---------------------------------------------------------------------

export type FloodSeverity = "low" | "medium" | "high" | "critical";
export type ResourceType = "boat" | "medical";

interface GeoJsonFeature<G, P> {
  type: "Feature";
  geometry: G;
  properties: P;
}

interface GeoJsonFeatureCollection<F> {
  type: "FeatureCollection";
  features: F[];
}

export type PointGeometry = {
  type: "Point";
  coordinates: [number, number];
};

export type ShelterFeature = GeoJsonFeature<
  PointGeometry,
  { name: string; capacity: number; occupancy: number }
>;
export type ResourceFeature = GeoJsonFeature<
  PointGeometry,
  { type: ResourceType; quantity: number }
>;

// Deterministic PRNG so features are stable per (lat,lng) seed.
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const SHELTER_NAMES = [
  "Central Community Hall",
  "Riverside High School",
  "District Hospital Annex",
  "Civic Center",
  "North Stadium",
  "St. Mary's School",
  "Market Town Hall",
  "Lakeview Convention Center",
];

const RESOURCE_POOL: ResourceType[] = ["boat", "medical", "boat"];

// ---------------------------------------------------------------------
// Shelters (points) scattered around a center.
// ---------------------------------------------------------------------
export function generateShelters(
  centerLat: number,
  centerLng: number,
  count = 5,
): GeoJsonFeatureCollection<ShelterFeature> {
  const features: ShelterFeature[] = [];
  let seed = Math.floor(centerLat * 1000 + centerLng * 1000);

  for (let i = 0; i < count; i++) {
    const angle = seeded(seed) * Math.PI * 2;
    seed += 1;
    const radiusKm = 0.4 + seeded(seed) * 4.5;
    seed += 1;
    const capacity = Math.round(250 + seeded(seed) * 550);
    seed += 1;
    const occupancy = Math.round(capacity * (0.2 + seeded(seed) * 0.7));

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
      properties: {
        name: SHELTER_NAMES[i % SHELTER_NAMES.length],
        capacity,
        occupancy,
      },
    });
  }

  return { type: "FeatureCollection", features };
}

// ---------------------------------------------------------------------
// Deployable resources (points) around a center.
// ---------------------------------------------------------------------
export function generateResources(
  centerLat: number,
  centerLng: number,
  count = 3,
): GeoJsonFeatureCollection<ResourceFeature> {
  const features: ResourceFeature[] = [];
  let seed = Math.floor(centerLat * 1000 + centerLng * 1000) + 991;

  for (let i = 0; i < count; i++) {
    const angle = seeded(seed) * Math.PI * 2;
    seed += 1;
    const radiusKm = 0.3 + seeded(seed) * 3.8;
    seed += 1;
    const quantity = Math.round(2 + seeded(seed) * 12);

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
      properties: {
        type: RESOURCE_POOL[i % RESOURCE_POOL.length],
        quantity,
      },
    });
  }

  return { type: "FeatureCollection", features };
}
