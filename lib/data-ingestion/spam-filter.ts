// ---------------------------------------------------------------------
// lib/data-ingestion/spam-filter.ts
// Phase 17 Step 7 — Spam & duplicate detection for citizen ground-truth
// reports. Guards the public report form against trolls / bots that spam
// identical text or blast from the same location.
//
// Rules:
//   1. Duplicate exact text.
//   2. Bot behavior — >5 reports from the same lat/lng (rounded to 4 decimal
//      places) within the previous 60 seconds.
// ---------------------------------------------------------------------

export type SpamCandidate = {
  lat: number;
  lng: number;
  rawText: string;
  createdAt?: string | Date | number | null;
};

export type SpamCheckResult = {
  isSpam: boolean;
  reason?: "duplicate_text" | "location_flood";
};

// Coordinate comparison key rounded to 4 decimal places (~11 m grid).
function key4(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function normalize(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tsOf(value: SpamCandidate["createdAt"]): number {
  if (!value) return Date.now();
  if (value instanceof Date) return value.getTime();
  const numeric = typeof value === "number" ? value : Date.parse(String(value));
  return Number.isFinite(numeric) ? numeric : Date.now();
}

/**
 * Detect whether a new report looks like spam.
 *
 * @param newReport      the incoming report.
 * @param existingReports the collection of already-stored reports.
 * @param options        { windowMs = 60_000, maxPerLocation = 5 } tuning knobs.
 */
export function detectSpam(
  newReport: SpamCandidate,
  existingReports: SpamCandidate[],
  options: { windowMs?: number; maxPerLocation?: number } = {},
): SpamCheckResult {
  const { windowMs = 60_000, maxPerLocation = 5 } = options;
  const now = tsOf(newReport.createdAt);
  const newText = normalize(newReport.rawText);

  // Rule 1 — duplicate exact text (case/punctuation-insensitive).
  if (newText.length > 0) {
    const dup = existingReports.some(
      (r) => normalize(r.rawText) === newText,
    );
    if (dup) return { isSpam: true, reason: "duplicate_text" };
  }

  // Rule 2 — >5 reports from the same location within the window.
  const anchor = key4(newReport.lat, newReport.lng);
  const recentAtLocation = existingReports.filter((r) => {
    if (key4(r.lat, r.lng) !== anchor) return false;
    const t = tsOf(r.createdAt);
    return now - t <= windowMs && t <= now;
  });

  if (recentAtLocation.length >= maxPerLocation) {
    return { isSpam: true, reason: "location_flood" };
  }

  return { isSpam: false };
}