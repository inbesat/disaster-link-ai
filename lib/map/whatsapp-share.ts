// ---------------------------------------------------------------------
// lib/map/whatsapp-share.ts — Phase 1 · Step 7 · WhatsApp route sharing.
//
// Pure builder for the wa.me deep link behind ShareRouteButton. The
// https://wa.me/?text= scheme native-opens WhatsApp with a pre-filled
// message even when the recipient isn't a saved contact. The message
// template matches the step spec exactly:
//
//   Safe evacuation route from MyLocation to Shelter Name.
//   Distance: X km. ETA: Y min. Open in Maps: Link
//
// Everything is pure + SSR-safe so the component is a thin shell and tests
// can assert the exact encoded URL.
// ---------------------------------------------------------------------

export type RouteShareDetails = {
  /** Sender's label, e.g. "My Location". */
  originLabel: string;
  /** Destination label, e.g. "Patna Central Community Hall". */
  destination: string;
  distanceKm: number;
  etaMinutes: number;
  /** Full Google Maps directions URL to embed in the message. */
  mapsUrl: string;
};

/**
 * The share text (not encoded) — one readable line, numbers as given.
 */
export function buildRouteShareText({
  originLabel,
  destination,
  distanceKm,
  etaMinutes,
  mapsUrl,
}: RouteShareDetails): string {
  return (
    `Safe evacuation route from ${originLabel} to ${destination}. ` +
    `Distance: ${distanceKm} km. ETA: ${etaMinutes} min. ` +
    `Open in Maps: ${mapsUrl}`
  );
}

/**
 * wa.me deep link with the share text URL-encoded.
 *
 *   https://wa.me/?text=<encoded>
 */
export function buildWhatsAppShareUrl(details: RouteShareDetails): string {
  const text = buildRouteShareText(details);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
