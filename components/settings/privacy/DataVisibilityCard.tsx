"use client";

// ---------------------------------------------------------------------
// components/settings/privacy/DataVisibilityCard.tsx — Privacy (Phase 6 · Step 2).
//
// "Operational Data Visibility": segmented controls decide who can see
// Live GPS Location, Duty Schedule/Attendance and Personal Contact Info.
//
// State is owned by the shared usePrivacySettings() hook (Step 10) so
// every toggle persists to localStorage and fires the central subtle
// "Privacy preferences updated" toast.
//
// An alert explains that during an active Emergency Mode (SOS), GPS
// visibility is temporarily forced to "Command Admins" for safety.
// ---------------------------------------------------------------------

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { usePrivacySettings } from "@/lib/privacy-settings-mock";
import type {
  ContactVisibility,
  GpsVisibility,
} from "@/lib/settings/privacy-settings";

const GPS_OPTIONS: { value: GpsVisibility; label: string }[] = [
  { value: "nobody", label: "Nobody" },
  { value: "team", label: "My Team Only" },
  { value: "admins", label: "Command Admins Only" },
];

const CONTACT_OPTIONS: { value: ContactVisibility; label: string }[] = [
  { value: "team_admins", label: "Team & Admins" },
  { value: "admins", label: "Admins Only" },
];

export default function DataVisibilityCard() {
  const { settings, update } = usePrivacySettings();
  const { visibility } = settings;

  return (
    <section
      data-settings-key="privacy-data-visibility"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-emerald-300/80">VISIBILITY</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Operational Data Visibility
          </h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Decide which audiences may see your operational records. Changes apply
        to the demo instantly and persist across sessions.
      </p>

      <div className="mt-5 space-y-4">
        <VisibilityRow
          kind="Live GPS Location"
          hint="Who may pin your position on the response map"
          options={GPS_OPTIONS}
          value={visibility.gps}
          onChange={(v) => update({ visibility: { ...visibility, gps: v } })}
        />

        <VisibilityRow
          kind="Duty Schedule / Attendance"
          hint="Who may view your shifts and check-in times"
          options={GPS_OPTIONS}
          value={visibility.attendance}
          onChange={(v) =>
            update({ visibility: { ...visibility, attendance: v } })
          }
        />

        <VisibilityRow
          kind="Personal Contact Info"
          hint="Email and phone number you reachable with"
          options={CONTACT_OPTIONS}
          value={visibility.contact}
          onChange={(v) =>
            update({ visibility: { ...visibility, contact: v } })
          }
        />
      </div>

      {/* Emergency Mode tooltip */}
      <div className="mt-6 flex items-start gap-3 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" aria-hidden />
        <p className="text-xs leading-relaxed text-slate-400">
          In the event of an active{" "}
          <span className="font-semibold text-red-300">Emergency Mode (SOS)</span>,
          GPS visibility is temporarily{" "}
          <span className="font-semibold text-slate-200">
            forced to &ldquo;Command Admins&rdquo;
          </span>{" "}
          for your safety. Your preferences resume when the incident clears.
        </p>
      </div>
    </section>
  );
}

function VisibilityRow<T extends string>({
  kind,
  hint,
  options,
  value,
  onChange,
}: {
  kind: string;
  hint: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="rounded-md border border-panel-border bg-surface-muted/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-200">{kind}</p>
          <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
        </div>

        {/* Segmented control */}
        <div
          role="group"
          aria-label={`Visibility for ${kind}`}
          className="flex flex-wrap items-center gap-1 rounded-md border border-panel-border bg-[#0a0f1d] p-1"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(option.value)}
                className={`rounded px-2.5 py-1.5 text-[11px] font-bold transition ${
                  selected
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
