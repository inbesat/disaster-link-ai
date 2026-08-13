"use client";

// ---------------------------------------------------------------------
// hooks/useWakeLock.ts — Phase 11 · screen wake lock during emergency
// navigation (navigator.wakeLock, Chromium + Safari 16.4+).
//
//   const { supported, active, request, release } = useWakeLock();
//   useEffect(() => {
//     void request();
//     return () => void release();
//   }, [request, release]);
//
// The browser auto-releases the lock the moment the tab is hidden, so the
// hook re-acquires it on `visibilitychange` → visible while the consumer
// still wants the screen on. SSR-safe: `supported` is false on the server.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isWakeLockSupported,
  releaseScreenWakeLock,
  requestScreenWakeLock,
  type WakeLockSentinelLike,
} from "@/lib/pwa/wake-lock";

export interface UseWakeLockResult {
  /** True when the browser exposes the Screen Wake Lock API. */
  supported: boolean;
  /** True while a wake lock is currently held. */
  active: boolean;
  /** Acquire the lock (safe to call repeatedly). */
  request: () => Promise<boolean>;
  /** Release the lock. */
  release: () => Promise<void>;
}

export function useWakeLock(): UseWakeLockResult {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const wantedRef = useRef(false);

  useEffect(() => {
    setSupported(isWakeLockSupported());
  }, []);

  const release = useCallback(async (): Promise<void> => {
    wantedRef.current = false;
    await releaseScreenWakeLock(sentinelRef.current);
    sentinelRef.current = null;
    setActive(false);
  }, []);

  const request = useCallback(async (): Promise<boolean> => {
    wantedRef.current = true;
    const sentinel = await requestScreenWakeLock();
    if (sentinel) {
      sentinelRef.current = sentinel;
      setActive(true);
      return true;
    }
    setActive(false);
    return false;
  }, []);

  // Re-acquire when the user switches back to the tab (auto-release on hide).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState === "visible" && wantedRef.current) {
        void request();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [request]);

  // Clean up any held lock on unmount.
  useEffect(() => {
    return () => {
      wantedRef.current = false;
      void releaseScreenWakeLock(sentinelRef.current);
    };
  }, []);

  return { supported, active, request, release };
}

export default useWakeLock;