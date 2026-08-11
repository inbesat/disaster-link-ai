"use client";

// ---------------------------------------------------------------------
// app/public/settings/page.tsx — Phase 13 · Step 2 · Citizen settings.
//
// Root settings page for the Citizen App. The headline control is the
// EXTREME LOW-BANDWIDTH toggle: while on, every /public page hides the
// MapLibre map, heavy images and the AI assistant, replacing them with
// plain-text lists so a 2G storm connection stays usable under ~50KB per
// screen. The choice persists to localStorage via BandwidthContext.
// ---------------------------------------------------------------------

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Contrast,
  History,
  Wifi,
  WifiOff,
} from "lucide-react";
import BottomNav from "@/components/public/BottomNav";
import PwaInstallCard from "@/components/pwa/PwaInstallCard";
import { useBandwidth } from "@/lib/contexts/BandwidthContext";
import { useHighContrast } from "@/lib/contexts/HighContrastContext";

export default function PublicSettingsPage() {
  const { isLowBandwidthMode, setLowBandwidthMode } = useBandwidth();
  const { isHighContrast, setHighContrast } = useHighContrast();

  return (
    <main className="relative flex min-h-screen flex-col bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-5">
        <Link
          href="/public/dashboard"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition hover:border-[var(--dl-orange)]/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white">Settings</h1>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--dl-text-muted)]">
            CITIZEN APP
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-6">
        {/* Low-bandwidth toggle */}
        <section className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                {isLowBandwidthMode ? (
                  <WifiOff aria-hidden="true" className="h-4 w-4 text-[var(--dl-orange-light)]" />
                ) : (
                  <Wifi aria-hidden="true" className="h-4 w-4 text-[var(--dl-text-muted)]" />
                )}
                Extreme Low-Bandwidth Mode
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--dl-text-muted)]">
                For 2G networks during storms. Hides the map, heavy images and
                the AI assistant — every screen stays under ~50KB of data.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isLowBandwidthMode}
              aria-label="Toggle extreme low-bandwidth mode"
              onClick={() => setLowBandwidthMode(!isLowBandwidthMode)}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] ${
                isLowBandwidthMode
                  ? "border-[var(--dl-orange)] bg-[var(--dl-orange)]"
                  : "border-white/20 bg-white/10"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
                  isLowBandwidthMode ? "left-[calc(100%-1.5rem)]" : "left-1"
                }`}
              />
            </button>
          </div>

          {isLowBandwidthMode && (
            <p className="mt-3 rounded-lg border border-[var(--dl-orange)]/30 bg-[var(--dl-orange)]/10 px-3 py-2 text-[0.6875rem] font-medium text-[var(--dl-orange-light)]">
              Active — maps and the AI assistant are hidden until you switch
              this off.
            </p>
          )}
        </section>

        {/* Phase 13 · Step 10 — High Contrast Mode (a11y). Overrides the
            app's tokens to pure black-on-white and strips decorative
            gradients/borders for screen-reader & low-vision users. */}
        <section className="mt-6 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Contrast
                  aria-hidden="true"
                  className={`h-4 w-4 ${isHighContrast ? "text-white" : "text-[var(--dl-text-muted)]"}`}
                />
                High Contrast Mode
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--dl-text-muted)]">
                Pure black background with pure white text. Removes gradients
                and subtle borders for maximum legibility.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isHighContrast}
              aria-label="Toggle high contrast mode"
              onClick={() => setHighContrast(!isHighContrast)}
              className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] ${
                isHighContrast
                  ? "border-[var(--dl-orange)] bg-[var(--dl-orange)]"
                  : "border-white/20 bg-white/10"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
                  isHighContrast ? "left-[calc(100%-1.5rem)]" : "left-1"
                }`}
              />
            </button>
          </div>

          {isHighContrast && (
            <p className="mt-3 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-[0.6875rem] font-medium text-white">
              Active — the app now uses pure black and white.
            </p>
          )}
        </section>

        {/* Phase 13 · Step 3 — PWA install status / action. */}
        <section className="mt-6">
          <PwaInstallCard />
        </section>

        {/* Other settings */}
        <section className="mt-6 space-y-2.5">
          <p className="eoc-label text-[var(--dl-text-muted)]">PREFERENCES</p>
          <Link
            href="/public/settings/alerts"
            className="flex items-center gap-3 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4 transition hover:border-white/20 active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <Bell aria-hidden="true" className="h-4 w-4 text-[var(--dl-orange-light)]" />
            </span>
            <span className="flex-1 text-sm font-semibold text-white">Alert Preferences</span>
            <ArrowLeft aria-hidden="true" className="h-4 w-4 rotate-180 text-[var(--dl-text-muted)]" />
          </Link>
          <Link
            href="/public/settings/sos-history"
            className="flex items-center gap-3 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4 transition hover:border-white/20 active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <History aria-hidden="true" className="h-4 w-4 text-[var(--dl-orange-light)]" />
            </span>
            <span className="flex-1 text-sm font-semibold text-white">SOS History</span>
            <ArrowLeft aria-hidden="true" className="h-4 w-4 rotate-180 text-[var(--dl-text-muted)]" />
          </Link>
        </section>
      </div>

      {/* Sticky citizen bottom nav — same as the other settings pages */}
      <BottomNav />
    </main>
  );
}
