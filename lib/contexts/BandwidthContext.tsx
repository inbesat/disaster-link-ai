"use client";

// ---------------------------------------------------------------------
// lib/contexts/BandwidthContext.tsx — Phase 13 · Step 2 · Extreme
// Low-Bandwidth Mode.
//
// A global flag that switches the Citizen App into a data-saver mode for
// 2G / storm conditions: everything heavy (the MapLibre map, large images,
// the AI assistant) is replaced with plain-text lists, keeping each screen
// under ~50KB of data. The choice persists to localStorage so it survives
// reloads and applies immediately on the next visit.
// ---------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "drip:low-bandwidth";

type BandwidthContextValue = {
  /** When true, pages render text-only data-saver views. */
  isLowBandwidthMode: boolean;
  setLowBandwidthMode: (enabled: boolean) => void;
};

const BandwidthContext = createContext<BandwidthContextValue | null>(null);

export function BandwidthProvider({ children }: { children: ReactNode }) {
  // Defaults to OFF on the server (SSR HTML matches → no hydration
  // mismatch); the stored preference is applied right after mount.
  const [isLowBandwidthMode, setIsLowBandwidthMode] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "true") {
        setIsLowBandwidthMode(true);
      }
    } catch {
      // localStorage unavailable (private mode) — stay in normal mode.
    }
  }, []);

  const setLowBandwidthMode = useCallback((enabled: boolean) => {
    setIsLowBandwidthMode(enabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Non-fatal: the in-memory flag still applies for this session.
    }
  }, []);

  const value = useMemo(
    () => ({ isLowBandwidthMode, setLowBandwidthMode }),
    [isLowBandwidthMode, setLowBandwidthMode],
  );

  return <BandwidthContext.Provider value={value}>{children}</BandwidthContext.Provider>;
}

/** Access the low-bandwidth flag and its setter. */
export function useBandwidth(): BandwidthContextValue {
  const ctx = useContext(BandwidthContext);
  if (!ctx) {
    throw new Error("useBandwidth must be used within a <BandwidthProvider>");
  }
  return ctx;
}
