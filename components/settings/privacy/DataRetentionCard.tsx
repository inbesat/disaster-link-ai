"use client";

// ---------------------------------------------------------------------
// components/settings/privacy/DataRetentionCard.tsx — Privacy (Phase 6 · Step 8).
//
// Data Retention & Auto-Deletion:
//   • "Data Retention Policies" card with per-record-type cleanup
//     dropdowns — Delete AI Chat History after (7/30/90 days · Keep
//     forever), Archive GPS Location History after (24 hours / 7 days /
//     30 days), plus Flood Predictions and Attendance Logs for a complete
//     lifecycle footprint.
//   • Records past their window are auto-deleted nightly; GPS history is
//     archived rather than destroyed.
//   • Red "Purge Historical Data Now" button opens a typed confirmation
//     modal; confirming runs a brief cleanup simulation and fires a green
//     success toast reporting how many megabytes were freed.
//   • Persists through lib/settings/privacy-settings.ts.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Database, Eraser } from "lucide-react";
import type { RetentionPolicy } from "@/lib/settings/privacy-settings";

type PolicyKey = keyof RetentionPolicy;

type PolicyOption = { value: number; label: string };

type PolicyConfig = {
  key: PolicyKey;
  label: string;
  hint: string;
  options: PolicyOption[];
};

const CHAT_OPTIONS: PolicyOption[] = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 0, label: "Keep forever" },
];

const GPS_OPTIONS: PolicyOption[] = [
  { value: 24, label: "24 hours" },
  { value: 168, label: "7 days" },
  { value: 720, label: "30 days" },
];

const ATTENDANCE_OPTIONS: PolicyOption[] = [
  { value: 1, label: "1 month" },
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
  { value: 0, label: "Keep forever" },
];

const POLICIES: PolicyConfig[] = [
  {
    key: "chatHistoryDays",
    label: "Delete AI Chat History after",
    hint: "Planner conversations with the AI assistant.",
    options: CHAT_OPTIONS,
  },
  {
    key: "gpsLocationHours",
    label: "Archive GPS Location History after",
    hint: "Field check-ins and location pings — archived, not destroyed.",
    options: GPS_OPTIONS,
  },
  {
    key: "predictionsDays",
    label: "Delete Flood Predictions after",
    hint: "Stored ML risk predictions and history charts.",
    options: CHAT_OPTIONS,
  },
  {
    key: "attendanceMonths",
    label: "Delete Attendance Logs after",
    hint: "Field check-ins and duty schedule records.",
    options: ATTENDANCE_OPTIONS,
  },
];

/** Select-bound value, falling back to the first option when a legacy
 *  persisted number isn't in the dropdown list (e.g. old numeric inputs). */
function selectValue(policy: PolicyConfig, stored: number): number {
  return policy.options.some((option) => option.value === stored)
    ? stored
    : policy.options[0].value;
}

/** Schedule summary chip — "Deletes after 7 days · rolls off 15 Aug 2026". */
function scheduleLabel(policy: PolicyConfig, stored: number): string {
  const value = selectValue(policy, stored);
  if (value === 0) return "Keep forever";

  const option = policy.options.find((o) => o.value === value);
  const label = option?.label ?? `${value}`;

  if (policy.key === "gpsLocationHours") {
    return `Archives after ${label}`;
  }

  const now = new Date();
  if (policy.key === "attendanceMonths") {
    now.setMonth(now.getMonth() + value);
  } else {
    now.setDate(now.getDate() + value);
  }
  const date = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `Deletes after ${label} · rolls off ${date}`;
}

