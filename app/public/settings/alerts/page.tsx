"use client";

// ---------------------------------------------------------------------
// app/public/settings/alerts/page.tsx — Phase 3 · Step 5 · Public Alert
// Preferences.
//
// Mobile-friendly settings form for what pings the citizen:
//   • Alert Types     — Floods / Cyclones / Earthquakes toggles
//   • Severity        — segmented control: Only Critical / Watch +
//                       Critical / All Alerts
//   • Quiet Hours     — 10 PM – 6 AM master switch, with the "Critical
//                       Life-Safety Alerts always bypass Quiet Hours"
//                       sub-toggle permanently locked ON (life-safety
//                       must always break through — it renders as an
//                       enabled, disabled switch with a lock icon).
//
// Preferences persist to localStorage through useAlertPreferences
// (lib/mock-data/alert-preferences.ts) and actually drive the alerts
// feed on /public/alerts — disable Floods there and the flood alerts
// disappear. Reachable from the alerts page header (Settings icon).
// ---------------------------------------------------------------------

import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Moon,
  Mountain,
  SlidersHorizontal,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";
import BottomNav from "@/components/public/BottomNav";
import { useAlertPreferences } from "@/hooks/useAlertPreferences";
import {
  type AlertTypePref,
  type SeverityPref,
} from "@/lib/mock-data/alert-preferences";

const TYPE_ROWS: Array<{
  key: AlertTypePref;
  label: string;
  caption: string;
  icon: LucideIcon;
}> = [
  { key: "flood", label: "Floods", caption: "Rising rivers, breaches, inundation", icon: Waves },
  { key: "cyclone", label: "Cyclones", caption: "Storm surge and high winds", icon: Wind },
  { key: "earthquake", label: "Earthquakes", caption: "Tremors and aftershocks", icon: Mountain },
];

const SEVERITY_OPTIONS: Array<{ key: SeverityPref; label: string }> = [
  { key: "critical", label: "Only Critical" },
  { key: "watch-critical", label: "Watch + Critical" },
  { key: "all", label: "All Alerts" },
];

/** Citizen switch — role="switch", keyboard-usable, orange when on. */
function Switch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] ${
        disabled ? "cursor-not-allowed" : ""
      } ${checked ? "bg-[var(--brand-orange)]" : "bg-white/15"}`}
    >
      <span
        aria-hidden="true"
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

export default function PublicAlertSettingsPage() {
  const { preferences, setPreferences } = useAlertPreferences();

  const toggleType = (key: AlertTypePref) =>
    setPreferences({
      ...preferences,
      types: { ...preferences.types, [key]: !preferences.types[key] },
    });

  return (
    <main className="relative flex min-h-screen flex-col bg-[var(--dl-navy)] pb-[100px] text-[var(--dl-text-on-navy)]">
      {/* Ambient backdrop — same treatment as the other citizen pages */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_80%_-10%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_45%_40%_at_0%_110%,rgba(249,115,22,0.14),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[calc(88px+env(safe-area-inset-bottom))]">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[var(--dl-navy)]/85 px-4 pb-3 pt-5 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <Link
              href="/public/alerts"
              aria-label="Back to alerts"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition hover:border-[var(--dl-orange)]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F97316]/20 ring-1 ring-[#F97316]/40">
                <SlidersHorizontal
                  aria-hidden="true"
                  className="h-4 w-4 text-[var(--brand-orangeLight)]"
                />
              </span>
              <div>
                <h1 className="text-base font-bold text-white">Alert Settings</h1>
                <p className="eoc-label text-[var(--dl-text-muted)]">
                  WHAT PINGS YOU
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Alert types */}
        <section className="mt-5">
          <p className="eoc-label text-[var(--dl-text-muted)]">ALERT TYPES</p>
          <div className="mt-2 divide-y divide-white/5 rounded-[var(--dl-radius)] border border-white/10 bg-white/5 backdrop-blur">
            {TYPE_ROWS.map(({ key, label, caption, icon: Icon }) => (
              <div key={key} className="flex items-center gap-3 p-4">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--dl-orange-light)]"
                >
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="text-xs text-[var(--dl-text-muted)]">{caption}</p>
                </div>
                <Switch
                  checked={preferences.types[key]}
                  onChange={() => toggleType(key)}
                  label={`${label} alerts`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Severity */}
        <section className="mt-6">
          <p className="eoc-label text-[var(--dl-text-muted)]">SEVERITY</p>
          <p className="mt-1 text-xs text-[var(--dl-text-muted)]">
            Only the loudest warnings, or everything that&apos;s happening.
          </p>
          <div
            role="group"
            aria-label="Severity threshold"
            className="mt-2 grid grid-cols-3 gap-2"
          >
            {SEVERITY_OPTIONS.map(({ key, label }) => {
              const active = preferences.severity === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setPreferences({ ...preferences, severity: key })
                  }
                  className={`rounded-xl border px-2 py-3 text-center text-xs font-bold leading-tight transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] ${
                    active
                      ? "border-[var(--brand-orange)] bg-[#F97316]/20 text-[var(--brand-orangeLight)]"
                      : "border-white/10 bg-white/5 text-[var(--dl-text-muted)] hover:border-white/25 hover:text-[var(--dl-text-on-navy)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Quiet hours */}
        <section className="mt-6">
          <p className="eoc-label text-[var(--dl-text-muted)]">QUIET HOURS</p>
          <div className="mt-2 divide-y divide-white/5 rounded-[var(--dl-radius)] border border-white/10 bg-white/5 backdrop-blur">
            <div className="flex items-center gap-3 p-4">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[var(--dl-orange-light)]"
              >
                <Moon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">Quiet Hours</p>
                <p className="text-xs text-[var(--dl-text-muted)]">10 PM – 6 AM</p>
              </div>
              <Switch
                checked={preferences.quietHours}
                onChange={(next) =>
                  setPreferences({ ...preferences, quietHours: next })
                }
                label="Quiet hours"
              />
            </div>

            {/* Permanently locked bypass — always on, not user-toggleable */}
            <div className="flex items-center gap-3 p-4 opacity-90">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-severity-red-500/15 text-severity-red-300"
              >
                <Lock className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">
                  Critical Life-Safety Alerts always bypass Quiet Hours
                </p>
                <p className="text-xs text-[var(--dl-text-muted)]">
                  Locked on — an imminent flood never sleeps.
                </p>
              </div>
              <Switch
                checked
                onChange={() => {}}
                disabled
                label="Critical alerts always bypass quiet hours (locked)"
              />
            </div>
          </div>
        </section>

        <p className="mt-5 text-center text-[0.6875rem] text-[var(--dl-text-muted)]">
          Changes save automatically on this device.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}
