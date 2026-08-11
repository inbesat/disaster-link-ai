// ---------------------------------------------------------------------
// lib/map/google-maps-directions.ts — Phase 1 · Step 6 · "Open in Google
// Maps" deep-link helpers.
//
// Pure URL + ETA builders behind components/public/GoogleMapsButton.tsx.
// The URL must stay EXACTLY the Google Maps Directions deep-link format
// (api=1, un-encoded comma pairs, travelmode=walking) so Google renders a
// walking route rather than a generic search. ETA is a straight-line
// walking estimate (~5 km/h), good enough for the pre-redirect overlay.
// ---------------------------------------------------------------------

import { haversineKm } from "@/lib/mock-data/hazard-zones";

/**
 * Strict Google Maps walking-directions URL.
 *
 *   https://www.google.com/maps/dir/?api=1&origin={lat},{lng}&destination={lat},{lng}&travelmode=walking
 *
 * `api=1` makes it a Directions intent; commas stay raw (URLSearchParams
 * would percent-encode them and break the deep link), so the URL is built
 * by string interpolation.
 */
export function googleMapsDirectionsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): string {
  return (
    "https://www.google.com/maps/dir/?api=1" +
    `&origin=${originLat},${originLng}` +
    `&destination=${destLat},${destLng}` +
    "&travelmode=walking"
  );
}

/**
 * Walking ETA in minutes for the overlay card — straight-line haversine
 * distance at the shared walking speed (floored at 1 minute).
 */
export function estimateGoogleMapsEtaMinutes(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): number {
  const km = haversineKm(originLat, originLng, destLat, destLng);
  const minutes = (km / GOOGLE_MAPS_WALK_SPEED_KMH) * 60;
  return Math.max(1, Math.round(minutes));
}

/** Walking speed used for the ETA estimate (~5 km/h). */
export const GOOGLE_MAPS_WALK_SPEED_KMH = 5;
