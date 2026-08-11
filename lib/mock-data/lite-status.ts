// ---------------------------------------------------------------------
// lib/mock-data/lite-status.ts — Phase 13 · Steps 3–4 · Shared "lite"
// status data.
//
// Single source of truth for the ultra-lightweight surfaces:
//   • /lite — the feature-phone page (Step 3)
//   • the SMS webhook's STATUS reply (Step 4)
//
// Both render the CURRENT demo situation for the registered district:
// risk level (from the same HAZARD_ZONES table the citizen dashboard
// reads), the nearest shelter (name + phone + distance, from
// CITIZEN_SHELTERS), and the emergency dial numbers. Hardcoded per the
// step specs — pure + SSR-safe so the server components and tests can
// import it directly.
// ---------------------------------------------------------------------

import { HAZARD_ZONES, type SafetyStatus } from "@/lib/mock-data/hazard-zones";
import {
  CITIZEN_SHELTERS,
  shelterDistanceKm,
  type CitizenShelter,
} from "@/lib/map/citizen-shelters";

/** Demo registered district for the /lite page + SMS STATUS command. */
export const LITE_DISTRICT = "Patna";

/** Demo phone numbers for the lite surfaces (hardcoded per spec). */
export const LITE_SHELTER_PHONE = "0612-2210107";

export const LITE_EMERGENCY_NUMBERS: ReadonlyArray<{ label: string; number: string }> = [
  { label: "District Control Room", number: "1070" },
  { label: "Police", number: "100" },
  { label: "Ambulance", number: "108" },
  { label: "Fire", number: "101" },
];

/** Risk label + SMS phrasing per SafetyStatus. */
export const RISK_LABELS: Record<SafetyStatus, { label: string; smsWord: string }> = {
  EVACUATE: { label: "RED ALERT — EVACUATE NOW", smsWord: "RED ALERT" },
  PREPARE: { label: "ORANGE ALERT — PREPARE TO EVACUATE", smsWord: "ORANGE ALERT" },
  WATCH: { label: "YELLOW ALERT — STAY VIGILANT", smsWord: "YELLOW ALERT" },
  SAFE: { label: "GREEN — NO IMMEDIATE DANGER", smsWord: "GREEN ALERT" },
};

export type LiteStatus = {
  /** Registered district, e.g. "Patna". */
  district: string;
  /** Raw SafetyStatus from the hazard table (SAFE/WATCH/PREPARE/EVACUATE). */
  risk: string;
  /** Human-readable risk headline, e.g. "YELLOW ALERT — STAY VIGILANT". */
  riskLabel: string;
  /** Short SMS word for the webhook, e.g. "YELLOW ALERT". */
  riskSmsWord: string;
  /** Nearest open shelter. */
  shelter: CitizenShelter;
  /** Shelter phone for the lite page (hardcoded demo). */
  shelterPhone: string;
  /** Great-circle distance from the district centre, km (1 decimal). */
  shelterDistanceKm: number;
  emergencyNumbers: ReadonlyArray<{ label: string; number: string }>;
};

/**
 * The current demo situation: Patna's risk (WATCH in the default hazard
 * table) + the nearest shelter to the Patna district centre. Picks the
 * first non-full shelter so the lite page never recommends a "Do Not Go"
 * shelter (Danapur Relief Camp is 450/450 in the mock table).
 */
export function getLiteStatus(): LiteStatus {
  const zone = HAZARD_ZONES.find((z) => z.district === LITE_DISTRICT);
  const risk = zone?.status ?? "SAFE";

  const centre = zone ?? { lat: 25.5941, lng: 85.1376 };
  const nearest = [...CITIZEN_SHELTERS]
    .sort(
      (a, b) =>
        shelterDistanceKm(a, centre.lat, centre.lng) -
        shelterDistanceKm(b, centre.lat, centre.lng),
    )
    .find((s) => s.occupancy < s.capacity) ?? CITIZEN_SHELTERS[0];

  return {
    district: LITE_DISTRICT,
    risk,
    riskLabel: RISK_LABELS[risk]?.label ?? RISK_LABELS.SAFE.label,
    riskSmsWord: RISK_LABELS[risk]?.smsWord ?? RISK_LABELS.SAFE.smsWord,
    shelter: nearest,
    shelterPhone: LITE_SHELTER_PHONE,
    shelterDistanceKm: Number(
      shelterDistanceKm(nearest, centre.lat, centre.lng).toFixed(1),
    ),
    emergencyNumbers: LITE_EMERGENCY_NUMBERS,
  };
}
