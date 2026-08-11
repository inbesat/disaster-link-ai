"use client";

// ---------------------------------------------------------------------
// components/demo/ScenarioSelector.tsx — Phase 2 · Step 5 · Live scenario
// switcher (demo mode only).
//
// A tiny dropdown pinned to the top-right of the screen while `demo_mode`
// is active (gated in app/layout.tsx by the server cookie). Judges pick a
// scenario and the whole system escalates in one tap:
//
//   • "🌤 Normal Day" → "🌊 Flood Watch" → "🚨 Evacuation Order" → "⚫
//     Critical Emergency".
//
// On selection the component shows a full-screen 1-second "Simulating
// scenario…" overlay, then:
//   1. seeds the scenario (activateDemoScenario → lib/demo/seeder.ts),
//   2. fires the global `demo:scenario-change` event so every subscribed
//      map/dashboard re-renders against the fresh dataset instantly,
//   3. haptics + a success toast so the presenter gets physical + visual
//      confirmation the judge's screen just changed.
// ---------------------------------------------------------------------

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, Radio } from "lucide-react";
import { triggerHeavyHaptic } from "@/hooks/useHaptics";
import {
  activateDemoScenario,
  DEMO_SCENARIOS,
  type DemoScenarioKey,
} from "@/lib/demo/seeder";
import { showToast } from "@/components/ui/Toast";
import { trackAnalytics } from "@/lib/demo/analytics";

/** How long the "Simulating scenario…" overlay stays up. */
export const SIMULATE_DELAY_MS = 1000;

export default function ScenarioSelector() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<DemoScenarioKey>("normal_day");
  const [simulating, setSimulating] = useState(false);

  async function handleSelect(scenario: DemoScenarioKey) {
    setOpen(false);
    setSimulating(true);
    // Pause so the judge reads "Simulating scenario…" before the refresh.
    await new Promise((resolve) => setTimeout(resolve, SIMULATE_DELAY_MS));

    const { scenario: key } = activateDemoScenario(scenario);
    setActive(key);
    setSimulating(false);

    triggerHeavyHaptic();
    // Step 9 — log the scenario switch for the insights tracker.
    trackAnalytics(`scenario.change.${key}`);
    showToast("success", {
      id: "demo-scenario-simulated",
      title: `✅ Scenario: ${
        DEMO_SCENARIOS.find((s) => s.key === key)?.label ?? key
      }`,
      description: "Live data, shelters, responders and alerts refreshed.",
    });
  }

  const activeLabel = DEMO_SCENARIOS.find((s) => s.key === active)?.label ?? active;

  return (
    <>
      {/* Top-right dropdown */}
      <div className="fixed right-3 top-[48px] z-[90]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full border border-amber-500/50 bg-amber-600/90 px-3.5 py-2 text-xs font-bold text-black shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:bg-amber-500 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          <Radio aria-hidden="true" className="h-4 w-4" />
          <span className="hidden sm:inline">Live scenario:</span> {activeLabel}
          <ChevronDown
            aria-hidden="true"
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              role="listbox"
              aria-label="Demo scenario"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0d1526]/95 p-1 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            >
              {DEMO_SCENARIOS.map(({ key, label }) => {
                const selected = key === active;
                return (
                  <li key={key} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => void handleSelect(key)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                        selected
                          ? "bg-amber-500/20 text-amber-300"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      {label}
                      {selected && <span aria-hidden="true">✓</span>}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Full-screen "Simulating scenario…" overlay */}
      <AnimatePresence>
        {simulating && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400/60">
              <Loader2 aria-hidden="true" className="h-8 w-8 animate-spin text-amber-300" />
            </span>
            <p className="text-lg font-bold tracking-wide text-white">
              Simulating scenario…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}