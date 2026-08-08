"use client";

// ---------------------------------------------------------------------
// app/(app)/settings/notifications/page.tsx — Settings · Phase 2 · Step 1 & 10.
//
// Communication & Alert Preferences shell:
//   • Page header — "Communication & Alert Preferences" with a subtext on
//     how/when critical operational intel and emergency dispatches arrive.
//   • Master Switch at the top — "Pause All Non-Critical Notifications".
//     Flipping it dims the rest of the page (opacity + reduced contrast on
//     the surrounding panels) without locking them, so the operator can
//     still tweak settings.
//   • Since Step 10 the page is a thin wiring layer: every leaf control is
//     driven by the central useNotificationSettings store, which round-trips
//     to localStorage (hydration-safe) so preferences survive refresh.
// ---------------------------------------------------------------------

import { AudioLines, BellRing, RadioTower } from "lucide-react";
import NotificationChannelMatrix from "@/components/settings/NotificationChannelMatrix";
import QuietHoursCard from "@/components/settings/QuietHoursCard";
import AlertRadiusCard from "@/components/settings/AlertRadiusCard";
import AlertSoundCard from "@/components/settings/AlertSoundCard";
import DigestModeCard from "@/components/settings/DigestModeCard";
import NotificationDiagnostics from "@/components/settings/NotificationDiagnostics";
import { useNotificationSettings } from "@/lib/settings/useNotificationSettings";

export default function NotificationsSettingsPage() {
  const { settings, update, toggleRoute, changeThreshold, resetMatrix } =
    useNotificationSettings();

  const {
    paused,
    routes,
    thresholds,
    digestEnabled,
    digestTime,
    dndEnabled,
    quietStart,
    quietEnd,
    overrideDndCritical,
    radiusIndex,
    homeDistrictAlerts,
    tone,
    hapticsEnabled,
  } = settings;

  return (
    <div className="space-y-6">
      <header data-settings-key="notifications-header">
        <p className="eoc-label flex items-center gap-2 text-cyan-400/90">
          <BellRing className="h-3.5 w-3.5" aria-hidden />
          SETTINGS / NOTIFICATIONS
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Communication &amp; Alert Preferences
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Configure how and when you receive critical operational intel and
          emergency dispatches.
        </p>
      </header>

      {/* Master switch — pausing dims the whole page below. */}
      <section
        className={`grid gap-4 rounded-lg border p-5 transition-opacity ${
          paused ? "border-[#1c2740] bg-surface-muted/40 opacity-100" : "border-[#1c2740] bg-surface"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                paused ? "bg-slate-500/10" : "bg-amber-500/10"
              }`}
            >
              {paused ? (
                <AudioLines className="h-5 w-5 text-slate-400" aria-hidden />
              ) : (
                <BellRing className="h-5 w-5 text-amber-300" aria-hidden />
              )}
            </div>
            <div>
              <p className="text-sm font-bold">
                {paused ? "Non-critical notifications paused" : "Pause All Non-Critical Notifications"}
              </p>
              <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-slate-400">
                When paused, severity-critical alerts (Flood Warnings, Evacuation
                Orders) still break through on every channel. Everything else —
                chat mentions, system updates, resource chatter — is silenced
                until you resume.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={paused}
            aria-label="Pause all non-critical notifications"
            onClick={() => update({ paused: !paused })}
            data-settings-key="master-pause"
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              paused ? "bg-slate-600" : "bg-amber-500"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                paused ? "-translate-x-[2px]" : "translate-x-[26px]"
              }`}
            />
          </button>
        </div>

        {paused && (
          <p className="flex items-center gap-2 border-t border-[#16213c] pt-3 text-xs text-slate-500">
            <RadioTower className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Emergency dispatch override stays active while paused.
          </p>
        )}
      </section>

      {/* Routing matrix — dimmed (not locked) while the master switch is on. */}
      <div
        className={`transition-opacity duration-200 ${paused ? "opacity-45" : "opacity-100"}`}
        aria-hidden={paused}
      >
        <NotificationChannelMatrix
          paused={paused}
          digestEnabled={digestEnabled}
          routes={routes}
          thresholds={thresholds}
          onToggleRoute={toggleRoute}
          onChangeThreshold={changeThreshold}
          onResetMatrix={resetMatrix}
        />
      </div>

      {/* Do Not Disturb — dimmed by the master switch. */}
      <div
        className={`transition-opacity duration-200 ${paused ? "opacity-45" : "opacity-100"}`}
      >
        <QuietHoursCard
          dndEnabled={dndEnabled}
          quietStart={quietStart}
          quietEnd={quietEnd}
          overrideDndCritical={overrideDndCritical}
          onDndEnabledChange={(next) => update({ dndEnabled: next })}
          onQuietStartChange={(next) => update({ quietStart: next })}
          onQuietEndChange={(next) => update({ quietEnd: next })}
          onOverrideDndCriticalChange={(next) =>
            update({ overrideDndCritical: next })
          }
        />
      </div>

      {/* Digest mode + geospatial radius — dimmed while paused. */}
      <div
        className={`grid gap-6 transition-opacity duration-200 lg:grid-cols-2 ${
          paused ? "opacity-45" : "opacity-100"
        }`}
      >
        <DigestModeCard
          enabled={digestEnabled}
          digestTime={digestTime}
          onEnabledChange={(next) => update({ digestEnabled: next })}
          onTimeChange={(next) => update({ digestTime: next })}
        />
        <AlertRadiusCard
          radiusIndex={radiusIndex}
          homeDistrictAlerts={homeDistrictAlerts}
          onRadiusIndexChange={(next) => update({ radiusIndex: next })}
          onHomeDistrictAlertsChange={(next) =>
            update({ homeDistrictAlerts: next })
          }
        />
      </div>

      {/* Sound + diagnostics — dimmed while paused. */}
      <div
        className={`grid gap-6 transition-opacity duration-200 lg:grid-cols-2 ${
          paused ? "opacity-45" : "opacity-100"
        }`}
      >
        <AlertSoundCard
          tone={tone}
          hapticsEnabled={hapticsEnabled}
          onToneChange={(next) => update({ tone: next })}
          onHapticsChange={(next) => update({ hapticsEnabled: next })}
        />
        <NotificationDiagnostics />
      </div>
    </div>
  );
}