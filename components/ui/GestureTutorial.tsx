"use client";

// ---------------------------------------------------------------------
// components/ui/GestureTutorial.tsx
// UI/UX Phase 3 · Step 10 — first-time gesture tutorial.
//
// Shows once, only to users who haven't dismissed it:
//   • localStorage key `has_seen_tutorial` must be unset/false → the
//     full-screen dark overlay appears. If "true" the component renders
//     nothing.
//   • An animated hand (framer-motion, left ⇄ right loop) floats over the
//     bottom-nav area announcing "Swipe to cycle tabs", with a secondary
//     nudge for pull-to-refresh.
//   • "Got it!" writes the flag (persisting across sessions) and dismisses
//     the overlay.
//
// Mount once at the app root (e.g. next to the dashboard layout) so the
// whole product teaches the gesture in one place.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Hand, ShieldCheck } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";

const TUTORIAL_KEY = "has_seen_tutorial";

export function GestureTutorial() {
  const [visible, setVisible] = useState(false);

  // Lazy on-mount gate (SSR-safe — the SSR shell renders null, so there's
  // no hydration mismatch, and only clients ever see the overlay).
  useEffect(() => {
    let seen = true;
    try {
      seen = window.localStorage.getItem(TUTORIAL_KEY) === "true";
    } catch {
      // storage unavailable — teach anyway
    }
    if (!seen) setVisible(true);
  }, []);

  const acknowledge = () => {
    try {
      window.localStorage.setItem(TUTORIAL_KEY, "true");
    } catch {
      // non-persistent session — overlay just disappears
    }
    triggerLightHaptic();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gesture tutorial"
      className="fixed inset-0 z-[60] flex flex-col bg-black/70 backdrop-blur-sm"
    >
      {/* Animated hand floating over the bottom-nav area. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-24 flex flex-col items-center gap-3">
        <motion.div
          animate={{ x: [-18, 18, -18] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-[0_0_20px_rgba(59,130,246,0.35)]"
        >
          <Hand className="h-8 w-8 text-white" strokeWidth={1.5} aria-hidden />
        </motion.div>

        <p className="rounded-full border border-white/10 bg-[#0f172a]/90 px-4 py-2 text-sm font-bold text-white">
          Swipe to cycle tabs
        </p>
      </div>

      {/* Secondary pull-to-refresh nudge. */}
      <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center">
        <p className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0f172a]/90 px-4 py-2 text-xs font-semibold text-slate-200">
          <ShieldCheck className="h-4 w-4 text-cyan-300" aria-hidden />
          Pull down on any list to refresh
        </p>
      </div>

      {/* Dismissal. */}
      <div className="flex flex-1 items-end justify-center p-6 pb-[calc(104px+env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={acknowledge}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

export default GestureTutorial;
