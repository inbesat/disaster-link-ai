"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ---------------------------------------------------------------------
// components/providers/ReducedMotionContext.tsx — Phase 17 · Step 6.
//
// Respects prefers-reduced-motion AND provides a manual toggle.
//
// Priority:
//   1. Manual toggle in settings (localStorage "drip:reduced-motion")
//   2. System preference (prefers-reduced-motion: reduce)
//
// When reduced motion is active:
//   • CSS class "reduced-motion" added to <html>
//   • All Framer Motion animations are disabled (via useReducedMotion)
//   • CSS keyframe animations are disabled (globals.css override)
//   • Only essential transitions kept (100ms fade)
// ---------------------------------------------------------------------

type ReducedMotionContextValue = {
  /** Whether reduced motion is active (manual override or system preference) */
  reducedMotion: boolean;
  /** Whether the user has manually set a preference (vs. system default) */
  hasManualPreference: boolean;
  /** Toggle reduced motion manually */
  toggleReducedMotion: () => void;
  /** Set reduced motion explicitly */
  setReducedMotion: (value: boolean) => void;
};

const ReducedMotionContext = createContext<ReducedMotionContextValue | null>(null);

const STORAGE_KEY = "drip:reduced-motion";

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const [systemPreference, setSystemPreference] = useState(false);
  const [manualPreference, setManualPreference] = useState<boolean | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setManualPreference(stored === "true");
      }
    } catch {
      // SSR or storage error
    }
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystemPreference(mq.matches);

    const handler = (e: MediaQueryListEvent) => setSystemPreference(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Determine final state: manual preference wins over system
  const reducedMotion = manualPreference !== null ? manualPreference : systemPreference;
  const hasManualPreference = manualPreference !== null;

  // Persist manual changes
  useEffect(() => {
    if (manualPreference !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, String(manualPreference));
      } catch {
        // ignore
      }
    }
  }, [manualPreference]);

  // Apply/remove CSS class on <html>
  useEffect(() => {
    const html = document.documentElement;
    if (reducedMotion) {
      html.classList.add("reduced-motion");
    } else {
      html.classList.remove("reduced-motion");
    }
  }, [reducedMotion]);

  const toggleReducedMotion = () => {
    setManualPreference((prev) => (prev !== null ? !prev : !systemPreference));
  };

  const setReducedMotion = (value: boolean) => {
    setManualPreference(value);
  };

  return (
    <ReducedMotionContext.Provider
      value={{ reducedMotion, hasManualPreference, toggleReducedMotion, setReducedMotion }}
    >
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion(): ReducedMotionContextValue {
  const ctx = useContext(ReducedMotionContext);
  if (!ctx) {
    // Graceful fallback: check system preference
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      return {
        reducedMotion: mq.matches,
        hasManualPreference: false,
        toggleReducedMotion: () => {},
        setReducedMotion: () => {},
      };
    }
    return {
      reducedMotion: false,
      hasManualPreference: false,
      toggleReducedMotion: () => {},
      setReducedMotion: () => {},
    };
  }
  return ctx;
}

export default ReducedMotionContext;
