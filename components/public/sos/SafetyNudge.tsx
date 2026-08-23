"use client";

// ---------------------------------------------------------------------
// components/public/sos/SafetyNudge.tsx — Phase 5 · Step 8 · Family
// Check-In System.
//
// Simulates the system periodically asking the citizen if they are okay
// during an active storm — a push-notification-style card that slides in
// from the top: "Area Flood Level is Rising. Are you still safe?" with
// two massive buttons:
//
//   • "I am Safe"    → persists the safe status (same helper as the
//                      alerts-page toggle) + confirmation toast
//   • "I Need Help"  → closes the nudge and IMMEDIATELY opens the global
//                      SOSModal (Phase 5 · Step 1) so the citizen lands
//                      on the emergency grid
//
// It appears two ways: on a mock periodic cadence (first check-in ~18s
// after mount, then every 90s, capped) and via the
// drip:citizen-safety-nudge window event (the Dev Tools trigger added to
// AlertDemoTrigger, so judges can fire it from any page). It never
// interrupts an active Emergency Mode or an already-open SOS modal.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, ShieldCheck, Siren } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import {
  CITIZEN_SAFETY_NUDGE_EVENT,
  writeSafeStatus,
} from "@/lib/mock-data/public-alerts";
import { useSOS } from "./SOSContext";

/** First check-in after mount, then every REPEAT_MS, capped at MAX. */
const FIRST_NUDGE_MS = 18_000;
const REPEAT_MS = 90_000;
const MAX_NUDGES = 5;

export default function SafetyNudge() {
  const { emergency, isOpen: sosOpen, open: openSos } = useSOS();
  const [visible, setVisible] = useState(false);

  // Refs mirror the reactive values so the timer chain + event listener
  // (both mounted once) always read the current state.
  const emergencyRef = useRef(emergency);
  emergencyRef.current = emergency;
  const sosOpenRef = useRef(sosOpen);
  sosOpenRef.current = sosOpen;

  /** Show the check-in card (no-op when it would interrupt an SOS flow). */
  const showNudge = () => {
    if (emergencyRef.current || sosOpenRef.current) return;
    setVisible(true);
  };

  // Periodic mock cadence — self-scheduling chain, torn down on unmount.
  // NOTE: the MAX_NUDGES cap is a permanent stop (no re-arm without a full
  // remount) — deliberate for the demo so the nudge can't nag forever.
  useEffect(() => {
    let timer: number | null = null;
    let count = 0;
    const tick = () => {
      count += 1;
      if (count > MAX_NUDGES) return;
      if (document.hidden) {
        // Wait for the tab to be visible before pinging the citizen.
        timer = window.setTimeout(tick, REPEAT_MS);
        return;
      }
      showNudge();
      timer = window.setTimeout(tick, REPEAT_MS);
    };
    timer = window.setTimeout(tick, FIRST_NUDGE_MS);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dev Tools / event-driven trigger (same window-event pattern as the
  // critical overlay).
  useEffect(() => {
    const onNudge = () => showNudge();
    window.addEventListener(CITIZEN_SAFETY_NUDGE_EVENT, onNudge);
    return () => window.removeEventListener(CITIZEN_SAFETY_NUDGE_EVENT, onNudge);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markSafe = () => {
    setVisible(false);
    writeSafeStatus();
    triggerLightHaptic();
    showToast("success", {
      title: "Marked Safe",
      description: "Thanks — your family has been updated.",
    });
  };

  const needHelp = () => {
    setVisible(false);
    triggerLightHaptic();
    openSos(); // Straight into the Phase 5 · Step 1 emergency grid.
  };

  return (
    <AnimatePresence>
      {/* Push notifications are NOT modals — they never steal focus or
          trap the user. So this is a live-region card, not role=dialog:
          screen readers announce it, but the app stays usable behind it. */}
      {visible && !emergency && !sosOpen && (
        <motion.div
          role="region"
          aria-label="Safety check-in"
          aria-live="polite"
          initial={{ y: -96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -96, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.9 }}
          className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+8px)] z-[70] px-4"
        >
          <div className="mx-auto w-full max-w-md rounded-2xl border border-severity-amber-500/40 bg-[#0a1120]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full bg-severity-amber-500/40 motion-reduce:animate-none"
                />
                <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-severity-amber-500/15 ring-1 ring-severity-amber-500/50">
                  <BellRing
                    aria-hidden="true"
                    className="h-4 w-4 text-severity-amber-300"
                  />
                </span>
              </span>
              <div>
                <p className="eoc-label text-[var(--dl-text-muted)]">
                  SAFETY CHECK-IN
                </p>
                <p className="text-xs font-semibold text-[var(--dl-text-muted)]">
                  Automated check from your district
                </p>
              </div>
            </div>

            {/* Question */}
            <p className="mt-3 text-lg font-bold leading-snug text-white">
              Area Flood Level is Rising. Are you still safe?
            </p>

            {/* Massive actions */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={markSafe}
                className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-severity-green-500 text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)] transition hover:bg-severity-green-400 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-green-400"
              >
                <ShieldCheck aria-hidden="true" className="h-6 w-6" strokeWidth={2.25} />
                <span className="text-sm font-black">I am Safe</span>
              </button>
              <button
                type="button"
                onClick={needHelp}
                className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-severity-red-600 text-white shadow-[0_6px_18px_rgba(239,68,68,0.4)] transition hover:bg-severity-red-500 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-red-400"
              >
                <Siren aria-hidden="true" className="h-6 w-6" strokeWidth={2.25} />
                <span className="text-sm font-black">I Need Help</span>
              </button>
            </div>

            {/* Dismiss for now */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="text-xs font-semibold text-[var(--dl-text-muted)] transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-amber-400"
              >
                Ask me again later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
