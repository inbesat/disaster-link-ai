// ---------------------------------------------------------------------
// lib/notification-digest.ts — Daily Operational Digest logic (Settings · Phase 2 · Step 7).
//
// Pure helpers behind the DigestModeCard:
//   • DEFAULT_DIGEST_TIME — 08:00 AM delivery default.
//   • formatTimeLabel(value) — "HH:MM" → human "8:00 AM"-style label.
//   • batchedDelivery(isDigestOn, isCritical) — whether a category's
//     impulse should show "Batched" (digest on AND routine) or "Instant".
//
// No React — unit-testable under node.
// ---------------------------------------------------------------------

export const DEFAULT_DIGEST_TIME = "08:00";

/** "23:45" → "11:45 PM"; malformed input falls back to the default. */
export function formatTimeLabel(value: string): string {
  const parts = value.split(":").map((part) => Number(part));
  const [hour, minute] = parts.length >= 2 ? parts : [Number.NaN, Number.NaN];
  if (Number.isNaN(hour)) return "8:00 AM";
  const period = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = String(Number.isNaN(minute) ? 0 : minute).padStart(2, "0");
  return `${h12}:${mm} ${period}`;
}

/**
 * Which delivery badge the routing matrix should show for a category.
 * Only non-critical ("routine") rows become batched when the digest is on;
 * critical rows always stay Instant so life-safety alerts are never held.
 */
export function deliveryLabel(
  digestEnabled: boolean,
  critical: boolean,
): { label: "Instant" | "Batched"; batched: boolean } {
  const batched = digestEnabled && !critical;
  return { label: batched ? "Batched" : "Instant", batched };
}