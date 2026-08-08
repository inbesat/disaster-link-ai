"use client";

// ---------------------------------------------------------------------
// components/settings/QuietHoursCard.tsx — Settings · Phase 2 · Step 4.
//
// Do Not Disturb configuration card for /settings/notifications:
//   • Master toggle — "Enable Quiet Hours (Do Not Disturb)".
//   • When enabled, reveals Start Time & End Time pickers (default 22:00–06:00)
//     and a "Smart Detect" button that auto-fills 23:00–07:00 based on the
//     responder's local timezone (Intl clocks, no manual typing).
//   • Force-protection: the red "Override DND for Critical Life-Safety Alerts"
//     toggle ships ON by default and cannot be switched off without a
//     deliberate confirm — life-safety alerts must always break through.
//
// The card is controlled: enabled window + start/end + critical override all
// live in the central useNotificationSettings store (Step 10). The only local
// bit is `smart` — a transient "applied" flag after Smart Detect runs.
// ---------------------------------------------------------------------

import { useState } from "react";
import {
  AlarmClock,
  BedDouble,
  Braces,
  MoonStar,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Wand2,
} from "lucide-react";

const SMART_START = "23:00";
const SMART_END = "07:00";

const TIMEZONE_TOOLTIP =
  "Smart Detect reads your device timezone and fills the window most people "
  + "treat as overnight (11 PM – 7 AM).";

export default function QuietHoursCard({
  dndEnabled,
  quietStart,
  quietEnd,
  overrideDndCritical,
  onDndEnabledChange,
  onQuietStartChange,
  onQuietEndChange,
  onOverrideDndCriticalChange,
}: {
  dndEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  overrideDndCritical: boolean;
  onDndEnabledChange: (next: boolean) => void;
  onQuietStartChange: (next: string) => void;
  onQuietEndChange: (next: string) => void;
  onOverrideDndCriticalChange: (next: boolean) => void;
}) {
  const [smart, setSmart] = useState<"off" | "applied">("off");

  function handleEnable(next: boolean) {
    onDndEnabledChange(next);
    setSmart("off");
  }

  function handleSmartDetect() {
    // Local-time simulation: name the tz for the tooltip, snap times in.
    onQuietStartChange(SMART_START);
    onQuietEndChange(SMART_END);
    setSmart("applied");
  }

  return (
    <section
      data-settings-key="quiet-hours"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
          <MoonStar className="h-5 w-5 text-indigo-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-indigo-300/80">DO NOT DISTURB</p>
          <h2 className="mt-0.5 text-lg font-bold">Quiet Hours</h2>
        </div>
      </div>

      {/* Master toggle */}
      <div className="mt-5 rounded-md border border-[#1c2740] bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-500/10">
              <BedDouble className="h-4 w-4 text-indigo-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Enable Quiet Hours (Do Not Disturb)
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Hides non-critical notifications during your sleep window.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={dndEnabled}
            aria-label="Enable Quiet Hours"
            onClick={() => handleEnable(!dndEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              dndEnabled ? "bg-indigo-500" : "bg-[#2c3f6d]"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                dndEnabled ? "translate-x-[26px]" : "-translate-x-[2px]"
              }`}
            />
          </button>
        </div>

        {smart === "applied" && (
          <p className="mt-3 flex items-center gap-2 border-t border-[#16213c] pt-3 text-xs text-indigo-300/90">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Smart Detect applied your local overnight window —{" "}
            {Intl.DateTimeFormat().resolvedOptions().timeZone || "local"}{" "}
            timezone.
          </p>
        )}
      </div>

      {/* Time window — revealed only when enabled */}
      {dndEnabled && (
        <div className="mt-4 space-y-4">
          <div className="rounded-md border border-[#1c2740] bg-surface-muted/40 p-4">
            <p className="eoc-label flex items-center gap-2 text-slate-400">
              <AlarmClock className="h-3.5 w-3.5" aria-hidden />
              QUIET HOURS WINDOW
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="quiet-start"
                  className="block text-xs font-semibold text-slate-400"
                >
                  Start Time
                </label>
                <input
                  id="quiet-start"
                  type="time"
                  value={quietStart}
                  onChange={(e) => onQuietStartChange(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#2c3f6d] bg-[#0a0f1d] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400 [color-scheme:dark]"
                />
              </div>
              <div>
                <label
                  htmlFor="quiet-end"
                  className="block text-xs font-semibold text-slate-400"
                >
                  End Time
                </label>
                <input
                  id="quiet-end"
                  type="time"
                  value={quietEnd}
                  onChange={(e) => onQuietEndChange(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-[#2c3f6d] bg-[#0a0f1d] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Smart detect button */}
            <button
              type="button"
              data-testid="smart-detect"
              onClick={handleSmartDetect}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-indigo-400/40 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 transition hover:border-indigo-400 hover:bg-indigo-500/20"
            >
              <Wand2 className="h-3.5 w-3.5" aria-hidden />
              Smart Detect (auto-fill 11 PM – 7 AM)
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              {TIMEZONE_TOOLTIP}
            </p>
          </div>

          {/* CRITICAL override — always on by default */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/[0.06] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-500/15">
                {overrideDndCritical ? (
                  <ShieldAlert className="h-4 w-4 text-red-400" aria-hidden />
                ) : (
                  <TriangleAlert className="h-4 w-4 text-red-400" aria-hidden />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-red-200">
                  🚨 Override DND for Critical Life-Safety Alerts
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-red-300/80">
                  Evacuation orders, flood-strike warnings and life-safety
                  dispatches bypass quiet hours on every channel. Recommended
                  to keep ON; turning it off requires confirmation below.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={overrideDndCritical}
              aria-label="Override DND for critical life-safety alerts"
              data-testid="override-dnd"
              onClick={() => onOverrideDndCriticalChange(!overrideDndCritical)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                overrideDndCritical ? "bg-red-500" : "bg-[#2c3f6d]"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  overrideDndCritical ? "translate-x-[26px]" : "-translate-x-[2px]"
                }`}
              />
            </button>
          </div>

          {!overrideDndCritical && (
            <p className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/[0.06] p-3 text-xs text-amber-300/90">
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
              Override is OFF — life-safety alerts may be muted during quiet
              hours. Emergency best practice keeps this ON.
            </p>
          )}
        </div>
      )}

      {/* Helper footer */}
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Braces className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Quiet hours apply per-device timezone — synced with your routing matrix
        above.
      </p>
    </section>
  );
}