"use client";

// ---------------------------------------------------------------------
// hooks/useModelSetup.ts — Offline-First Architecture · Phase 4
// useModelSetup(): orchestrates the entire AI Setup onboarding flow:
//
//   1. Device capability check (RAM / WebGPU / storage) → recommended tier.
//   2. Selected AiTier + the model chosen for it (from MODEL_CATALOG).
//   3. Download progress via WebLLMProvider.initialize(onProgress) — the
//      engine streams 0-100% and reports ETA from bytes/<elapsed>.
//   4. A live A/B test ("Testing Your AI") comparing a canned cloud reply
//      against the local reply for the same prompt.
//
// Persists the tier choice to localStorage so onboarding can be completed
// once and skipped later. SSR-safe (no browser APIs at module scope).
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { checkDeviceCapabilities, type DeviceCapabilities } from "@/lib/ai/setup/capabilities";
import { recommendTier, type AiTierId, type AiModelOption } from "@/lib/ai/setup/model-tiers";
import { modelById, MODEL_CATALOG, tierById, AI_TIERS } from "@/lib/ai/setup/model-tiers";
import { WebLLMProvider } from "@/lib/ai-bridge/webllm-provider";

const STORAGE_KEY = "drip_ai_tier_v1";

export type SetupStep = "choose" | "download" | "test";

export interface ModelSetupState {
  step: SetupStep;
  capabilities: DeviceCapabilities | null;
  checkingCapabilities: boolean;
  recommendedTier: AiTierId | null;
  selectedTier: AiTierId | null;
  selectedModel: AiModelOption | null;
  progress: number; // 0..1
  etaSeconds: number | null;
  downloadActive: boolean;
  downloadComplete: boolean;
  localReply: string | null;
  cloudReply: string | null;
  testing: boolean;
}

const CLOUD_REPLY_SAMPLE =
  "Flood approaching Patna: evacuate low-lying villages within 3 km of the Ganga. " +
  "Move to the nearest shelter — Hall A has 120 safe berths. Keep emergency rations and " +
  "a flashlight. Follow @district_command for live updates.";

const DONE: ModelSetupState = {
  step: "test",
  capabilities: null,
  checkingCapabilities: false,
  recommendedTier: null,
  selectedTier: null,
  selectedModel: null,
  progress: 0,
  etaSeconds: null,
  downloadActive: false,
  downloadComplete: false,
  localReply: null,
  cloudReply: null,
  testing: false,
};

function readStoredTier(): AiTierId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return tierById(raw)?.id ?? null;
  } catch {
    return null;
  }
}

export function useModelSetup() {
  const [state, setState] = useState<ModelSetupState>({
    ...DONE,
    recommendedTier: null,
    selectedTier: readStoredTier(),
    step: "choose",
  });
  const providerRef = useRef<WebLLMProvider | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const lastPctRef = useRef(0);

  const provider = (): WebLLMProvider => {
    if (!providerRef.current) providerRef.current = new WebLLMProvider();
    return providerRef.current;
  };

  // Load device capabilities + recommended tier on mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setState((s) => ({ ...s, checkingCapabilities: true }));
      const caps = await checkDeviceCapabilities();
      if (cancelled) return;
      const recommended = recommendTier(caps);
      setState((s) => ({
        ...s,
        capabilities: caps,
        checkingCapabilities: false,
        recommendedTier: recommended,
        // Follow the recommendation only when the user hasn't chosen yet.
        selectedTier: s.selectedTier ?? recommended,
        selectedModel: modelById(tierById(s.selectedTier ?? recommended)?.modelId ?? null) ?? null,
      }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectTier = useCallback((id: AiTierId) => {
    const tier = tierById(id);
    if (!tier) return;
    setState((s) => ({
      ...s,
      selectedTier: id,
      selectedModel: modelById(tier.modelId) ?? null,
      step: id === "cloud-only" ? "test" : "download",
    }));
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
  }, []);

  const startDownload = useCallback(async () => {
    const model = state.selectedModel;
    if (!model) return;
    setState((s) => ({ ...s, downloadActive: true, progress: 0, downloadComplete: false }));
    startedAtRef.current = Date.now();
    lastPctRef.current = 0;

    const ok = await provider().initialize((p) => {
      const now = Date.now();
      const elapsedSec = startedAtRef.current ? (now - startedAtRef.current) / 1000 : 0;
      lastPctRef.current = p;
      // Linear ETA: total predicted time = elapsed / fraction so far.
      const eta = elapsedSec > 0 && p > 0 ? elapsedSec * ((1 - p) / p) : null;
      setState((s) => ({
        ...s,
        progress: p,
        etaSeconds: eta,
      }));
    });

    setState((s) => ({
      ...s,
      downloadActive: false,
      downloadComplete: ok,
      progress: ok ? 1 : s.progress,
      step: ok ? "test" : s.step,
    }));
  }, [state.selectedModel]);

  const runComparisonTest = useCallback(async () => {
    const model = state.selectedModel;
    if (!model) return;
    setState((s) => ({ ...s, testing: true, localReply: null, cloudReply: null }));

    // Cloud path is canned for the onboarding demo (the cloud planner stays
    // authoritative inside the dashboard's useAI flow).
    const cloudReply = CLOUD_REPLY_SAMPLE;

    let localReply: string | null = null;
    try {
      localReply = (await provider().generateResponse("What should I do during a flood?", {}))
        .text;
    } catch {
      localReply = "Local model unavailable on this device.";
    }

    setState((s) => ({ ...s, testing: false, localReply, cloudReply }));
  }, [state.selectedModel]);

  const skipSetup = useCallback(() => {
    setState((s) => ({ ...s, step: "test" }));
  }, []);

  return {
    ...state,
    tiers: AI_TIERS,
    models: MODEL_CATALOG,
    selectTier,
    startDownload,
    runComparisonTest,
    skipSetup,
  };
}

export default useModelSetup;