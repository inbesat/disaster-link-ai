"use client";

// ---------------------------------------------------------------------
// components/public/AlertDemoTrigger.tsx — Phase 3 · Step 10 · Demo
// Simulator (judge trigger).
//
// A small semi-transparent \"Dev Tools\" button fixed to the bottom-left
// of every public page (mounted in app/public/layout.tsx). It opens a
// tiny modal with the two judge triggers:
//
//   • \"Simulate Official Alert\" — dispatches drip:citizen-demo-alert
//     with a fresh official alert; the alerts page appends it to the feed.
//   • \"Simulate CRITICAL Overlay\" — dispatches drip:citizen-critical-alert;
//     the layout-level PublicAlertHost opens the CriticalAlertOverlay.
//
// The window-event architecture (same as useDemoSimulation's
// drip:demo-sim:* events) means the triggers work from ANY public page,
// not just the alerts feed.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { FlaskConical, Siren, Sparkles, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { showToast } from "@/components/ui/Toast";
import {
  CITIZEN_CRITICAL_ALERT_EVENT,
  CITIZEN_DEMO_ALERT_EVENT,
  createSimulatedOfficialAlert,
} from "@/lib/mock-data/public-alerts";

export function AlertDemoTrigger() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus into the panel on open; restore to the launcher on close (the
  // same save/restore convention as FamilyStrip and the other dialogs).
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  const simulateAlert = () => {
    window.dispatchEvent(
      new CustomEvent(CITIZEN_DEMO_ALERT_EVENT, {
        detail: createSimulatedOfficialAlert(),
      }),
    );
    setOpen(false);
    showToast("info", {
      title: "Simulated official alert",
      description: "A fresh IMD warning was added to the alerts feed.",
    });
  };

  const simulateCritical = () => {
    window.dispatchEvent(new CustomEvent(CITIZEN_CRITICAL_ALERT_EVENT));
    setOpen(false);
    showToast("warning", {
      title: "Critical overlay triggered",
      description: "The full-screen evacuation takeover is now showing.",
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* Dev Tools launcher — semi-transparent, bottom-left */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open demo tools"
        className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-4 z-50 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/70 backdrop-blur transition hover:border-[var(--dl-orange)]/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
      >
        <FlaskConical aria-hidden="true" className="h-3.5 w-3.5" />
        Dev Tools
      </button>

      {/* Tiny trigger modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Demo tools"
              tabIndex={-1}
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--dl-navy-2)] p-5 shadow-[var(--dl-shadow-soft)] outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eoc-label text-[var(--dl-text-muted)]">
                    DEMO SIMULATOR
                  </p>
                  <h2 className="text-base font-bold text-white">
                    Judge triggers
                  </h2>
                </div>
                <IconButton
                  label="Close demo tools"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>

              <div className="mt-4 space-y-2.5">
                <button
                  type="button"
                  onClick={simulateAlert}
                  className="flex w-full items-center gap-2.5 rounded-[var(--dl-radius-sm)] border border-sky-500/40 bg-sky-500/15 px-4 py-3 text-sm font-bold text-sky-300 transition hover:bg-sky-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  Simulate Official Alert
                </button>
                <button
                  type="button"
                  onClick={simulateCritical}
                  className="flex w-full items-center gap-2.5 rounded-[var(--dl-radius-sm)] border border-severity-red-500/40 bg-severity-red-500/15 px-4 py-3 text-sm font-bold text-severity-red-300 transition hover:bg-severity-red-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-red-400"
                >
                  <Siren aria-hidden="true" className="h-4 w-4" />
                  Simulate CRITICAL Overlay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

export default AlertDemoTrigger;
