"use client";

// ---------------------------------------------------------------------
// components/public/map/OfflineMapBadge.tsx — Phase 4 · Step 10 · Offline
// Map Cache Badge.
//
// Citizens need to know the map still works without cell service. When
// the network drops (useOfflineStatus — the same hydration-safe hook the
// alerts page uses), this badge appears at the top-left of the map:
// "📶 Offline Map Active", styled in the app's amber offline language.
//
// Tapping (or hovering/focusing on desktop) pops a small info tooltip:
// "Pre-downloaded tiles for your district are currently in use."
//
// It renders client-side only — the hook starts "online" on the server
// and first client paint, so the badge can never flash during hydration.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export default function OfflineMapBadge() {
  const offline = useOfflineStatus();
  const reduceMotion = useReducedMotion();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  // Hover affordance only where a pointing device exists (hover: hover);
  // touch users toggle via tap instead.
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    setSupportsHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  if (!offline) return null;

  return (
    <div className="absolute left-4 top-[calc(84px+env(safe-area-inset-top))] z-20">
      <button
        type="button"
        onClick={() => setTooltipOpen((v) => !v)}
        onMouseEnter={() => supportsHover && setTooltipOpen(true)}
        onMouseLeave={() => setTooltipOpen(false)}
        onFocus={() => setTooltipOpen(true)}
        onBlur={() => setTooltipOpen(false)}
        aria-expanded={tooltipOpen}
        aria-describedby="offline-map-badge-tip"
        aria-live="polite"
        className="flex items-center gap-1.5 rounded-full border border-severity-amber-500/40 bg-severity-amber-500/15 px-3 py-1.5 text-xs font-bold text-severity-amber-300 shadow-[0_2px_10px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:bg-severity-amber-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-amber-400"
      >
        <span aria-hidden="true">📶</span>
        Offline Map Active
      </button>

      {/* Small info tooltip */}
      <AnimatePresence>
        {tooltipOpen && (
          <motion.div
            id="offline-map-badge-tip"
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-[#0b1120]/95 p-3 text-left shadow-[0_8px_28px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {/* Pointing caret */}
            <span
              aria-hidden="true"
              className="absolute -top-1 left-5 h-2 w-2 rotate-45 border-l border-t border-white/10 bg-[#0b1120]"
            />
            <p className="flex items-start gap-2 text-xs leading-relaxed text-white/85">
              <Info
                aria-hidden="true"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-severity-amber-300"
              />
              Pre-downloaded tiles for your district are currently in use.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
