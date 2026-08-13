"use client";

// ---------------------------------------------------------------------
// lib/ai-bridge/ai-bridge.ts — Offline-First Architecture · Phase 1
// AIBridge: the routing heart of the offline-first AI story. Uses the
// ConnectivityMonitor (navigator.onLine + Supabase heartbeat) to decide
// whether to answer from the cloud planner or the local Gemma model:
//
//   1. Backend reachable → CloudAIProvider (full tool-calling planner).
//   2. Backend unreachable & local model loaded → LocalGemmaProvider.
//   3. Neither → the guided offline notice (BridgeMode 'error').
//
// The chat UI never knows which path answered — both providers return the
// same AIResponse shape. `useAI()` (hooks/useAI.ts) wraps this class for
// the React UI and owns message state + the server sync queue.
// ---------------------------------------------------------------------

import type { AIProvider, AIResponse, ChatContext, ProviderStatus } from "./types";
import { CloudAIProvider } from "./cloud-provider";
import { LocalGemmaProvider } from "./local-provider";
import { ConnectivityMonitor, getConnectivityMonitor } from "./connectivity";

export interface AIBridgeOptions {
  cloud?: AIProvider;
  local?: AIProvider;
  monitor?: ConnectivityMonitor;
}

export class AIBridge {
  private cloud: AIProvider;
  private local: AIProvider;
  private monitor: ConnectivityMonitor;

  constructor(options: AIBridgeOptions = {}) {
    this.cloud = options.cloud ?? new CloudAIProvider();
    this.local = options.local ?? new LocalGemmaProvider();
    this.monitor = options.monitor ?? getConnectivityMonitor();
  }

  /** Combined readiness — the status the UI badge should display. */
  getStatus(): ProviderStatus {
    const snapshot = this.monitor.getSnapshot();
    if (snapshot.online) return "online";
    return this.local.getStatus();
  }

  /**
   * Routes a prompt to cloud or local. Uses the latest connectivity snapshot
   * (never a blocking probe on the hot path — the monitor heartbeats in the
   * background), then falls back to local/offline when cloud is unreachable.
   */
  async route(prompt: string, context: ChatContext = {}): Promise<AIResponse> {
    const snapshot = this.monitor.getSnapshot();
    if (snapshot.online) {
      const res = await this.cloud.generateResponse(prompt, context);
      if (!res.error) return res;
      // Cloud answered but errored mid-stream (5xx etc.) — don't drop the
      // user's message; step down to local before giving up entirely.
      const localRes = await this.tryLocal(prompt, context);
      return localRes ?? res;
    }
    const localRes = await this.tryLocal(prompt, context);
    return localRes ?? this.offlineReply();
  }

  /** Runs the local model when ready; returns null so callers keep cloud err. */
  private async tryLocal(
    prompt: string,
    context: ChatContext,
  ): Promise<AIResponse | null> {
    if (this.local.getStatus() === "local-loading") {
      await this.local.loadModel?.();
    }
    if (this.local.getStatus() === "local-ready") {
      const res = await this.local.generateResponse(prompt, context);
      return res.error ? null : res;
    }
    return null;
  }

  private offlineReply(): AIResponse {
    return {
      text:
        "I'm offline and the local safety model isn't ready yet. " +
        "Please reconnect to the internet, or start the local model download from " +
        "Settings · Offline AI so emergency planning keeps working in blackouts.",
      mode: "error",
      durationMs: 0,
      error: true,
    };
  }

  /** Preloads the local Gemma model in the background (returns immediately). */
  startLocalModelWarmup(): Promise<boolean> {
    return (this.local as LocalGemmaProvider).loadModel?.() ?? Promise.resolve(false);
  }
}

/** App/device-wide bridge singleton shared by useAI() and admin previews. */
let sharedBridge: AIBridge | null = null;

export function getAIBridge(): AIBridge {
  if (!sharedBridge) sharedBridge = new AIBridge();
  return sharedBridge;
}