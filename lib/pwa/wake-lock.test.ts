// ---------------------------------------------------------------------
// lib/pwa/wake-lock.test.ts — Phase 11 screen wake-lock guards
// ---------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import {
  isDocumentVisible,
  isWakeLockSupported,
  releaseScreenWakeLock,
  requestScreenWakeLock,
  type WakeLockSentinelLike,
} from "./wake-lock";

describe("isWakeLockSupported", () => {
  it("false without a wakeLock API", () => {
    expect(isWakeLockSupported({ navigator: {} })).toBe(false);
    expect(isWakeLockSupported({ navigator: undefined })).toBe(false);
  });

  it("true when navigator.wakeLock exists", () => {
    expect(isWakeLockSupported({ navigator: { wakeLock: {} } })).toBe(true);
  });
});

describe("isDocumentVisible", () => {
  it("true when visible (or no document)", () => {
    expect(isDocumentVisible({ document: { visibilityState: "visible" } })).toBe(true);
    expect(isDocumentVisible({})).toBe(true);
  });

  it("false when hidden", () => {
    expect(isDocumentVisible({ document: { visibilityState: "hidden" } })).toBe(false);
  });
});

describe("requestScreenWakeLock", () => {
  it("requests 'screen' and returns the sentinel", async () => {
    const sentinel: WakeLockSentinelLike = { released: false, release: vi.fn() };
    const request = vi.fn().mockResolvedValue(sentinel);
    const deps = {
      navigator: { wakeLock: { request } },
      document: { visibilityState: "visible" },
    };
    await expect(requestScreenWakeLock(deps)).resolves.toBe(sentinel);
    expect(request).toHaveBeenCalledWith("screen");
  });

  it("returns null when unsupported", async () => {
    await expect(requestScreenWakeLock({ navigator: {} })).resolves.toBeNull();
  });

  it("returns null when the document is hidden", async () => {
    const deps = {
      navigator: { wakeLock: { request: vi.fn() } },
      document: { visibilityState: "hidden" },
    };
    await expect(requestScreenWakeLock(deps)).resolves.toBeNull();
  });

  it("returns null when the API rejects", async () => {
    const deps = {
      navigator: { wakeLock: { request: vi.fn().mockRejectedValue(new Error("denied")) } },
      document: { visibilityState: "visible" },
    };
    await expect(requestScreenWakeLock(deps)).resolves.toBeNull();
  });
});

describe("releaseScreenWakeLock", () => {
  it("releases a held sentinel", async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    await releaseScreenWakeLock({ released: false, release });
    expect(release).toHaveBeenCalled();
  });

  it("skips an already-released or missing sentinel", async () => {
    const release = vi.fn();
    await releaseScreenWakeLock({ released: true, release });
    await releaseScreenWakeLock(null);
    expect(release).not.toHaveBeenCalled();
  });

  it("swallows release errors", async () => {
    await releaseScreenWakeLock({ released: false, release: vi.fn().mockRejectedValue(new Error("gone")) });
  });
});
