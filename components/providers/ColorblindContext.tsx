"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ---------------------------------------------------------------------
// components/providers/ColorblindContext.tsx — Phase 17 · Step 3.
//
// Provides a colorblind-friendly mode toggle that:
//   • Replaces red/green severity with blue/orange patterns
//   • Adds shape indicators (checkmark, triangle, X) alongside colors
//   • Ensures no information is conveyed by color alone
//
// Persists to localStorage under "drip:colorblind-mode".
// ---------------------------------------------------------------------

type ColorblindContextValue = {
  colorblindMode: boolean;
  toggleColorblindMode: () => void;
};

const ColorblindContext = createContext<ColorblindContextValue | null>(null);

const STORAGE_KEY = "drip:colorblind-mode";

export function ColorblindProvider({ children }: { children: ReactNode }) {
  const [colorblindMode, setColorblindMode] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setColorblindMode(true);
    } catch {
      // SSR or storage error — stay false
    }
  }, []);

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(colorblindMode));
    } catch {
      // ignore
    }
  }, [colorblindMode]);

  const toggleColorblindMode = () => setColorblindMode((prev) => !prev);

  return (
    <ColorblindContext.Provider value={{ colorblindMode, toggleColorblindMode }}>
      {children}
    </ColorblindContext.Provider>
  );
}

export function useColorblindMode(): ColorblindContextValue {
  const ctx = useContext(ColorblindContext);
  if (!ctx) {
    // Graceful fallback when used outside provider (SSR, tests)
    return { colorblindMode: false, toggleColorblindMode: () => {} };
  }
  return ctx;
}

export default ColorblindContext;
