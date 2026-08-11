"use client";

// ---------------------------------------------------------------------
// lib/contexts/HighContrastContext.tsx — Phase 13 · Step 10 · Strict
// Accessibility · High Contrast Mode.
//
// Flips the whole app (citizen, gov, landing — every surface) into a
// WCAG-friendly high-contrast theme by toggling a `high-contrast` class
// on <html>. globals.css' `.high-contrast` rules then:
//
//   • override --bg-primary (and the legacy --dl-* navy tokens the
//     citizen app actually consumes) to PURE #000000,
//   • override --text-primary / --text-on-navy to PURE #FFFFFF,
//   • strip decorative gradients (ambient glows, gradient card fills) and
//     raise subtle borders to a clearly visible white,
//
// so text stays maximally legible for visually impaired users. The
// choice persists to localStorage and re-applies on the next visit,
// mirroring BandwidthContext's pattern. The class is applied to
// documentElement so the rule set can be written once in CSS.
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

const STORAGE_KEY = "drip:high-contrast";
const ROOT_CLASS = "high-contrast";

type HighContrastContextValue = {
  /** When true, the app renders in pure black-on-white high contrast. */
  isHighContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
};

const HighContrastContext = createContext<HighContrastContextValue | null>(null);

export function HighContrastProvider({ children }: { children: ReactNode }) {
  // Defaults to OFF on the server (SSR HTML matches → no hydration
  // mismatch); the stored preference is applied right after mount.
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "true") {
        setIsHighContrast(true);
      }
    } catch {
      // localStorage unavailable (private mode) — stay in normal mode.
    }
  }, []);

  // Keep the CSS class on <html> in lockstep with the state.
  useEffect(() => {
    document.documentElement.classList.toggle(ROOT_CLASS, isHighContrast);
    return () => document.documentElement.classList.remove(ROOT_CLASS);
  }, [isHighContrast]);

  const setHighContrast = useCallback((enabled: boolean) => {
    setIsHighContrast(enabled);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
      // Non-fatal: the in-memory flag still applies for this session.
    }
  }, []);

  const value = useMemo(
    () => ({ isHighContrast, setHighContrast }),
    [isHighContrast, setHighContrast],
  );

  return (
    <HighContrastContext.Provider value={value}>
      {children}
    </HighContrastContext.Provider>
  );
}

/** Access the high-contrast flag and its setter. */
export function useHighContrast(): HighContrastContextValue {
  const ctx = useContext(HighContrastContext);
  if (!ctx) {
    throw new Error("useHighContrast must be used within a <HighContrastProvider>");
  }
  return ctx;
}
