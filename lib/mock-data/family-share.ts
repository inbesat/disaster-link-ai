// ---------------------------------------------------------------------
// lib/mock-data/family-share.ts — Phase 13 · Step 9 · Family Read-Only
// Dashboard (public share links).
//
// Out-of-state relatives get a share link (/family/<shareId>) that shows
// a loved one's latest safety status WITHOUT logging in. There is no
// auth-backed share store in the demo, so the citizen is derived
// DETERMINISTICALLY from the shareId (a stable string hash picks the
// name / district / status / last-update offset) — every visit to the
// same link shows the same person, and different links show different
// people, just like real share URLs. Swap in a real lookup later by
// replacing getSharedCitizen with a Prisma/Redis fetch.
// ---------------------------------------------------------------------

import type { SafetyStatus } from "@/lib/mock-data/hazard-zones";

export type SharedCitizen = {
  /** Display name of the shared citizen, e.g. "Sunita Das". */
  name: string;
  /** Latest known risk status (same enum as the citizen SafetyHero). */
  status: SafetyStatus;
  /** Human label with status emoji, e.g. "🟢 MARKED SAFE". */
  statusLabel: string;
  /** District the citizen is registered in, e.g. "Patna". */
  district: string;
  /** Last time the citizen updated their status (deterministic offset). */
  updatedAt: Date;
};

/** Status → share-page label (mirrors the citizen hero copy). */
export const SHARE_STATUS_LABELS: Record<SafetyStatus, string> = {
  SAFE: "🟢 MARKED SAFE",
  WATCH: "🟡 STAY VIGILANT",
  PREPARE: "🟠 PREPARE TO EVACUATE",
  EVACUATE: "🔴 EVACUATE NOW",
};

const NAMES = [
  "Sunita Das",
  "Rajesh Kumar",
  "Meena Sharma",
  "Arjun Patel",
  "Lakshmi Nair",
  "Abdul Rahman",
  "Priya Verma",
  "Vikram Singh",
] as const;

const DISTRICTS = [
  "Patna",
  "Kamrup",
  "Bhagalpur",
  "Darbhanga",
  "Saharsa",
  "Muzaffarpur",
] as const;

const STATUSES: SafetyStatus[] = ["SAFE", "WATCH", "PREPARE", "EVACUATE"];

/** Stable FNV-1a-ish string hash — identical every run, per shareId. */
export function hashShareId(shareId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < shareId.length; i++) {
    hash ^= shareId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Force positive + spread high bits for stable modulo picks.
  return (hash >>> 0) ^ (hash >> 16);
}

/** Min length for a plausible share token (matches the page's copy). */
const MIN_SHARE_ID_LENGTH = 4;

/**
 * Resolve a shareId to the citizen's latest (mock) status.
 * Returns null for tokens too short to be real — the page renders a
 * friendly "link not valid" state instead of a fake person.
 */
export function getSharedCitizen(
  shareId: string,
  asOf: Date = new Date(),
): SharedCitizen | null {
  const id = shareId.trim();
  if (id.length < MIN_SHARE_ID_LENGTH) return null;

  const hash = hashShareId(id);
  const status = STATUSES[hash % STATUSES.length];
  // Last update between 2 minutes and 2 hours ago — stable per link, so
  // the read-only page tells a consistent story across visits.
  const minutesAgo = 2 + (hash % 118);
  return {
    name: NAMES[hash % NAMES.length],
    status,
    statusLabel: SHARE_STATUS_LABELS[status],
    district: DISTRICTS[(hash >> 3) % DISTRICTS.length],
    updatedAt: new Date(asOf.getTime() - minutesAgo * 60_000),
  };
}
