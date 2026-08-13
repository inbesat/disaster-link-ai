// ---------------------------------------------------------------------
// lib/ai/setup/capabilities.ts — Offline-First Architecture · Phase 4
// DeviceCapabilities: what this machine can actually run. The AI Setup
// onboarding reads these to pre-select the best deployment tier (Cloud
// Only / Balanced / Full Offline) and to warn when the browser can't do
// WebGPU or lacks the RAM/storage for a local model.
//
//   • WebGPU — the compute backend WebLLM needs for good local inference.
//     Checked via navigator.gpu.requestAdapter() (never throws).
//   • RAM — navigator.deviceMemory (GB) where exposed; Chrome/Edge give a
//     coarse power-of-2. Falls back to a conservative 2 GB when absent.
//   • Storage — reuses checkStorageQuota() from Phase 3 to decide whether
//     the ~1.3 GB model can actually fit on disk.
//   • CPU — navigator.hardwareConcurrency for a rough speed signal.
//
// SSR-safe: returns a "unknown / unsupported" profile in Node.
// ---------------------------------------------------------------------

import { checkStorageQuota } from "@/lib/offline-sync/quota";
import type { StorageSnapshot } from "@/lib/offline-sync/types";

export type GpuSupport = "webgpu" | "none" | "unknown";
export type InferenceBackend = "webgpu" | "wasm" | "unavailable";

export interface DeviceCapabilities {
  /** RAM in GB (navigator.deviceMemory); 2 when unknown. */
  deviceMemoryGb: number;
  /** Logical CPU cores (navigator.hardwareConcurrency); 0 when unknown. */
  cpuCores: number;
  /** WebGPU adapter availability + name when exposed. */
  gpu: GpuSupport;
  gpuAdapterName: string | null;
  /** True when WebAssembly.SIMD is present (faster WASM fallback). */
  wasmSimd: boolean;
  /** Storage snapshot from checkStorageQuota() (browser) or unsupported. */
  storage: StorageSnapshot;
  /** Estimated MB available for the model (storage.quota - usage). */
  storageFreeBytes: number;
}

const UNKNOWN_RAM_GB = 2;

/**
 * Detects WebGPU support. Resolves quickly; `null` navigator.gpu (Safari,
 * Firefox, older Chrome, SSR) means "none".
 */
async function detectWebGpu(): Promise<{ gpu: GpuSupport; adapterName: string | null }> {
  if (typeof navigator === "undefined") return { gpu: "unknown", adapterName: null };
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter?: () => Promise<{ name?: string } | null> } }).gpu;
  if (!gpu?.requestAdapter) return { gpu: "none", adapterName: null };
  try {
    const adapter = await gpu.requestAdapter();
    if (!adapter) return { gpu: "none", adapterName: null };
    return { gpu: "webgpu", adapterName: adapter.name ?? null };
  } catch {
    return { gpu: "none", adapterName: null };
  }
}

function detectWasmSimd(): boolean {
  if (typeof WebAssembly === "undefined") return false;
  try {
    // A 128-bit v128 SIMD instruction survives validation only when SIMD
    // is enabled in the runtime.
    return WebAssembly.validate(
      new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60,
        0x00, 0x01, 0x7b, 0x03, 0x02, 0x01, 0x00, 0x0a, 0x1a, 0x01, 0x18, 0x00,
        0x41, 0x00, 0x41, 0x00, 0xfd, 0x0c, 0x00, 0x00, 0xfd, 0x62, 0x00, 0x00,
        0x0b, 0x0b,
      ]),
    );
  } catch {
    return false;
  }
}

function detectMemoryGb(): number {
  if (typeof navigator === "undefined") return UNKNOWN_RAM_GB;
  const raw = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof raw === "number" && raw > 0 ? raw : UNKNOWN_RAM_GB;
}

function detectCpuCores(): number {
  if (typeof navigator === "undefined") return 0;
  return navigator.hardwareConcurrency ?? 0;
}

/**
 * Full device profile. Storage probing runs in parallel with the GPU
 * probe and never blocks the onboarding if either is slow.
 */
export async function checkDeviceCapabilities(): Promise<DeviceCapabilities> {
  const [gpu, storage] = await Promise.all([detectWebGpu(), checkStorageQuota()]);
  const storageFreeBytes =
    storage.supported && storage.quotaBytes > 0
      ? Math.max(0, storage.quotaBytes - storage.usageBytes)
      : 0;
  return {
    deviceMemoryGb: detectMemoryGb(),
    cpuCores: detectCpuCores(),
    gpu: gpu.gpu,
    gpuAdapterName: gpu.adapterName,
    wasmSimd: detectWasmSimd(),
    storage,
    storageFreeBytes,
  };
}

/** Maps GPU support to the inference backend WebLLM would use. */
export function inferenceBackend(caps: DeviceCapabilities): InferenceBackend {
  if (caps.gpu === "webgpu") return "webgpu";
  if (caps.wasmSimd) return "wasm";
  return "unavailable";
}

/**
 * Binary fit check: can this device realistically run a model of
 * `modelBytes` in the browser?
 */
export function canRunModel(caps: DeviceCapabilities, modelBytes: number): boolean {
  if (caps.gpu === "webgpu" || caps.wasmSimd) {
    return caps.storageFreeBytes >= modelBytes && caps.deviceMemoryGb >= 4;
  }
  return false;
}

/** Human-readable one-liner for the capability chip row. */
export function describeBackend(caps: DeviceCapabilities): string {
  const backend = inferenceBackend(caps);
  if (backend === "webgpu") return `WebGPU · ${caps.gpuAdapterName ?? "adapter"}`;
  if (backend === "wasm") return "WASM (no WebGPU — slower inference)";
  return "Unsupported — cloud only";
}
