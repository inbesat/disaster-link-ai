"use client";

// ---------------------------------------------------------------------
// components/ui/OfflineBanner.tsx
// UI/UX Phase 9 · Step 9 — connectivity banner.
//
// Drops a prominent amber strip down from the absolute top of the screen
// whenever the browser goes offline, so a flood-disrupted responder never
// mistakes stale data for live data. Built on the useOnlineStatus hook.
//
//   • Amber surface  — severity-warning tint (deep amber in dark mode,
//                      soft pastel in day-ops) + accent-warning border
//   • Copy           — "Offline Mode — Data may be stale." (Lucide WifiOff
//                      icon instead of the ⚠️ emoji from the spec, per the
//                      design-system no-emoji rule)
//   • Last synced    — mock relative timestamp, computed once on mount
//   • Retry          — ghost button that re-probes connectivity and
//                      reports the outcome with the roadmap toast card
//
// Mounted once at the app shell level (root or dashboard layout); the
// banner positions itself fixed at the viewport top, above the sidebar
// and top bar (z-70, same tier as the BiometricPrompt overlay).
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { RefreshCw, WifiOff } from "lucide-react";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import useToast from "@/hooks/useToast";

/** "Last synced" mock base — 2 minutes in the past, stable for the
 * component's lifetime so the label doesn't drift while it's visible. */
const MOCK_SYNCED_MINUTES_AGO = 2;

function formatLastSynced(timestamp: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes <= 0) return "just now";
  return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
}

export function OfflineBanner({ className = "" }: { className?: string }) {
  const online = useOnlineStatus();
  const toast = useToast();
  const [checking, setChecking] = useState(false);

  // Stable mock timestamp — initialized once, never re-computed on renders.
  const [syncedAt] = useState(() => Date.now() - MOCK_SYNCED_MINUTES_AGO * 60 * 1000);

  // Pending retry probe — cleared on unmount so a late timeout can't fire
  // setState (or a toast) after the component is gone.
  const retryTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
    };
  }, []);

  const retry = () => {
    if (checking) return;
    setChecking(true);
    // Simulated connectivity probe — navigator.onLine is re-read after a
    // beat; if the network came back, the hook's 'online' listener will
    // hide the banner on its own.
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      setChecking(false);
      if (typeof navigator !== "undefined" && navigator.onLine) {
        toast.success({
          title: "Connection restored",
          description: "Live data is flowing again.",
        });
      } else {
        toast.warning({
          title: "Still offline",
          description: "Retrying later — data may be stale.",
        });
      }
    }, 1200);
  };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {!online && (
          <motion.div
            key="offline-banner"
            role="status"
            aria-live="polite"
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={`fixed inset-x-0 top-0 z-[70] ${className}`}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-accent-warning/40 bg-severity-warning px-4 py-2.5 text-center shadow-card">
              <span className="flex items-center gap-2">
                <WifiOff className="h-5 w-5 shrink-0 text-accent-warning" aria-hidden />
                <span className="text-sm font-bold text-primary">
                  Offline Mode — Data may be stale.
                </span>
              </span>

              <span className="text-xs font-medium text-primary opacity-75">
                Last synced: {formatLastSynced(syncedAt)}
              </span>

              {/* Ghost retry — border + transparent surface, brightens on hover */}
              <button
                type="button"
                onClick={retry}
                disabled={checking}
                className="flex items-center gap-1.5 rounded-md border border-accent-warning/60 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-white/10 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`}
                  aria-hidden
                />
                {checking ? "Checking…" : "Retry Connection"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

export default OfflineBanner;
