"use client";

// ---------------------------------------------------------------------
// app/gov/missing-persons/page.tsx — Missing Person & Casualty
// Verification Queue (command-center side of the citizen reporter).
//
// Live data: GET /api/reports/missing (in-memory store, seeded so the
// queue is never empty). Officials review each PENDING_REVIEW report and:
//   • Approve & Broadcast → VERIFIED_ACTIVE  (enters active search)
//   • Mark Found          → RESOLVED_FOUND
//   • Dismiss             → REJECTED
// Status changes PATCH to the API and update the UI optimistically.
//
// Theme matches the gov command center: bg-[#0a0f1a], bg-[#111827] cards,
// border-white/10, blue focus rings.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Loader2,
  MapPin,
  Megaphone,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";

type ReportType = "MISSING_PERSON" | "CASUALTY";
type ReportStatus = "PENDING_REVIEW" | "VERIFIED_ACTIVE" | "RESOLVED_FOUND" | "REJECTED";

type MissingReport = {
  id: string;
  type: ReportType;
  fullName: string;
  age: number | string;
  gender: string;
  lastSeenLocation: string;
  photoUrl: string;
  reporterName: string;
  reporterPhone: string;
  medicalNotes: string;
  status: ReportStatus;
  createdAt: string;
};

const STATUS_BADGE: Record<ReportStatus, { label: string; style: string }> = {
  PENDING_REVIEW: { label: "PENDING", style: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  VERIFIED_ACTIVE: { label: "VERIFIED · ACTIVE SEARCH", style: "bg-blue-500/15 text-sky-300 border-blue-500/30" },
  RESOLVED_FOUND: { label: "RESOLVED / FOUND", style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  REJECTED: { label: "REJECTED", style: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
};

const STATUS_FILTERS: Array<{ key: ReportStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "PENDING_REVIEW", label: "Pending" },
  { key: "VERIFIED_ACTIVE", label: "Active" },
  { key: "RESOLVED_FOUND", label: "Resolved" },
  { key: "REJECTED", label: "Rejected" },
];

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
}

export default function MissingPersonsPage() {
  const [reports, setReports] = useState<MissingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [viewPhoto, setViewPhoto] = useState<MissingReport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/missing", { signal: AbortSignal.timeout(10_000) });
      const body = (await res.json().catch(() => ({}))) as { reports?: MissingReport[] };
      setReports(Array.isArray(body.reports) ? body.reports : []);
    } catch {
      // Keep previous list on failure; banner below signals staleness.
      showToast("error", { title: "Could not refresh queue", description: "Showing last known reports." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /** Optimistic status flip, then PATCH; rollback + toast on failure. */
  const transition = useCallback(
    async (report: MissingReport, status: Exclude<ReportStatus, "PENDING_REVIEW">) => {
      setBusyId(report.id);
      const prev = reports;
      setReports((rs) => rs.map((r) => (r.id === report.id ? { ...r, status } : r)));
      try {
        const res = await fetch("/api/reports/missing", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: report.id, status }),
          signal: AbortSignal.timeout(10_000),
        });
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        showToast(
          status === "REJECTED" ? "info" : "success",
          {
            title:
              status === "VERIFIED_ACTIVE"
                ? "Verified & broadcast — active search started"
                : status === "RESOLVED_FOUND"
                  ? "Marked resolved / found"
                  : "Report dismissed",
            description: report.fullName,
          },
        );
      } catch (err: unknown) {
        setReports(prev); // rollback
        showToast("error", {
          title: "Update failed",
          description: err instanceof Error ? err.message : "Please retry.",
        });
      } finally {
        setBusyId(null);
      }
    },
    [reports],
  );

  const counts = useMemo(
    () => ({
      pending: reports.filter((r) => r.status === "PENDING_REVIEW").length,
      active: reports.filter((r) => r.status === "VERIFIED_ACTIVE").length,
      resolved: reports.filter((r) => r.status === "RESOLVED_FOUND").length,
    }),
    [reports],
  );

  const visible = useMemo(
    () => (statusFilter === "all" ? reports : reports.filter((r) => r.status === statusFilter)),
    [reports, statusFilter],
  );

  return (
    <main className="min-h-screen bg-[#0a0f1a] px-4 pb-16 pt-6 md:px-8">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 ring-1 ring-blue-500/40">
            <FileSearch className="h-5 w-5 text-sky-300" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Missing Person &amp; Casualty Verification</h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Citizen reports · verify before broadcast
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="Refresh queue"
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#111827] px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500/50 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </header>

      {/* Summary counters */}
      <section aria-label="Queue summary" className="mx-auto mt-5 grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Pending Verification", value: counts.pending, icon: AlertTriangle, tone: "text-amber-400", ring: "ring-amber-500/30", bg: "bg-amber-500/[0.07]" },
          { label: "Active Search", value: counts.active, icon: Megaphone, tone: "text-sky-300", ring: "ring-blue-500/30", bg: "bg-blue-500/[0.07]" },
          { label: "Resolved / Found", value: counts.resolved, icon: CheckCircle2, tone: "text-emerald-400", ring: "ring-emerald-500/30", bg: "bg-emerald-500/[0.07]" },
        ].map(({ label, value, icon: Icon, tone, ring, bg }) => (
          <div key={label} className={`flex items-center gap-4 rounded-xl border border-white/10 ${bg} p-4 ring-1 ${ring}`}>
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 ${tone}`}>
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-3xl font-black tabular-nums text-white">{loading ? "—" : value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Status filters */}
      <div className="mx-auto mt-5 flex max-w-7xl flex-wrap gap-2" role="group" aria-label="Filter by status">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            aria-pressed={statusFilter === key}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
              statusFilter === key
                ? "bg-blue-600 text-white shadow-[0_0_14px_rgba(37,99,235,0.4)]"
                : "border border-white/10 bg-[#111827] text-slate-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Review cards */}
      <section aria-label="Reports" className="mx-auto mt-5 grid max-w-7xl gap-4 lg:grid-cols-2">
        {!loading && visible.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-slate-500">
            No reports in this view.
          </p>
        )}

        {visible.map((r) => {
          const badge = STATUS_BADGE[r.status];
          const busy = busyId === r.id;
          return (
            <article
              key={r.id}
              className={`rounded-2xl border border-white/10 bg-[#111827] p-4 transition ${
                r.status === "PENDING_REVIEW" ? "ring-1 ring-amber-500/25" : ""
              }`}
            >
              <div className="flex gap-4">
                {/* Thumbnail → full-size modal */}
                <button
                  type="button"
                  onClick={() => setViewPhoto(r)}
                  aria-label={`View full photo of ${r.fullName}`}
                  className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                >
                  {r.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.photoUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-white/5 text-slate-500">
                      <UserRound className="h-8 w-8" aria-hidden />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-[0.5625rem] font-bold uppercase tracking-wider text-slate-200 opacity-0 transition group-hover:opacity-100">
                    View
                  </span>
                </button>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="truncate text-base font-bold text-white">{r.fullName}</h2>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.5625rem] font-black uppercase tracking-wider ${badge.style}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {r.type === "CASUALTY" ? "Casualty report" : "Missing person"} · {r.age === "Unknown" ? "age unknown" : `Age ${r.age}`} · {r.gender}
                  </p>
                  <dl className="mt-2 space-y-1 text-xs">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden />
                      <dd className="min-w-0">{r.lastSeenLocation}</dd>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
                      <dd>
                        <a href={`tel:${r.reporterPhone.replace(/\s/g, "")}`} className="hover:underline">
                          {r.reporterName} · {r.reporterPhone}
                        </a>
                      </dd>
                    </div>
                  </dl>
                  {r.medicalNotes && (
                    <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs leading-relaxed text-red-200">
                      <strong className="font-bold">Medical:</strong> {r.medicalNotes}
                    </p>
                  )}
                  <p className="mt-1.5 text-[0.6875rem] text-slate-500">Filed {timeAgo(r.createdAt)}</p>
                </div>
              </div>

              {/* Actions — only for pending reports */}
              {r.status === "PENDING_REVIEW" && (
                <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/10 pt-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => void transition(r, "VERIFIED_ACTIVE")}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Megaphone className="h-3.5 w-3.5" aria-hidden />}
                    Approve &amp; Broadcast
                  </button>
                  <button
                    type="button"
                    onClick={() => void transition(r, "RESOLVED_FOUND")}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Mark Found
                  </button>
                  <button
                    type="button"
                    onClick={() => void transition(r, "REJECTED")}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                    Dismiss
                  </button>
                </div>
              )}
              {r.status !== "PENDING_REVIEW" && (
                <p className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-2.5 text-[0.6875rem] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Reviewed — no further action required.
                </p>
              )}
            </article>
          );
        })}
      </section>

      {/* Full-size photo modal */}
      {viewPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo of ${viewPhoto.fullName}`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setViewPhoto(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#111827]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {viewPhoto.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewPhoto.photoUrl} alt={`Full photo of ${viewPhoto.fullName}`} className="max-h-[55vh] w-full object-contain" />
              ) : (
                <div className="flex h-64 items-center justify-center text-slate-500">No photo attached</div>
              )}
              <button
                type="button"
                onClick={() => setViewPhoto(null)}
                aria-label="Close photo"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-500/80"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="space-y-1 p-4">
              <p className="text-base font-bold text-white">{viewPhoto.fullName}</p>
              <p className="text-xs text-slate-400">{viewPhoto.lastSeenLocation}</p>
              <p className="text-xs text-slate-500">
                Reporter: {viewPhoto.reporterName} · {viewPhoto.reporterPhone}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
