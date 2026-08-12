// ---------------------------------------------------------------------
// lib/cap/cap-templates.ts — Phase 3 · per-disaster-type CAP presets.
//
// Pre-fills the CAP <info> values (category, urgency, severity, certainty,
// event) plus the headline / description / instruction boilerplate for
// each disaster type, and applies district-specific overrides (e.g. Bihar
// flood messaging vs. Odisha cyclone). The values declared here pair with
// the TTS script templates (lib/tts/templates.ts) so the CAP text and the
// voiced broadcast agree.
// ---------------------------------------------------------------------

import type {
  CapCategory,
  CapCertainty,
  CapSeverity,
  CapUrgency,
} from "./types";

export type CapDisasterType = "flood" | "cyclone" | "earthquake" | "heatwave";

export interface CapDisasterPreset {
  category: CapCategory;
  event: string;
  urgency: CapUrgency;
  severity: CapSeverity;
  certainty: CapCertainty;
  /** How long the alert stays valid (ISO 8601 duration, e.g. "PT24H"). */
  duration: string;
  headline: string;
  description: string;
  instruction: string;
}

/** District-aware overrides keyed by district name (uppercase-insensitive). */
export interface CapDistrictOverride {
  /** District name — matched case-insensitively. */
  district: string;
  /** Values merged on top of the disaster preset. */
  headline?: string;
  description?: string;
  instruction?: string;
  severity?: CapSeverity;
  urgency?: CapUrgency;
}

const DISTRICT_OVERRIDES: CapDistrictOverride[] = [
  {
    district: "bihar",
    description:
      "Heavy rainfall has caused the river to cross the danger mark across Bihar. " +
      "Residents of low-lying and riverside wards are advised to evacuate immediately " +
      "to the nearest cyclone shelter or community building.",
  },
  {
    district: "patna",
    description:
      "The river has crossed the danger mark in Patna. Residents of riverside wards " +
      "should move to higher ground now and not attempt to cross flooded roads.",
  },
  {
    district: "odisha",
    description:
      "A severe cyclone is approaching the Odisha coast. Coastal and island residents " +
      "must move to designated cyclone shelters immediately.",
  },
  {
    district: "puri",
    description:
      "Cyclone landfall is forecast near Puri within 24 hours. Evacuate coastal " +
      "pockets now and follow the district administration's shelter notices.",
  },
];

/** District → dedicated cyclone instructions (Odisha coastline focus). */
const CYCLONE_DISTRICT_INSTRUCTIONS: Record<string, string> = {
  puri: "Move to the nearest cyclone shelter now. Do not return until the " +
    "administration declares it safe. Keep emergency kits, torch and documents ready.",
  odisha: "Move to the nearest cyclone shelter immediately. Stay away from the " +
    "shoreline and secure loose objects. Follow the state administration's advisories.",
};

function normalizeDistrict(value: string): string {
  return value.trim().toLowerCase();
}

/** Pre-filled CAP values + boilerplate for a disaster type. */
export function disasterCapPreset(
  disasterType: CapDisasterType,
): CapDisasterPreset {
  switch (disasterType) {
    case "flood":
      return {
        category: "Met",
        event: "Flood",
        urgency: "Immediate",
        severity: "Severe",
        certainty: "Observed",
        duration: "PT24H",
        headline: "Severe Flood Warning",
        description:
          "Heavy rainfall has caused the river to cross the danger mark. Residents " +
          "of low-lying areas are advised to evacuate immediately to the nearest shelter.",
        instruction:
          "Move to higher ground immediately. Do not walk or drive through flood " +
          "water. Keep your emergency kit and documents ready.",
      };
    case "cyclone":
      return {
        category: "Met",
        event: "Cyclone",
        urgency: "Immediate",
        severity: "Extreme",
        certainty: "Likely",
        duration: "PT36H",
        headline: "Severe Cyclone Warning",
        description:
          "A severe cyclone is approaching the coast with damaging wind speeds. " +
          "Coastal residents must move to designated cyclone shelters immediately.",
        instruction:
          "Move to the nearest cyclone shelter immediately. Stay away from coastal " +
          "areas and secure loose objects. Keep emergency kits ready.",
      };
    case "earthquake":
      return {
        category: "Geo",
        event: "Earthquake",
        urgency: "Immediate",
        severity: "Severe",
        certainty: "Observed",
        duration: "PT12H",
        headline: "Earthquake Impact Advisory",
        description:
          "A seismic event has been detected near the district. Buildings may be " +
          "damaged and aftershocks are possible.",
        instruction:
          "Drop, cover and hold on until the shaking stops. Move to open ground. " +
          "Do not use elevators. Be prepared for aftershocks.",
      };
    case "heatwave":
      return {
        category: "Met",
        event: "Heatwave",
        urgency: "Expected",
        severity: "Severe",
        certainty: "Likely",
        duration: "PT48H",
        headline: "Extreme Heatwave Advisory",
        description:
          "Extreme heatwave conditions are forecast with temperatures reaching " +
          "dangerous levels.",
        instruction:
          "Avoid outdoor activity between 11 AM and 4 PM. Drink plenty of water. " +
          "Check on elderly neighbors. Do not leave children or pets in parked vehicles.",
      };
  }
}

/** Resolve a preset + district overrides into the final CAP <info> values. */
export function resolveCapPreset(input: {
  disasterType: CapDisasterType;
  district: string;
  severity?: CapSeverity;
  urgency?: CapUrgency;
}): CapDisasterPreset {
  const preset = disasterCapPreset(input.disasterType);
  const districtKey = normalizeDistrict(input.district);
  const override = DISTRICT_OVERRIDES.find(
    (o) => normalizeDistrict(o.district) === districtKey,
  );

  const instruction =
    input.disasterType === "cyclone"
      ? CYCLONE_DISTRICT_INSTRUCTIONS[districtKey] ?? preset.instruction
      : preset.instruction;

  return {
    ...preset,
    ...(override ?? {}),
    instruction,
    severity: input.severity ?? override?.severity ?? preset.severity,
    urgency: input.urgency ?? override?.urgency ?? preset.urgency,
  };
}

/** Build a headline that names the district (e.g. "Flood Warning: Bihar"). */
export function districtHeadline(
  preset: CapDisasterPreset,
  district: string,
): string {
  const districtLabel = district.trim();
  return districtLabel
    ? `${preset.event} Warning: ${districtLabel}`
    : preset.headline;
}
