// ---------------------------------------------------------------------
// lib/ai/setup/capabilities.test.ts
// Phase 4 · device capability checker: RAM, WebGPU, WASM-SIMD and the
// storage-driven fit checks that steer the onboarding tier.
// ---------------------------------------------------------------------

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canRunModel,
  checkDeviceCapabilities,
  describeBackend,
  inferenceBackend,
} from "./capabilities";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubNavigator(overrides: Record<string, unknown> = {}) {
  vi.stubGlobal("navigator", {
    deviceMemory: 8,
    hardwareConcurrency: 8,
    gpu: {
      requestAdapter: vi.fn(async () => ({ name: "NVIDIA RTX" })),
    },
    storage: {
      estimate: vi.fn(async () => ({
        usage: 100 * 1024 * 1024,
        quota: 2 * 1024 * 1024 * 1024,
      })),
      persisted: vi.fn(async () => true),
    },
    ...overrides,
  });
}

describe("checkDeviceCapabilities", () => {
  it("detects WebGPU, RAM and free storage in a capable browser", async () => {
    stubNavigator();
    const caps = await checkDeviceCapabilities();
    expect(caps.gpu).toBe("webgpu");
    expect(caps.gpuAdapterName).toBe("NVIDIA RTX");
    expect(caps.deviceMemoryGb).toBe(8);
    expect(caps.storageFreeBytes).toBe(2 * 1024 * 1024 * 1024 - 100 * 1024 * 1024);
    expect(caps.storage.supported).toBe(true);
  });

  it("reports none when navigator.gpu is absent", async () => {
    stubNavigator({ gpu: undefined });
    const caps = await checkDeviceCapabilities();
    expect(caps.gpu).toBe("none");
  });

  it("reports unknown in SSR (no navigator)", async () => {
    vi.stubGlobal("navigator", undefined);
    const caps = await checkDeviceCapabilities();
    expect(caps.gpu).toBe("unknown");
    expect(caps.deviceMemoryGb).toBe(2);
    expect(caps.storage.supported).toBe(false);
  });

  it("never throws when requestAdapter rejects", async () => {
    stubNavigator({
      gpu: {
        requestAdapter: vi.fn(async () => {
          throw new Error("adapter blocked");
        }),
      },
    });
    const caps = await checkDeviceCapabilities();
    expect(caps.gpu).toBe("none");
  });
});

describe("inferenceBackend", () => {
  const base = {
    deviceMemoryGb: 8,
    cpuCores: 8,
    gpuAdapterName: null,
    storageFreeBytes: 0,
    storage: { supported: false, usageBytes: 0, quotaBytes: 0, persisted: false },
  } as const;
  it("maps WebGPU → webgpu, WASM-SIMD → wasm, else unavailable", () => {
    expect(
      inferenceBackend({ ...base, gpu: "webgpu", wasmSimd: true }),
    ).toBe("webgpu");
    expect(
      inferenceBackend({ ...base, gpu: "none", wasmSimd: true }),
    ).toBe("wasm");
    expect(
      inferenceBackend({ ...base, gpu: "none", wasmSimd: false }),
    ).toBe("unavailable");
  });
});

describe("canRunModel", () => {
  it("returns true with WebGPU + RAM + storage", () => {
    const caps = {
      gpu: "webgpu",
      wasmSimd: true,
      deviceMemoryGb: 8,
      storageFreeBytes: 2 * 1024 * 1024 * 1024,
    } as never;
    expect(canRunModel(caps, 600 * 1024 * 1024)).toBe(true);
  });

  it("returns false without WebGPU or WASM", () => {
    const caps = {
      gpu: "none",
      wasmSimd: false,
      deviceMemoryGb: 8,
      storageFreeBytes: 2 * 1024 * 1024 * 1024,
    } as never;
    expect(canRunModel(caps, 600 * 1024 * 1024)).toBe(false);
  });
});

describe("describeBackend", () => {
  it("labels the WebGPU adapter when available", () => {
    expect(
      describeBackend({
        gpu: "webgpu",
        gpuAdapterName: "Intel Arc",
        wasmSimd: true,
        deviceMemoryGb: 8,
        cpuCores: 8,
        storageFreeBytes: 0,
        storage: { supported: false, usageBytes: 0, quotaBytes: 0, persisted: false },
      }),
    ).toContain("Intel Arc");
  });
});