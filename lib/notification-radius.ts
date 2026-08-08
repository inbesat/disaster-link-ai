// ---------------------------------------------------------------------
// lib/notification-radius.ts — Geospatial alert radius logic (Settings · Phase 2 · Step 5).
//
// Pure helpers behind the AlertRadiusCard slider + home-district toggle:
//   • RADIUS_OPTIONS — the snap points (5km → All India) plus their helper
//     wording and, where relevant, a radius in kilometres.
//   • radiusHelperText(index) — the live sentence the card renders.
//   • withinRadius(radiusKm, distanceKm) — whether an event at a given
//     distance falls inside the selected radius (used by the filter).
//
// No React, no window — unit-testable under node.
// ---------------------------------------------------------------------

export type RadiusOption = {
  label: string;
  helper: string;
  km: number | null;
};

export const RADIUS_OPTIONS: RadiusOption[] = [
  { label: "5 km", helper: "within 5km", km: 5 },
  { label: "10 km", helper: "within 10km", km: 10 },
  { label: "25 km", helper: "within 25km", km: 25 },
  { label: "50 km", helper: "within 50km", km: 50 },
  { label: "District-Wide", helper: "across your assigned district", km: null },
  { label: "All India", helper: "anywhere in India", km: null },
];

/** Default snap index (50 km) the card opens at. */
export const DEFAULT_RADIUS_INDEX = 3;

/**
 * Live helper sentence for a given snap index, matching the requested copy:
 * "You will only receive alerts for events within [X]km of your current
 * live GPS location." District/All-India swap the "within" clause.
 */
export function radiusHelperText(index: number): string {
  const option = RADIUS_OPTIONS[index] ?? RADIUS_OPTIONS[0];
  const where =
    option.km !== null
      ? `${option.helper} of your current live GPS location`
      : option.helper;
  return `You will only receive alerts for events ${where}.`;
}

/**
 * Filter predicate — true when an event at `distanceKm` from the responder's
 * live GPS should be routed. District-Wide and All India always pass
 * (handled by the caller via `district`/`india` flags), so this only
 * evaluates the finite km options.
 */
export function withinRadius(
  option: RadiusOption,
  distanceKm: number,
): boolean {
  if (option.km === null) return true;
  return distanceKm <= option.km;
}