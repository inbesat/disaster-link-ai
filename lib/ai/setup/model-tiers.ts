// ---------------------------------------------------------------------
// lib/ai/setup/model-tiers.ts — Offline-First Architecture · Phase 4
// The three deployment tiers offered in AI Setup onboarding:
//
//   • cloud-only   — no local model; everything routes to the cloud planner.
//   • balanced     — hybrid: cloud when online, a small local model in
//                    blackouts (default → Gemma 2B 4-bit).
//   • full-offline — prioritize the local model; best on WebGPU devices.
//
// MODEL_CATALOG mirrors the Phase 4 decision matrix (Gemma 2B IT 4-bit,
// Phi-2 2.7B 4-bit, TinyLlama 1.1B 4-bit) with the hackathon-recommended
// TinyLlama tuned on disaster Q&A as the fast/cheap option.
// ---------------------------------------------------------------------

export type AiTierId = "cloud-only" | "balanced" | "full-offline";
export type ModelQuality = "good" | "better" | "okay";
export type ModelSpeed = "medium" | "slow" | "fast";

export interface AiModelOption {
  id: string;
  /** WebLLM/MLC model id used by the engine (lowercase, -MLC suffix). */
  modelId: string;
  label: string;
  family: "gemma" | "phi" | "tinylama";
  /** Approx. size of the 4-bit weights, bytes. */
  sizeBytes: number;
  quality: ModelQuality;
  speed: ModelSpeed;
  description: string;
}

export interface AiTier {
  id: AiTierId;
  label: string;
  description: string;
  /** Short badge shown on the onboarding card. */
  badge: string;
  /** Model used when this tier enables a local engine (null = cloud-only). */
  modelId: string | null;
}

/** Phase 4 decision-matrix catalog (hackathon-recommended order). */
export const MODEL_CATALOG: AiModelOption[] = [
  {
    id: "tinyllama-disaster",
    modelId: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
    label: "TinyLlama 1.1B · disaster-tuned",
    family: "tinylama",
    sizeBytes: 600 * 1024 * 1024, // ~600 MB
    quality: "good",
    speed: "fast",
    description: "Fine-tuned on 500 disaster Q&A pairs — small, fast, domain-fit.",
  },
  {
    id: "gemma-2b",
    modelId: "gemma-2b-it-q4f16_1-MLC",
    label: "Gemma 2B IT · 4-bit",
    family: "gemma",
    sizeBytes: 1.3 * 1024 * 1024 * 1024, // ~1.3 GB
    quality: "good",
    speed: "medium",
    description: "Primary choice — balanced quality for general emergency planning.",
  },
  {
    id: "phi-2",
    modelId: "Phi-2-q4f16_1-MLC",
    label: "Phi-2 2.7B · 4-bit",
    family: "phi",
    sizeBytes: 1.6 * 1024 * 1024 * 1024, // ~1.6 GB
    quality: "better",
    speed: "slow",
    description: "High-end devices only — best quality, slowest inference.",
  },
];

/** The three onboarding tiers (card order in the UI). */
export const AI_TIERS: AiTier[] = [
  {
    id: "cloud-only",
    label: "Cloud Only",
    badge: "0 MB",
    description: "Every answer routes to the cloud planner. No local model, no offline AI.",
    modelId: null,
  },
  {
    id: "balanced",
    label: "Balanced",
    badge: "600 MB–1.3 GB",
    description: "Cloud when online, local Gemma/TinyLlama in blackouts. Best of both.",
    modelId: "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
  },
  {
    id: "full-offline",
    label: "Full Offline",
    badge: "1.3 GB",
    description: "Prioritize the local model. Requires WebGPU + ~1.3 GB free.",
    modelId: "gemma-2b-it-q4f16_1-MLC",
  },
];

export function modelById(modelId: string | null): AiModelOption | undefined {
  return MODEL_CATALOG.find((m) => m.modelId === modelId);
}

export function tierById(id: string | null | undefined): AiTier | undefined {
  return AI_TIERS.find((t) => t.id === id);
}

/**
 * Picks the best tier for a device profile:
 *   - no GPU + no WASM → cloud-only
 *   - WebGPU + ≥ 4 GB RAM + ≥ 1.6 GB storage → full-offline
 *   - WASM fallback or low RAM → balanced
 *   - otherwise → cloud-only (safe default)
 */
export function recommendTier(caps: {
  gpu: "webgpu" | "none" | "unknown";
  wasmSimd: boolean;
  deviceMemoryGb: number;
  storageFreeBytes: number;
}): AiTierId {
  const canGpu = caps.gpu === "webgpu";
  const canWasm = caps.wasmSimd;
  const hasRam = caps.deviceMemoryGb >= 4;
  const hasStorageForBig = caps.storageFreeBytes >= 1.6 * 1024 * 1024 * 1024;
  const hasStorageForSmall = caps.storageFreeBytes >= 600 * 1024 * 1024;

  if (canGpu && hasRam && hasStorageForBig) return "full-offline";
  if ((canGpu || canWasm) && hasStorageForSmall) return "balanced";
  return "cloud-only";
}
