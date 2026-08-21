"use client";

import { useColorblindMode } from "@/components/providers/ColorblindContext";
import Toggle from "@/components/settings/Toggle";

// ---------------------------------------------------------------------
// components/settings/ColorblindToggle.tsx — Phase 17 · Step 3.
//
// Colorblind mode toggle for settings page.
// When enabled:
//   • Replaces red/green severity with blue/orange palette
//   • Adds pattern backgrounds (circles for safe, stripes for danger)
//   • Shows shape indicators (checkmark, triangle, X) alongside colors
//   • Ensures no information is conveyed by color alone
// ---------------------------------------------------------------------

export function ColorblindToggle() {
  const { colorblindMode, toggleColorblindMode } = useColorblindMode();

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-200">Colorblind Friendly Mode</p>
        <p className="text-[11px] text-slate-500">
          Replaces red/green with blue/orange palette and adds shape indicators for status badges.
          Tested with deuteranopia and protanopia simulators.
        </p>
      </div>
      <Toggle
        checked={colorblindMode}
        onChange={toggleColorblindMode}
        label="Colorblind Friendly Mode"
      />
    </div>
  );
}

export default ColorblindToggle;
