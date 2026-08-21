"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

// ---------------------------------------------------------------------
// components/ui/LiveRegion.tsx — Phase 17 · Step 5.
//
// Screen reader live regions for dynamic announcements:
//   • "polite" for non-critical updates (status changes, confirmations)
//   • "assertive" for critical alerts (emergency warnings, errors)
//
// Usage:
//   const { announce } = useLiveRegion();
//   announce("Alert sent to Patna district", "polite");
//   announce("Critical flood warning issued", "assertive");
// ---------------------------------------------------------------------

type LiveRegionContextValue = {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: "polite" | "assertive") => void;
};

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const politeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assertiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    // Clear existing timeouts
    if (politeTimeoutRef.current) clearTimeout(politeTimeoutRef.current);
    if (assertiveTimeoutRef.current) clearTimeout(assertiveTimeoutRef.current);

    if (priority === "assertive") {
      // Clear polite first, then set assertive
      setPoliteMessage("");
      setAssertiveMessage("");
      // Force a re-render by using a small delay
      requestAnimationFrame(() => {
        setAssertiveMessage(message);
      });
      assertiveTimeoutRef.current = setTimeout(() => setAssertiveMessage(""), 10000);
    } else {
      setPoliteMessage("");
      requestAnimationFrame(() => {
        setPoliteMessage(message);
      });
      politeTimeoutRef.current = setTimeout(() => setPoliteMessage(""), 5000);
    }
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements — screen readers queue these */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive announcements — screen readers interrupt current speech */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}

export function useLiveRegion(): LiveRegionContextValue {
  const ctx = useContext(LiveRegionContext);
  if (!ctx) {
    // Graceful fallback for SSR or tests
    return { announce: () => {} };
  }
  return ctx;
}

export default LiveRegionProvider;
