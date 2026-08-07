// Phase 20 — concurrent edit handling (step 7: last-write-wins / merge).
// Pure, deterministic logic so it can be unit-tested and shared by the
// WebSocket and polling paths alike.

/** Metadata every client edit carries. */
export interface ConflictEdit {
  clientId: string;
  /** Monotonic per-client sequence number (Lamport-style). */
  version: number;
  /** ISO 8601 timestamp of the edit. */
  updatedAt: string;
  /** The version the editing client had seen before making this edit. */
  baseVersion: number;
}

/** A full state snapshot tagged with edit metadata. */
export interface VersionedValue<T> extends ConflictEdit {
  value: T;
}

export interface LwwResult<T> {
  /** Whether the incoming edit replaced the current state. */
  accepted: boolean;
  /** True when the edit was based on a stale snapshot (a real conflict). */
  conflict: boolean;
  state: VersionedValue<T>;
}

/** Compare two edits; returns true when `a` is strictly newer than `b`. */
export function isNewerEdit(a: ConflictEdit, b: ConflictEdit): boolean {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt;
  if (a.version !== b.version) return a.version > b.version;
  return a.clientId > b.clientId; // deterministic tiebreak
}

/**
 * Last-write-wins resolver for a single versioned value. A conflict is flagged
 * when the incoming edit was derived from a stale snapshot (its `baseVersion`
 * is behind the current version) — i.e. two users edited concurrently.
 */
export function applyLastWriteWins<T>(
  current: VersionedValue<T> | null,
  incoming: ConflictEdit & { value: T },
): LwwResult<T> {
  const conflict = current !== null && incoming.baseVersion < current.version;
  const accepted = current === null || isNewerEdit(incoming, current);
  const state: VersionedValue<T> = accepted
    ? {
        clientId: incoming.clientId,
        version: Math.max(incoming.version, current?.version ?? 0) + 1,
        updatedAt: incoming.updatedAt,
        baseVersion: incoming.baseVersion,
        value: incoming.value,
      }
    : (current as VersionedValue<T>); // accepted=false implies current exists
  return { accepted, conflict, state };
}

/** Fields a shelter occupancy edit may touch. */
export interface ShelterEdit extends ConflictEdit {
  occupancy?: number;
  status?: "open" | "full" | "closed";
  facilities?: string[];
  notes?: string;
}

export interface MergedShelterEdit extends ShelterEdit {
  /** Fields where both edits set different values — surfaced to the admin. */
  conflicts: string[];
}

const SHELTER_FIELDS = ["occupancy", "status", "facilities", "notes"] as const;

/**
 * Merge two concurrent shelter edits field-by-field (per-field last-write-wins).
 * Unlike a wholesale replace, updating occupancy on one device while a status
 * change happens on another does not clobber either change. Fields both sides
 * set with different values are reported as `conflicts` for human review.
 */
export function mergeShelterEdits(a: ShelterEdit, b: ShelterEdit): MergedShelterEdit {
  const conflicts: string[] = [];
  const merged: MergedShelterEdit = {
    clientId: isNewerEdit(a, b) ? a.clientId : b.clientId,
    version: Math.max(a.version, b.version) + 1,
    updatedAt: isNewerEdit(a, b) ? a.updatedAt : b.updatedAt,
    // The merge supersedes both edits, so it is based on the newest base.
    baseVersion: Math.max(a.baseVersion, b.baseVersion),
    conflicts,
  };

  const out = merged as unknown as Record<string, unknown>;
  for (const field of SHELTER_FIELDS) {
    const av = a[field];
    const bv = b[field];
    if (av === undefined && bv === undefined) continue;
    if (av === undefined) {
      out[field] = bv;
    } else if (bv === undefined) {
      out[field] = av;
    } else {
      out[field] = isNewerEdit(a, b) ? av : bv;
      if (!sameValue(av, bv)) conflicts.push(field);
    }
  }
  return merged;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
}
