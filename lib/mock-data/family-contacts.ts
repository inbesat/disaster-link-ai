// ---------------------------------------------------------------------
// lib/mock-data/family-contacts.ts — Phase 2 · Step 6 · family safety
// strip data.
//
// Parses the saved family circle (localStorage `citizen_family_contacts`,
// written by the Phase 1 family setup as `{ contacts, savedAt }` where
// each contact is `{ name, phone }`) and assigns each member a MOCK
// status for the strip.
//
// There is no realtime presence backend in the demo, so statuses are
// assigned deterministically (safe → unknown → in danger, cycling) to
// exercise all three dot colours — swap in real telemetry later by
// replacing `mockFamilyStatus`.
// ---------------------------------------------------------------------

export type FamilyContact = {
  /** Display name, e.g. "Sunita Das". */
  name: string;
  /** Normalized Indian phone (setup page saves +91…). */
  phone: string;
};

export type FamilyContactStatus = "safe" | "unknown" | "danger";

export type FamilyContactWithStatus = FamilyContact & {
  /** Current mock status for the strip dot. */
  status: FamilyContactStatus;
};

/** Raw localStorage shape written by the family setup page. */
type SavedFamilyPayload = {
  contacts: FamilyContact[];
  savedAt?: string;
};

/** Deterministic mock statuses, cycled across members for demo variety. */
const MOCK_STATUS_CYCLE: FamilyContactStatus[] = [
  "safe",
  "unknown",
  "danger",
  "safe",
  "unknown",
];

export function mockFamilyStatus(index: number): FamilyContactStatus {
  return MOCK_STATUS_CYCLE[index % MOCK_STATUS_CYCLE.length];
}

/**
 * Parse a raw saved-family payload into status-annotated contacts.
 * Returns [] for anything malformed or missing.
 */
export function parseFamilyContacts(raw: string | null): FamilyContactWithStatus[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedFamilyPayload;
    if (!Array.isArray(parsed?.contacts)) return [];
    return parsed.contacts
      .filter(
        (c): c is FamilyContact =>
          Boolean(c) &&
          typeof c.name === "string" &&
          typeof c.phone === "string" &&
          c.name.trim() !== "",
      )
      .map((c, i) => ({ ...c, status: mockFamilyStatus(i) }));
  } catch {
    return [];
  }
}

/** SSR-safe localStorage read (mirrors readCitizenLocation's guards). */
export function readFamilyContacts(): FamilyContactWithStatus[] {
  if (typeof window === "undefined") return [];
  try {
    return parseFamilyContacts(window.localStorage.getItem("citizen_family_contacts"));
  } catch {
    return [];
  }
}
