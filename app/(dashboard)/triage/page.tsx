"use client";

import { useMemo, useState } from "react";
import { Check, X, Send, MapPinned } from "lucide-react";
import type { GroundReport } from "@/lib/crowdsourced/report";
import { GROUND_REPORT_TYPES, groundReportColor } from "@/lib/crowdsourced/report";
import { anonymizePII, sanitizeInput } from "@/lib/security/sanitize";

// ---------------------------------------------------------------------
// app/(dashboard)/triage/page.tsx — Phase 17 Step 5.
// Admin triage queue for incoming CrowdsourcedReport data (mocked). Each card
// shows the raw text, the AI-parsed severity score, and the location, with
// three actions: Verify, Reject/Fake, Dispatch Drone. Clicking an action
// removes the card from the queue.
// ---------------------------------------------------------------------

const MOCK_REPORTS: GroundReport[] = [
  {
    id: "r1",
    lat: 25.612,
    lng: 85.142,
    report_type: "flooding",
    source: "social",
    raw_text: "Water entering ground floor in Kankarbagh #PatnaFlood",
    severity: 70,
    confidence_score: 0.7,
    verification_status: "unverified",
    people_trapped: false,
    people_count: 0,
    locations: ["Kankarbagh"],
    summary: "Flooding at Kankarbagh",
  },
  {
    id: "r2",
    lat: 25.595,
    lng: 85.13,
    report_type: "road_blocked",
    source: "social",
    raw_text: "Bailey Road blocked, bus stuck in water, 12 people trapped #PatnaFlood",
    severity: 85,
    confidence_score: 0.85,
    verification_status: "unverified",
    people_trapped: true,
    people_count: 12,
    locations: ["Bailey Road"],
    summary: "Road blocked with trapped people",
  },
  {
    id: "r3",
    lat: 25.604,
    lng: 85.118,
    report_type: "shelter_needed",
    source: "sms",
    raw_text: "Pani ghar me aa raha hai Rajendra Nagar, family stuck on terrace pls help",
    severity: 90,
    confidence_score: 0.9,
    verification_status: "unverified",
    people_trapped: true,
    people_count: 5,
    locations: ["Rajendra Nagar"],
    summary: "Shelter needed, family on terrace",
  },
  {
    id: "r4",
    lat: 25.586,
    lng: 85.125,
    report_type: "rescue",
    source: "app",
    raw_text: "Rescue needed near Danapur bridge, 5 logon ko bachao jaldi",
    severity: 95,
    confidence_score: 0.95,
    verification_status: "unverified",
    people_trapped: true,
    people_count: 5,
    locations: ["Danapur"],
    summary: "Rescue required at Danapur bridge",
  },
];

const SEVERITY_CHIP: Record<string, string> = {
  low: "bg-severity-green-500/15 text-severity-green-400",
  medium: "bg-severity-amber-500/15 text-severity-amber-400",
  high: "bg-severity-red-500/15 text-severity-red-400",
  critical: "bg-severity-purple-500/15 text-severity-purple-400",
};

function severityOf(report: GroundReport): "low" | "medium" | "high" | "critical" {
  if (report.severity >= 85) return "critical";
  if (report.severity >= 65) return "high";
  if (report.severity >= 40) return "medium";
  return "low";
}

export default function TriagePage() {
  const [reports, setReports] = useState<GroundReport[]>(MOCK_REPORTS);
  const [filter, setFilter] = useState<
    GroundReport["report_type"] | "all" | "critical"
  >("all");
  const [toast, setToast] = useState<string | null>(null);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3000);
  }

  function removeReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  function onVerify(id: string) {
    notify("Verified — signal accepted as ground truth.");
    removeReport(id);
  }

  function onReject(id: string) {
    notify("Rejected — flagged as fake/spam.");
    removeReport(id);
  }

  function onDispatchDrone(id: string) {
    const report = reports.find((r) => r.id === id);
    notify(`Drone dispatched to ${report?.locations[0] ?? "location"}.`);
    removeReport(id);
  }

  const visible = useMemo(() => {
    return reports.filter((r) => {
      if (filter === "critical") return severityOf(r) === "critical";
      if (filter === "all") return true;
      return r.report_type === filter;
    });
  }, [reports, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Ground Truth Triage</h1>
          <p className="text-sm text-slate-400">
            {reports.length} report{reports.length === 1 ? "" : "s"} awaiting action
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-eoc border border-border bg-surface-elevated p-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-accent text-slate-950"
                : "text-slate-300 hover:text-accent"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("critical")}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
              filter === "critical"
                ? "bg-severity-red-500 text-white"
                : "text-slate-300 hover:text-severity-red-400"
            }`}
          >
            Critical
          </button>
          {GROUND_REPORT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setFilter(t.value)}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                filter === t.value
                  ? "bg-accent text-slate-950"
                  : "text-slate-300 hover:text-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="rounded-eoc border border-accent/40 bg-surface-elevated px-4 py-3 text-sm font-medium text-accent shadow-glow-accent">
          {toast}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="eoc-panel flex flex-col items-center gap-3 p-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-severity-green-500/15">
            <Check className="h-8 w-8 text-severity-green-400" />
          </div>
          <p className="text-lg font-bold text-foreground">Queue cleared</p>
          <p className="max-w-sm text-sm text-slate-400">
            All reports in this view have been handled. Change the filter or pull
            more social data to continue.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((report) => {
            const typeMeta = GROUND_REPORT_TYPES.find(
              (t) => t.value === report.report_type,
            ) ?? { value: report.report_type, label: report.report_type, color: "#3b82f6" };
            const sev = severityOf(report);
            return (
              <article
                key={report.id}
                className="eoc-panel flex flex-col gap-4 p-5 transition hover:border-accent/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-3 w-3 rounded-full"
                      style={{ backgroundColor: groundReportColor(report.report_type) }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {typeMeta.label}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MapPinned className="h-3.5 w-3.5" />
                    {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                  </span>
                </div>

                {/* Phase 21 · citizen PII is auto-redacted before rendering */}
                <div className="flex items-start gap-1.5">
                  <p className="text-sm leading-relaxed text-slate-200">
                    “{sanitizeInput(anonymizePII(report.raw_text))}”
                  </p>
                  <span
                    title="PII Auto-Redacted for Privacy"
                    aria-label="PII Auto-Redacted for Privacy"
                    className="mt-0.5 shrink-0 text-xs leading-none"
                  >
                    🔒
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${SEVERITY_CHIP[sev]}`}
                  >
                    Severity {report.severity}
                  </span>
                  <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-slate-300">
                    {report.source}
                  </span>
                  {report.people_trapped && (
                    <span className="rounded-full bg-severity-red-600/20 px-2.5 py-1 text-xs font-bold text-severity-red-400">
                      ⚠ {report.people_count} trapped
                    </span>
                  )}
                </div>

                <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => onVerify(report.id)}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-severity-green-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-severity-green-500"
                  >
                    <Check className="h-4 w-4" /> Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(report.id)}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-surface-elevated px-3 py-2.5 text-sm font-bold text-severity-red-400 ring-1 ring-severity-red-600 transition hover:bg-severity-red-600 hover:text-white"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => onDispatchDrone(report.id)}
                    className="flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-accent/80"
                  >
                    <Send className="h-4 w-4" /> Drone
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}