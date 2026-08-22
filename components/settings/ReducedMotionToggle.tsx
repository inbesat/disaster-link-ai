"use client";

import { useReducedMotion } from "@/components/providers/ReducedMotionContext";
import Toggle from "@/components/settings/Toggle";

// ---------------------------------------------------------------------
// components/settings/ReducedMotionToggle.tsx — Phase 17 · Step 6.
//
// Reduced motion toggle for settings page.
// When enabled:
//   • Disables all entrance animations (instant appearance)
//   • Disables pulsing effects (static dots)
//   • Disables parallax and scroll-triggered animations
//   • Keeps only essential transitions (fade 100ms)
//   • Disables auto-playing videos/animations
// ---------------------------------------------------------------------

export function ReducedMotionToggle() {
  const { reducedMotion, hasManualPreference, toggleReducedMotion } = useReducedMotion();

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-200">Reduce Motion</p>
        <p className="text-[11px] text-slate-500">
          Disables animations, parallax, and scroll effects. Respects your system preference when not manually set.
          {hasManualPreference && (
            <span className="ml-1 text-purple-400">(manually set)</span>
          )}
        </p>
      </div>
      <Toggle
        checked={reducedMotion}
        onChange={toggleReducedMotion}
        label="Reduce Motion"
      />
    </div>
  );
}

export default ReducedMotionToggle;
