// ---------------------------------------------------------------------
// lib/tts/templates.ts — Phase 26 · AI alert voice template system.
//
// Builds the radio-ready broadcast script for an alert. The script is
// assembled as: [severity intro] + [disaster-specific template] +
// [action instructions]. When the caller supplies a `message`, it replaces
// the template line entirely (custom Voice Preview path). Template
// variables use {var_name} placeholders that get substituted from
// `templateVars` so the same engine drives every district/hazard.
// ---------------------------------------------------------------------

import type { AlertSeverity, AlertVoiceRequest, DisasterType } from "./types";

/** Standard emergency-broadcast intro, per the EWS/CAP convention. */
const INTRO =
  "This is an emergency alert from SafeSphere, authorized by the " +
  "District Disaster Management Authority.";

/** Severity-tuned lead-in before the hazard template. */
const SEVERITY_LEAD: Record<AlertSeverity, string> = {
  watch: "Please be informed.",
  warning: "A warning has been issued.",
  critical: "This is a critical emergency. Immediate action is required.",
};

/** Disaster templates with {variable} placeholders (see buildTemplate). */
const DISASTER_TEMPLATES: Record<DisasterType, string> = {
  flood:
    "Heavy rainfall has caused the {river_name} to cross the danger mark in " +
    "{district}. Residents of {affected_areas} are advised to evacuate " +
    "immediately to {shelter_names}. Do not attempt to cross flooded roads. " +
    "This message is from the District Collector.",
  cyclone:
    "Cyclone {name} is approaching {district} with wind speeds of {speed} " +
    "kilometers per hour. Move to the nearest cyclone shelter immediately. " +
    "Stay away from coastal areas. Keep emergency kits ready.",
  earthquake:
    "A seismic event of magnitude {magnitude} has been detected near " +
    "{district}. Check for injuries. Move to open ground. Be prepared for " +
    "aftershocks. Do not use elevators.",
  heatwave:
    "Extreme heatwave conditions are forecast for {district} with " +
    "temperatures reaching {temp} degrees Celsius. Avoid outdoor activities " +
    "between 11 AM and 4 PM. Drink plenty of water. Check on elderly neighbors.",
};

/** Action instructions appended after the hazard template. */
const DISASTER_ACTIONS: Record<DisasterType, string> = {
  flood:
    "Move to higher ground immediately. Do not walk or drive through flood " +
    "water. Keep your emergency kit and documents ready.",
  cyclone:
    "Secure loose objects and windows. Do not venture near the shoreline. " +
    "Follow instructions from local authorities and emergency personnel.",
  earthquake:
    "Drop, cover and hold on until the shaking stops. If indoors, stay away " +
    "from windows. Be prepared for aftershocks and check on your family.",
  heatwave:
    "Drink water frequently even if not thirsty. Wear light clothing and a " +
    "hat. Do not leave children or pets in parked vehicles.",
};

/** Default values for template placeholders so a bare request still reads well. */
const DEFAULT_VARS: Record<string, string> = {
  river_name: "the local river",
  affected_areas: "low-lying areas",
  shelter_names: "the nearest cyclone shelter",
  name: "the developing storm",
  speed: "100",
  magnitude: "6.0",
  temp: "45",
};

/** Fill {var_name} placeholders; unknown vars stay intact. */
export function fillTemplateVars(
  template: string,
  vars: Record<string, string> | undefined,
): string {
  const merged = { ...DEFAULT_VARS, ...(vars ?? {}) };
  return template.replace(/\{(\w+)\}/g, (match, key: string) => merged[key] ?? match);
}

/**
 * Build the full broadcast script for an alert request.
 *
 * - If `request.message` is supplied it is used verbatim as the core line.
 * - Otherwise the matching disaster template is filled with district + vars.
 * - The severity lead-in and the disaster action instructions wrap the core.
 */
export function buildAlertScript(request: AlertVoiceRequest): string {
  const core = request.message?.trim()
    ? request.message.trim()
    : fillTemplateVars(DISASTER_TEMPLATES[request.disasterType], {
        district: request.district,
        ...request.templateVars,
      });

  return [
    INTRO,
    SEVERITY_LEAD[request.severity],
    core,
    DISASTER_ACTIONS[request.disasterType],
  ]
    .filter(Boolean)
    .join(" ");
}
