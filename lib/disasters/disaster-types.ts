// ---------------------------------------------------------------------
// Multi-hazard registry.
//
// The platform is disaster-agnostic: flood, earthquake, hurricane,
// wildfire and tsunami all share one map, one severity model and one
// command center. Each hazard brings its own units, alert wording and
// (later, in the integration phases) its own upstream data sources.
// ---------------------------------------------------------------------

export const DISASTER_TYPES = [
  "flood",
  "earthquake",
  "hurricane",
  "wildfire",
  "tsunami",
] as const;

export type DisasterType = (typeof DISASTER_TYPES)[number];

export type HazardMeta = {
  id: DisasterType;
  label: string;
  icon: string;
  // Human-readable unit + label for the zone popup / heatmap.
  intensityUnit: string;
  intensityLabel: string;
  // Normalizes intensity to 0-1 for the MapLibre heatmap weight.
  heatMax: number;
  // Alert-banner wording (per severity tier), "{hours}" is replaced.
  criticalTitle: string;
  highTitle: string;
  watchTitle: string;
  okTitle: string;
  impactTemplate: string;
  // Short description for the sidebar / landing copy.
  description: string;
};

export const DISASTER_META: Record<DisasterType, HazardMeta> = {
  flood: {
    id: "flood",
    label: "Flood",
    icon: "🌊",
    intensityUnit: "m",
    intensityLabel: "Max Water Depth",
    heatMax: 6,
    criticalTitle: "CRITICAL FLOOD WARNING",
    highTitle: "FLOOD WARNING",
    watchTitle: "FLOOD WATCH",
    okTitle: "CONDITIONS NORMAL",
    impactTemplate: "Inundation expected in {hours} hours.",
    description:
      "River overflow & pluvial flooding — depth + extent from hydrology + ML.",
  },
  earthquake: {
    id: "earthquake",
    label: "Earthquake",
    icon: "🌍",
    intensityUnit: "M",
    intensityLabel: "Magnitude",
    heatMax: 8,
    criticalTitle: "CRITICAL EARTHQUAKE ALERT",
    highTitle: "EARTHQUAKE WARNING",
    watchTitle: "EARTHQUAKE WATCH",
    okTitle: "SEISMIC CONDITIONS NORMAL",
    impactTemplate: "Strong ground shaking likely within {hours} hours.",
    description: "Seismic shaking footprint — magnitude + intensity from USGS feeds.",
  },
  hurricane: {
    id: "hurricane",
    label: "Hurricane",
    icon: "🌀",
    intensityUnit: "km/h",
    intensityLabel: "Sustained Wind",
    heatMax: 300,
    criticalTitle: "CRITICAL HURRICANE WARNING",
    highTitle: "HURRICANE WARNING",
    watchTitle: "HURRICANE WATCH",
    okTitle: "TROPICAL CONDITIONS NORMAL",
    impactTemplate: "Landfall expected within {hours} hours.",
    description: "Tropical cyclone track cone — wind speed + storm surge from NHC/GDACS.",
  },
  wildfire: {
    id: "wildfire",
    label: "Wildfire",
    icon: "🔥",
    intensityUnit: "level",
    intensityLabel: "Fire Intensity",
    heatMax: 1,
    criticalTitle: "CRITICAL WILDFIRE ALERT",
    highTitle: "WILDFIRE WARNING",
    watchTitle: "WILDFIRE WATCH",
    okTitle: "FIRE CONDITIONS NORMAL",
    impactTemplate: "Fire spread to populated areas expected within {hours} hours.",
    description: "Active fire fronts — spread + intensity from FIRMS/GWIS hotspots.",
  },
  tsunami: {
    id: "tsunami",
    label: "Tsunami",
    icon: "🌊",
    intensityUnit: "m",
    intensityLabel: "Run-up",
    heatMax: 15,
    criticalTitle: "CRITICAL TSUNAMI ALERT",
    highTitle: "TSUNAMI WARNING",
    watchTitle: "TSUNAMI WATCH",
    okTitle: "SEA LEVELS NORMAL",
    impactTemplate: "Wave arrival expected within {hours} hours.",
    description: "Coastal wave inundation — run-up height + ETA from PTWC bulletins.",
  },
};

export const DISASTER_TYPE_LIST = DISASTER_TYPES.map((id) => DISASTER_META[id]);
