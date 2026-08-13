"use client";

// ---------------------------------------------------------------------
// hooks/useOfflineModelLifecycle.ts — Offline-First Architecture · Phase 10
// Memory management for the local AI model.
//
//   • Lazy loading — the model is NOT downloaded/loaded on page load; it
//     warms up only on the first chat query (`loadOnDemand()`), matching
//     the Phase 10 spec. Callers can optionally prewarm in the background
//     after the page is idle instead.
//   • Memory management — when the page is backgrounded (visibilitychange
//     → hidden), the model is unloaded from RAM to free 100s of MB on
//     mobile; it lazily reloads on the next visible query. An idle timer
//     (default 5 min of no chat) also unloads to keep the tab light.
//
// The provider must expose `loadModel()` and `unloadModel()`; worker-based
// providers satisfy both. Safe with SSR and providers without an unload
// method (graceful no-op).
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import type { AIProvider } from "@/lib/ai-bridge/types";

export interface ModelLifecycleProvider extends AIProvider {
  unloadModel?: () => Promise<void>;
}

export interface ModelLifecycleOptions {
  provider?: ModelLifecycleProvider | null;
  /** Ms of inactivity after which the model unloads (0 disables). */
  idleUnloadMs?: number;
  /** Auto-warm the model after mount (default false — lazy). */
  prewarm?: boolean;
  /** Unload when the page/tab is backgrounded (default true). */
  unloadOnHidden?: boolean;
}

export interface ModelLifecycle {
  /** True while the model is downloading/initialising. */
  loading: boolean;
  /** True once the model finished loading. */
  loaded: boolean;
  /** Lazy-load on demand (first chat query). Safe to call repeatedly. */
  loadOnDemand: () => Promise<boolean>;
  /** Forces an immediate unload (backgrounding / storage pressure). */
  unload: () => Promise<void>;
  /** Warms the model in the background (idle callback). */
  prewarm: () => Promise<boolean>;
  /** Call this on every chat send to reset the idle-unload timer. */
  touch: () => void;
}

export function useOfflineModelLifecycle(options: ModelLifecycleOptions = {}): ModelLifecycle {
  const {
    provider = null,
    idleUnloadMs = 5 * 60 * 1000,
    prewarm: prewarmOnMount = false,
    unloadOnHidden = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const providerRef = useRef(provider);
  providerRef.current = provider;
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const armIdleTimer = useCallback(() => {
    clearIdleTimer();
    if (idleUnloadMs <= 0) return;
    idleTimerRef.current = setTimeout(() => {
      const p = providerRef.current;
      if (p?.unloadModel && loadedRef.current) {
        void p.unloadModel().catch(() => undefined);
        setLoaded(false);
      }
    }, idleUnloadMs);
  }, [idleUnloadMs]);

  // Track loaded state for the idle timer closure.
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;

  const loadOnDemand = useCallback(async (): Promise<boolean> => {
    const p = providerRef.current;
    if (!p) return false;
    if (loadedRef.current) {
      armIdleTimer();
      return true;
    }
    setLoading(true);
    try {
      const ok = await (p.loadModel?.() ?? Promise.resolve(false));
      setLoaded(ok);
      armIdleTimer();
      return ok;
    } finally {
      setLoading(false);
    }
  }, [armIdleTimer]);

  const unload = useCallback(async (): Promise<void> => {
    clearIdleTimer();
    const p = providerRef.current;
    if (p?.unloadModel) {
      try {
        await p.unloadModel();
      } catch {
        // ignore — already unloaded
      }
    }
    setLoaded(false);
  }, []);

  const prewarm = useCallback(async (): Promise<boolean> => {
    const p = providerRef.current;
    if (!p || loadedRef.current) return loadedRef.current;
    // Defer to the browser idle time so it never fights first paint.
    const run = () => loadOnDemand();
    if (typeof requestIdleCallback === "function") {
      return new Promise<boolean>((resolve) => {
        requestIdleCallback(() => void run().then(resolve));
      });
    }
    return run();
  }, [loadOnDemand]);

  const touch = useCallback(() => {
    armIdleTimer();
  }, [armIdleTimer]);

  // Phase 10 · memory management: unload the model when the tab is hidden.
  useEffect(() => {
    if (!unloadOnHidden || typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void unload();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [unloadOnHidden, unload]);

  // Optional background prewarm after first mount.
  useEffect(() => {
    if (prewarmOnMount) void prewarm();
    return clearIdleTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prewarmOnMount]);

  return { loading, loaded, loadOnDemand, unload, prewarm, touch };
}

export default useOfflineModelLifecycle;