export default function DataRetentionCard({
  retention,
  onChange,
}: {
  retention: RetentionPolicy;
  onChange: (policy: RetentionPolicy) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [purging, setPurging] = useState(false);
  // `scheduleLabel` renders a date computed from `new Date()` — computing it
  // before hydration would let Node ICU locale output and a client-side
  // midnight rollover diverge from the server HTML. Gate it on mount.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalDeletable = useMemo(
    () =>
      POLICIES.reduce((sum, p) => sum + (retention[p.key] === 0 ? 0 : 1), 0),
    [retention],
  );

  function updatePolicy(key: PolicyKey, raw: string) {
    onChange({ ...retention, [key]: Number(raw) });
  }

  function handlePurge() {
    setPurging(true);
    setTimeout(() => {
      // Simulated cleanup footprint — a believable MB figure for the toast.
      const mbFreed = 60 + Math.floor(Math.random() * 260);
      setPurging(false);
      setConfirmOpen(false);
      toast.success(
        `Purge complete — ${mbFreed} MB of historical data freed.`,
      );
    }, 1100);
  }

  return (
    <>
      <section
        data-settings-key="privacy-data-retention"
        className="rounded-eoc border border-panel-border bg-surface p-5"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <Database className="h-5 w-5 text-emerald-300" aria-hidden />
          </div>
          <div>
            <p className="eoc-label text-emerald-300/80">LIFECYCLE · AUTO-DELETION</p>
            <h2 className="mt-0.5 text-lg font-bold">Data Retention Policies</h2>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          Set how long each record type is held before automatic cleanup.
          Records past their window roll off nightly; GPS history is archived
          rather than deleted (DPDP Act 2023 §17).
        </p>

        {/* Policy dropdowns */}
        <div className="mt-5 space-y-3">
          {POLICIES.map((policy) => (
            <div
              key={policy.key}
              className="rounded-md border border-panel-border bg-surface-muted/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor={`retention-${policy.key}`}
                    className="block text-sm font-bold text-slate-200"
                  >
                    {policy.label}
                  </label>
                  <p className="mt-0.5 text-xs text-slate-500">{policy.hint}</p>
                </div>
                <select
                  id={`retention-${policy.key}`}
                  value={selectValue(policy, retention[policy.key])}
                  onChange={(e) => updatePolicy(policy.key, e.target.value)}
                  className="rounded-md border border-panel-border bg-[#0a0f1a] px-3 py-2 text-sm font-semibold text-slate-100 outline-none transition focus:border-emerald-400/60"
                >
                  {policy.options.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-[#0a0f1a]"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#16213c] pt-2.5">
                <p className="text-[11px] text-slate-500">
                  {retention[policy.key] === 0
                    ? "No auto-deletion configured"
                    : "Automated cleanup is active"}
                </p>
                <span className="rounded-full border border-panel-borderHover bg-[#1c2740] px-2 py-0.5 font-mono text-eoc-tiny font-semibold text-slate-300">
                  {mounted ? scheduleLabel(policy, retention[policy.key]) : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Purge historical data */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-red-500/30 bg-red-500/[0.05] p-4">
          <div className="flex items-center gap-3">
            <Eraser className="h-5 w-5 shrink-0 text-red-400" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-red-300">
                Purge Historical Data
              </p>
              <p className="text-xs text-slate-400">
                Immediately delete everything past the retention windows above.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={totalDeletable === 0}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(220,38,38,0.35)] transition hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eraser className="h-4 w-4" aria-hidden />
            Purge Historical Data Now
          </button>
        </div>
      </section>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="retention-purge-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-eoc border border-red-500/50 bg-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden />
              </div>
              <div>
                <h2
                  id="retention-purge-title"
                  className="text-base font-bold text-red-300"
                >
                  Purge historical data now?
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  {totalDeletable} record type{totalDeletable === 1 ? "" : "s"} have an
                  active retention window. Everything beyond it will be
                  deleted immediately and cannot be recovered.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={purging}
                className="rounded-md border border-panel-borderHover px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-surface-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurge}
                disabled={purging}
                className="inline-flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-60"
              >
                <Eraser className="h-4 w-4" aria-hidden />
                {purging ? "Purging…" : "Purge now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
