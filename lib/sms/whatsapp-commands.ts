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

/** Recognised WhatsApp commands. */
export type WhatsAppCommand = "SHELTER" | "HELP";

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
  if (cleaned === "SHELTER") return "SHELTER";
  if (cleaned === "HELP") return "HELP";
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
    "*Bharat Shakti Help*",
    `Nearest shelter: ${s.shelter.name} (${s.shelterDistanceKm} km)`,
    `📍 Open in Maps: ${mapsLink(s.shelter.lat, s.shelter.lng)}`,
    "",
    "Reply *SHELTER* for shelter details or *HELP* for this menu.",
  ].join("\n");
}

/** Fallback menu for unknown commands. */
export function whatsappMenuReply(): string {
  return [
    "*Bharat Shakti*",
    "Reply *SHELTER* for the nearest shelter.",
    "Reply *HELP* for directions and emergency numbers.",
  ].join("\n");
}
