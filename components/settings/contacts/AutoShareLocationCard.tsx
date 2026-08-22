"use client";

// ---------------------------------------------------------------------
// components/settings/contacts/AutoShareLocationCard.tsx — Contacts (Phase 7 · Step 6).
//
// Live GPS Injection:
//   • Prominent toggle — automatically append live GPS coordinates and a
//     tracking link to every SOS message.
//   • Live mock preview of the exact appended text (coordinates +
//     accuracy + tracking link), shown while the injection is enabled.
//   • Secondary toggle — keep GPS tracking active for 60 minutes after an
//     SOS is triggered (only meaningful while injection is on).
// ---------------------------------------------------------------------

import toast from "react-hot-toast";
import { Lock, MapPin } from "lucide-react";
import { useContactSettings } from "@/lib/contacts-settings-mock";

const LOCATION_PREVIEW = "📍 Location: 25.5941° N, 85.1376° E (Accuracy: 4m)";
const TRACK_PREVIEW = "🔗 Track live: drip.app/t/abc123x9";

export default function AutoShareLocationCard() {
  const { settings, update } = useContactSettings();
  const { enabled: injectEnabled, tracking60 } = settings.gpsInjection;

  function toggleInject() {
    const next = !injectEnabled;
    update({ gpsInjection: { ...settings.gpsInjection, enabled: next } });
    toast(
      next
        ? "Live GPS injection enabled — coordinates appended to SOS messages."
        : "Live GPS injection disabled.",
      { duration: 2500 },
    );
  }

  function toggleTracking() {
    const next = !tracking60;
    update({ gpsInjection: { ...settings.gpsInjection, tracking60: next } });
    toast(
      next
        ? "GPS tracking stays active for 60 minutes after SOS."
        : "60-minute GPS tracking window disabled.",
      { duration: 2500 },
    );
  }

  return (
    <section
      data-settings-key="contacts-gps-injection"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <MapPin className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-emerald-300/80">LIVE GPS INJECTION</p>
          <h2 className="mt-0.5 text-lg font-bold">Live GPS Injection</h2>
        </div>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-eoc-tiny font-bold uppercase tracking-wider ${
            injectEnabled
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
              : "border-panel-borderHover bg-surface-muted/40 text-slate-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              injectEnabled ? "animate-pulse bg-emerald-400" : "bg-slate-600"
            }`}
          />
          {injectEnabled ? "GPS Active" : "GPS Off"}
        </span>
      </div>

      {/* Main toggle — prominent */}
      <div className="mt-4 flex items-start justify-between gap-4 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-100">
            Automatically append my live GPS coordinates and tracking link to
            all SOS messages.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Adds a live location line to every SOS broadcast so responders
            know exactly where you are.
          </p>
        </div>
        <Toggle
          on={injectEnabled}
          onToggle={toggleInject}
          label="Append GPS coordinates to SOS messages"
        />
      </div>

      {/* Appended-text preview */}
      <div className="mt-3">
        {injectEnabled ? (
          <div className="rounded-md border border-emerald-400/30 bg-emerald-500/[0.06] p-3 font-mono text-[11px] leading-relaxed">
            <p className="text-eoc-tiny uppercase tracking-widest text-emerald-300/70">
              Preview · appended to every SOS message
            </p>
            <p className="mt-1.5 text-emerald-200">{LOCATION_PREVIEW}</p>
            <p className="mt-0.5 text-cyan-300">{TRACK_PREVIEW}</p>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-panel-borderHover bg-surface-muted/30 p-3 font-mono text-[11px] text-slate-600">
            Preview appears once Live GPS injection is enabled.
          </div>
        )}
      </div>

      {/* Secondary toggle — 60 min tracking */}
      <div className="mt-3 flex items-start justify-between gap-4 rounded-md border border-panel-border bg-surface-muted/30 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-200">
            Keep GPS tracking active for 60 minutes after SOS is triggered.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Lets the control room follow your movement during the critical
            first hour of an incident.
          </p>
        </div>
        <Toggle
          on={tracking60}
          onToggle={toggleTracking}
          disabled={!injectEnabled}
          label="Keep GPS tracking active for 60 minutes after SOS"
        />
      </div>

      {/* Privacy note */}
      <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Coordinates are appended only to SOS messages — never to routine
        alerts. Tracking stops automatically after the window ends.
      </p>
    </section>
  );
}

function Toggle({
  on,
  onToggle,
  disabled = false,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        on ? "bg-emerald-500" : "bg-[#2c3f6d]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-[22px]" : "-translate-x-[2px]"
        }`}
      />
    </button>
  );
}
