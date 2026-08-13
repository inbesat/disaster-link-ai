// ---------------------------------------------------------------------
// lib/offline-sync/quota.test.ts
// Phase 3 · Storage quota checker + formatting helpers.
// ---------------------------------------------------------------------

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_BUDGET_BYTES,
  MODEL_DOWNLOAD_MIN_BYTES,
  budgetFraction,
  canFitLocalModel,
  checkStorageQuota,
  formatBytes,
  requestPersistence,
} from "./quota";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("checkStorageQuota", () => {
  it("returns supported:false when navigator.storage is absent", async () => {
    vi.stubGlobal("navigator", {});
    const snap = await checkStorageQuota();
    expect(snap.supported).toBe(false);
    expect(snap.usageBytes).toBe(0);
  });

  it("reads estimate + persisted flag in a browser", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: vi.fn(async () => ({ usage: 45 * 1024 * 1024, quota: 1_000_000_000_000 })),
        persisted: vi.fn(async () => true),
      },
    });
    const snap = await checkStorageQuota();
    expect(snap.supported).toBe(true);
    expect(snap.usageBytes).toBe(45 * 1024 * 1024);
    expect(snap.persisted).toBe(true);
  });

  it("never throws when estimate() rejects", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: vi.fn(async () => {
          throw new Error("blocked");
        }),
      },
    });
    const snap = await checkStorageQuota();
    expect(snap.supported).toBe(false);
    expect(snap.error).toContain("blocked");
  });
});

describe("requestPersistence", () => {
  it("returns false when unsupported", async () => {
    vi.stubGlobal("navigator", {});
    expect(await requestPersistence()).toBe(false);
  });

  it("returns the persist() grant result", async () => {
    vi.stubGlobal("navigator", {
      storage: { persist: vi.fn(async () => true) },
    });
    expect(await requestPersistence()).toBe(true);
  });
});

describe("canFitLocalModel", () => {
  it("is false when the quota is too small for a 1.3 GB model", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: vi.fn(async () => ({
          usage: 0,
          quota: STORAGE_BUDGET_BYTES,
        })),
      },
    });
    expect(await canFitLocalModel()).toBe(false);
    expect(MODEL_DOWNLOAD_MIN_BYTES).toBeGreaterThan(STORAGE_BUDGET_BYTES);
  });
});

describe("formatBytes", () => {
  it("formats bytes, KB, MB, GB", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(45 * 1024 * 1024)).toBe("45.0 MB");
    expect(formatBytes(1.3 * 1024 * 1024 * 1024)).toBe("1.3 GB");
  });

  it("keeps NaN/negative/Infinity readable", () => {
    expect(formatBytes(Number.NaN)).toBe("0 B");
    expect(formatBytes(-100)).toBe("0 B");
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("0 B");
  });
});

describe("budgetFraction", () => {
  it("clamps to 1 and never below 0", () => {
    expect(budgetFraction(0)).toBe(0);
    expect(budgetFraction(STORAGE_BUDGET_BYTES)).toBe(1);
    expect(budgetFraction(STORAGE_BUDGET_BYTES * 10)).toBe(1);
    expect(budgetFraction(STORAGE_BUDGET_BYTES / 2)).toBeCloseTo(0.5);
  });
});