"use client";

// ---------------------------------------------------------------------
// hooks/useAI.ts — Offline-First Architecture · Phase 1 · Deliverable 3
// useAI(): the React hook that exposes sendMessage() to the chat UI while
// hiding the AI Bridge entirely. It:
//   1. Maintains the message list (optimistic append + assistant reply).
//   2. Routes every prompt through the shared AIBridge (cloud ↔ local).
//   3. Runs the ConnectivityMonitor so `status`/`isOnline` stay live, and
//      starts the monitor lifecycle on mount.
//   4. Persists messages to localStorage (survives refresh/blackout).
//   5. Returns a plain-text or error reply depending on BridgeMode.
//
// Usage (drop-in for the dashboard AI planner):
//   const { messages, sendMessage, status, isOnline, error } = useAI();
//   sendMessage("What's the risk for Patna?");            // → routed
//   sendMessage(text, { currentDistrict: "Patna", provider: "groq-llama3" });
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AIBridge, getAIBridge } from "@/lib/ai-bridge/ai-bridge";
import type {
  AIResponse,
  BridgeMode,
  ChatContext,
  ChatMessage,
  ProviderStatus,
} from "@/lib/ai-bridge/types";

const STORAGE_KEY = "drip_ai_bridge_messages_v1";

export interface UseAIOptions {
  /** Initial conversation (e.g. restored from a session). */
  initialMessages?: ChatMessage[];
  /** Hidden context sent to the cloud planner (district scoping). */
  currentDistrict?: string;
  /** Provider preference from Settings · AI. */
  provider?: string;
  /** Persist the conversation to localStorage (default true). */
  persist?: boolean;
  /** Shared bridge override — used by tests / admin preview. */
  bridge?: AIBridge;
}

export interface UseAIReturn {
  messages: ChatMessage[];
  /** 'online' | 'offline' | 'local-ready' | 'local-loading' | 'local-unavailable' */
  status: ProviderStatus;
  /** True when the backend heartbeat reports reachable. */
  isOnline: boolean;
  /** True while a reply is being generated (cloud or local). */
  isGenerating: boolean;
  /** Which path answered the last message. */
  lastMode: BridgeMode | null;
  /** Non-fatal stream/offline notices (e.g. guide-to-reconnect text). */
  error: string | null;
  /** Send a prompt. Returns the raw AIResponse for the caller. */
  sendMessage: (text: string, opts?: ChatContext) => Promise<AIResponse>;
  /** Retries the last user prompt (e.g. after the link returns). */
  retryLast: () => Promise<void>;
  /** Starts the local Gemma download/warm-up (does not block). */
  warmupLocalModel: () => Promise<boolean>;
  /** Clears the conversation + persisted copy. */
  clearMessages: () => void;
  /** Approximate token count of the current conversation. */
  tokenEstimate: number;
}

function readStored(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useAI(options: UseAIOptions = {}): UseAIReturn {
  const bridge = options.bridge ?? getAIBridge();
  const [messages, setMessages] = useState<ChatMessage[]>(
    options.initialMessages ?? readStored(),
  );
  const [status, setStatus] = useState<ProviderStatus>("online");
  const [isOnline, setIsOnline] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastMode, setLastMode] = useState<BridgeMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastPrompt = useRef<{ text: string; opts: ChatContext } | null>(null);

  const persist = options.persist ?? true;

  // Persist conversation — survives refresh and stays available offline.
  useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage full/unavailable — conversation still works for the session.
    }
  }, [messages, persist]);

  // Live connectivity: heartbeat-driven status + the online/offline flip.
  useEffect(() => {
    const monitor = bridge["monitor"] as ConnectivityMonitorLike | undefined;
    if (!monitor) {
      setStatus(bridge.getStatus());
      return;
    }
    const unsub = monitor.subscribe((snapshot) => {
      setStatus(snapshot.online ? "online" : bridge.getStatus());
      setIsOnline(snapshot.online);
    });
    setStatus(bridge.getStatus());
    monitor.start();
    return () => {
      unsub();
      monitor.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridge]);

  const sendMessage = useCallback(
    async (text: string, opts: ChatContext = {}): Promise<AIResponse> => {
      const trimmed = text.trim();
      if (!trimmed || isGenerating) {
        return { text: "", mode: "error", durationMs: 0, error: true };
      }

      const context: ChatContext = {
        currentDistrict: opts.currentDistrict ?? options.currentDistrict,
        provider: opts.provider ?? options.provider,
        history: messages,
      };
      lastPrompt.current = { text: trimmed, opts: context };

      // Optimistic user turn.
      const userMessage: ChatMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setIsGenerating(true);
      setError(null);

      const res = await bridge.route(trimmed, context);
      setIsGenerating(false);
      setLastMode(res.mode);
      if (res.error) setError(res.text);
      else setMessages((prev) => [...prev, { role: "assistant", content: res.text }]);

      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, isGenerating, options.currentDistrict, options.provider, bridge],
  );

  const retryLast = useCallback(async () => {
    const last = lastPrompt.current;
    if (!last) return;
    lastPrompt.current = null;
    await sendMessage(last.text, last.opts);
  }, [sendMessage]);

  const warmupLocalModel = useCallback(() => bridge.startLocalModelWarmup(), [bridge]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  const tokenEstimate = useMemo(
    () =>
      messages.reduce(
        (sum, m) => sum + Math.max(1, Math.ceil(m.content.length / 4)),
        0,
      ),
    [messages],
  );

  return {
    messages,
    status,
    isOnline,
    isGenerating,
    lastMode,
    error,
    sendMessage,
    retryLast,
    warmupLocalModel,
    clearMessages,
    tokenEstimate,
  };
}

export default useAI;

/** Structural access to the monitor for the live-status subscription above. */
interface ConnectivityMonitorLike {
  start(): void;
  stop(): void;
  subscribe(listener: (snapshot: { online: boolean }) => void): () => void;
}