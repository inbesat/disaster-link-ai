// ---------------------------------------------------------------------
// lib/sms/whatsapp-commands.ts — Phase 13 · Step 6 · WhatsApp bot logic.
//
// Pure reply builders behind app/api/webhooks/whatsapp/route.ts. WhatsApp
// renders *text* as bold — the nearest-shelter reply leans on that for a
// scan-friendly format. The Help reply carries a Google Maps deep link to
// the shelter's coordinates (mock data from lite-status, per the step
// spec's "mock logic block").
// ---------------------------------------------------------------------

import { getLiteStatus } from "@/lib/mock-data/lite-status";
import { HAZARD_ZONES } from "@/lib/mock-data/hazard-zones";
import {
  CITIZEN_SHELTERS,
  shelterDistanceKm,
} from "@/lib/map/citizen-shelters";

/** Recognised WhatsApp commands. */
export type WhatsAppCommand = "STATUS" | "SHELTER" | "ROUTE" | "SAFE" | "HELP";

/**
 * Normalise an incoming WhatsApp message to a known command. WhatsApp
 * sends the raw text; trim + uppercase + strip punctuation so "shelter",
 * "Shelter!" and " HELP " all resolve.
 */
export function normalizeWhatsappCommand(body: string): WhatsAppCommand | null {
  const cleaned = body
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned === "STATUS") return "STATUS";
  if (cleaned === "SHELTER") return "SHELTER";
  if (cleaned === "ROUTE") return "ROUTE";
  if (cleaned === "SAFE") return "SAFE";
  if (cleaned === "HELP" || cleaned === "SOS") return "HELP";
  return null;
}

/** Google Maps deep link to a lat/lng pair. */
export function mapsLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

/**
 * "Shelter" reply — the nearest shelter with WhatsApp bold formatting:
 *
 *   *Nearest Shelter*
 *   🏥 Patna Central Community Hall
 *   📍 3.1 km away
 *   📞 0612-2210107
 */
export function whatsappShelterReply(): string {
  const s = getLiteStatus();
  return [
    "*Nearest Shelter*",
    `🏥 ${s.shelter.name}`,
    `📍 ${s.shelterDistanceKm} km away · ${s.shelter.occupancy}/${s.shelter.capacity} beds`,
    `📞 ${s.shelterPhone}`,
  ].join("\n");
}

/**
 * "Help" reply — the nearest shelter plus a Google Maps link to walk to
 * it (mock block per the step spec; swap the mock coords for the live
 * geocoded shelter later — the link format stays the same).
 */
export function whatsappHelpReply(): string {
  const s = getLiteStatus();
  return [
    "*SafeSphere Help*",
    `Nearest shelter: ${s.shelter.name} (${s.shelterDistanceKm} km)`,
    `📍 Open in Maps: ${mapsLink(s.shelter.lat, s.shelter.lng)}`,
    "",
    "Reply *SHELTER* for shelter details or *HELP* for this menu.",
  ].join("\n");
}

/** Fallback menu for unknown commands. */
export function whatsappMenuReply(): string {
  return [
    "*SafeSphere*",
    "Reply *STATUS* for current flood risk in your area.",
    "Reply *SHELTER* for the 3 nearest shelters.",
    "Reply *ROUTE* for an evacuation route.",
    "Reply *SAFE* to mark yourself safe.",
    "Reply *HELP* to raise an SOS.",
  ].join("\n");
}

/**
 * "STATUS" reply — the current flood risk for the sender's area (the demo
 * district), straight from the shared lite-status snapshot. Same phrasing
 * as the SMS STATUS reply so both channels agree.
 */
export function whatsappStatusReply(): string {
  const s = getLiteStatus();
  return [
    "*SafeSphere Status*",
    `${s.district} is under *${s.riskSmsWord}*.`,
    `Nearest shelter: ${s.shelter.name} (${s.shelterDistanceKm} km).`,
    "",
    "Reply *SHELTER* for the top 3 shelters.",
  ].join("\n");
}

/**
 * "SHELTER" reply — the three nearest open shelters with their distances,
 * sorted nearest-first (top 3, per the step spec). Distances are measured
 * from the district centre (Patna) like the lite-status snapshot; skips
 * full shelters so it never recommends a "Do Not Go" camp.
 */
export function whatsappSheltersTop3Reply(): string {
  const zone = HAZARD_ZONES.find((z) => z.district === getLiteStatus().district);
  const centre = zone ?? { lat: 25.5941, lng: 85.1376 };
  const top = [...CITIZEN_SHELTERS]
    .filter((sh) => sh.occupancy < sh.capacity)
    .sort(
      (a, b) =>
        shelterDistanceKm(a, centre.lat, centre.lng) -
        shelterDistanceKm(b, centre.lat, centre.lng),
    )
    .slice(0, 3);

  return [
    "*Nearest Shelters*",
    ...top.map((sh, i) => {
      const km = shelterDistanceKm(sh, centre.lat, centre.lng).toFixed(1);
      return `${i + 1}. 🏥 ${sh.name} — ${km} km`;
    }),
    "",
    "Reply *ROUTE* for directions to the nearest shelter.",
  ].join("\n");
}

/**
 * "ROUTE" reply — a Google Maps deep link to the nearest shelter. Uses the
 * same mapsLink helper as the older Help reply, so the URL format is
 * consistent across WhatsApp commands.
 */
export function whatsappRouteReply(): string {
  const s = getLiteStatus();
  return [
    "*Evacuation Route*",
    `Head to ${s.shelter.name} (${s.shelterDistanceKm} km).`,
    `📍 Open in Maps: ${mapsLink(s.shelter.lat, s.shelter.lng)}`,
  ].join("\n");
}

/** "SAFE" reply, after the citizen's status is persisted in the DB. */
export const WHATSAPP_SAFE_REPLY =
  "Status marked safe. Family notified.";

/** "HELP" reply, after the SOS flow has been triggered on the backend. */
export function whatsappSosReply(): string {
  return [
    "*SOS Received*",
    "Your emergency has been sent to the District Control Room.",
    "Help is on the way. Share your live location when you can.",
    "Call 1070 if it is safe to do so.",
  ].join("\n");
}
