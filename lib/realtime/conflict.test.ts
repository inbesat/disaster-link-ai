// Phase 20 — concurrent edit handling tests: last-write-wins resolution,
// conflict detection on stale snapshots, and per-field shelter merges.
import { describe, it, expect } from "vitest";
import {
  applyLastWriteWins,
  isNewerEdit,
  mergeShelterEdits,
  type VersionedValue,
} from "./conflict";

const now = "2026-08-08T10:00:00.000Z";

function state(overrides: Partial<VersionedValue<number>> = {}): VersionedValue<number> {
  return {
    clientId: "device-a",
    version: 3,
    updatedAt: now,
    baseVersion: 2,
    value: 120,
    ...overrides,
  };
}

describe("isNewerEdit", () => {
  it("prefers the later timestamp", () => {
    const earlier = { clientId: "a", version: 1, updatedAt: "2026-08-08T09:00:00.000Z", baseVersion: 0 };
    const later = { clientId: "a", version: 1, updatedAt: "2026-08-08T09:00:01.000Z", baseVersion: 0 };
    expect(isNewerEdit(later, earlier)).toBe(true);
    expect(isNewerEdit(earlier, later)).toBe(false);
  });

  it("breaks equal timestamps by version", () => {
    const low = { clientId: "a", version: 1, updatedAt: now, baseVersion: 0 };
    const high = { clientId: "a", version: 5, updatedAt: now, baseVersion: 0 };
    expect(isNewerEdit(high, low)).toBe(true);
  });

  it("breaks fully-equal edits deterministically by clientId", () => {
    const a = { clientId: "alpha", version: 1, updatedAt: now, baseVersion: 0 };
    const b = { clientId: "bravo", version: 1, updatedAt: now, baseVersion: 0 };
    expect(isNewerEdit(a, b)).toBe(false); // "alpha" < "bravo"
    expect(isNewerEdit(b, a)).toBe(true);
  });
});

describe("applyLastWriteWins", () => {
  it("accepts the first edit to a value", () => {
    const result = applyLastWriteWins(null, {
      clientId: "device-a",
      version: 1,
      updatedAt: now,
      baseVersion: 0,
      value: 100,
    });
    expect(result.accepted).toBe(true);
    expect(result.conflict).toBe(false);
    expect(result.state.value).toBe(100);
  });

  it("accepts a newer edit and replaces the value", () => {
    const result = applyLastWriteWins(state(), {
      clientId: "device-b",
      version: 4,
      updatedAt: "2026-08-08T10:00:05.000Z",
      baseVersion: 3,
      value: 150,
    });
    expect(result.accepted).toBe(true);
    expect(result.state.value).toBe(150);
    expect(result.state.clientId).toBe("device-b");
    expect(result.state.version).toBe(5); // version monotonically bumps
  });

  it("rejects a stale (older) edit without clobbering the value", () => {
    const result = applyLastWriteWins(state(), {
      clientId: "device-a",
      version: 2,
      updatedAt: "2026-08-08T09:00:00.000Z", // older than current
      baseVersion: 1,
      value: 50,
    });
    expect(result.accepted).toBe(false);
    expect(result.state.value).toBe(120);
  });

  it("flags a conflict when the edit was based on a stale snapshot", () => {
    // Current state has moved to version 5, but the incoming edit was built
    // on version 2 — two responders edited concurrently.
    const current = state({ version: 5, updatedAt: "2026-08-08T10:00:10.000Z" });
    const result = applyLastWriteWins(current, {
      clientId: "device-c",
      version: 3,
      updatedAt: "2026-08-08T10:00:20.000Z", // newer, so it wins...
      baseVersion: 2, // ...but it was derived from a stale snapshot
      value: 200,
    });
    expect(result.conflict).toBe(true);
    expect(result.accepted).toBe(true);
  });
});

describe("mergeShelterEdits (concurrent occupancy updates)", () => {
  const baseA = {
    clientId: "field-device-1",
    version: 1,
    updatedAt: "2026-08-08T10:00:00.000Z",
    baseVersion: 0,
  };
  const baseB = {
    clientId: "field-device-2",
    version: 1,
    updatedAt: "2026-08-08T10:00:00.000Z",
    baseVersion: 0,
  };

  it("merges non-overlapping fields from both concurrent edits", () => {
    const merged = mergeShelterEdits(
      { ...baseA, occupancy: 120 },
      { ...baseB, status: "full" },
    );
    expect(merged.occupancy).toBe(120); // kept from A
    expect(merged.status).toBe("full"); // kept from B
    expect(merged.conflicts).toEqual([]);
  });

  it("keeps the newer value per-field and flags the conflicting field", () => {
    const merged = mergeShelterEdits(
      { ...baseA, occupancy: 120 },
      {
        ...baseB,
        clientId: "field-device-2",
        updatedAt: "2026-08-08T10:00:05.000Z", // newer
        occupancy: 140,
      },
    );
    expect(merged.occupancy).toBe(140);
    expect(merged.conflicts).toEqual(["occupancy"]);
  });

  it("does not flag a field both sides set identically", () => {
    const merged = mergeShelterEdits(
      { ...baseA, occupancy: 120, status: "open" },
      { ...baseB, occupancy: 120, status: "open" },
    );
    expect(merged.occupancy).toBe(120);
    expect(merged.status).toBe("open");
    expect(merged.conflicts).toEqual([]);
  });

  it("compares facility arrays by content, not reference", () => {
    const merged = mergeShelterEdits(
      { ...baseA, facilities: ["water", "medical"] },
      { ...baseB, facilities: ["water", "medical"] },
    );
    expect(merged.conflicts).toEqual([]);
  });

  it("tracks the overall newest editor on the merged result", () => {
    const merged = mergeShelterEdits(
      { ...baseA, updatedAt: "2026-08-08T10:00:10.000Z", occupancy: 120 },
      { ...baseB, status: "full" },
    );
    expect(merged.clientId).toBe("field-device-1");
    expect(merged.version).toBe(2);
  });
});
