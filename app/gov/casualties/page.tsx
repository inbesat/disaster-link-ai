"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Loader2,
  Plus,
  Search,
  Stethoscope,
  XCircle,
  User,
  MapPin,
} from "lucide-react";

// ---------------------------------------------------------------------
// app/gov/casualties/page.tsx — Casualty Tracking Registry
//
// Dark-mode UI for logging and tracking casualty records.
// Matches the gov dashboard theme: bg-[#0a0f1a] page bg,
// bg-[#111827] cards, blue focus rings, border-white/10.
// ---------------------------------------------------------------------

interface CasualtyRecord {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  injuryType: string;
  severity: string;
  description: string | null;
  locationName: string | null;
  district: string | null;
  status: string;
  createdAt: string;
}

const STAT_CARDS = [
  { label: "Total", value: 0, tone: "text-white", icon: <Activity size={18} /> },
  { label: "Critical", value: 0, tone: "text-red-400", icon: <AlertTriangle size={18} /> },
  { label: "Active", value: 0, tone: "text-amber-400", icon: <Heart size={18} /> },
  { label: "Treated", value: 0, tone: "text-emerald-400", icon: <CheckCircle2 size={18} /> },
] as const;

const SEVERITY_STYLES: Record<string, string> = {
  minor: "bg-sky-500/15 text-sky-400 border border-sky-500/20",
  moderate: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  severe: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  critical: "bg-red-500/15 text-red-400 border border-red-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  treated: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  discharged: "bg-sky-500/15 text-sky-400 border border-sky-500/20",
  deceased: "bg-red-500/15 text-red-400 border border-red-500/20",
};

export default function CasualtiesPage() {
  const [records, setRecords] = useState<CasualtyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Fetch records from the API
  useEffect(() => {
    async function fetchRecords() {
      try {
        const res = await fetch("/api/casualties");
        const data = await res.json();
        if (data.ok && Array.isArray(data.records)) {
          setRecords(data.records);
        }
      } catch {
        // Silent — show empty state
      } finally {
        setLoading(false);
      }
    }
    void fetchRecords();
  }, []);

  const filtered = records.filter((r) => {
    if (searchQuery === "") return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.name?.toLowerCase().includes(q) ?? false) ||
      (r.locationName?.toLowerCase().includes(q) ?? false) ||
      r.injuryType.toLowerCase().includes(q)
    );
  });

  // Compute stat counts from live data
  const total = records.length;
  const critical = records.filter((r) => r.severity === "critical").length;
  const active = records.filter((r) => r.status === "active").length;
  const treated = records.filter((r) => r.status === "treated" || r.status === "discharged").length;
  const statValues = [total, critical, active, treated];

  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Casualty Tracking
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Log and monitor casualty records across active disaster zones
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.97]"
          >
            <Plus size={16} />
            Log Casualty
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {/* Stats Row — 4 columns */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STAT_CARDS.map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-[#111827] p-5"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{stat.icon}</span>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
              </div>
              <p className={`mt-2 font-mono text-3xl font-bold ${stat.tone}`}>
                {statValues[i]}
              </p>
            </div>
          ))}
        </div>

        {/* Inline Log Form — collapsible */}
        {showForm && (
          <div className="mt-6 rounded-xl border border-white/10 bg-[#111827] p-6">
            <h2 className="text-lg font-semibold text-white">Log New Casualty</h2>
            <p className="mt-1 text-sm text-slate-400">
              Record a casualty or injury incident for tracking
            </p>
            <form
              className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                // Mock submit for demo
                setShowForm(false);
              }}
            >
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Full name (optional)"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Age
                </label>
                <input
                  type="number"
                  placeholder="Age"
                  min={0}
                  max={120}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Injury Type
                </label>
                <select className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="injury">Injury</option>
                  <option value="illness">Illness</option>
                  <option value="fatality">Fatality</option>
                  <option value="missing">Missing</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Severity
                </label>
                <select className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Area or landmark"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </label>
                <select className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="treated">Treated</option>
                  <option value="discharged">Discharged</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Injury details, circumstances…"
                  className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-400 transition hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 active:scale-[0.97]"
                >
                  <Stethoscope size={16} />
                  Save Record
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name, location, or injury type…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#111827] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Records Table / Empty State */}
        <div className="mt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#111827] py-16 text-center">
              <Loader2 size={32} className="mb-3 animate-spin text-slate-500" />
              <p className="text-sm text-slate-400">Loading records…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#111827] py-16 text-center">
              <Stethoscope size={40} className="mb-3 text-slate-500" />
              <p className="text-sm font-medium text-slate-400">
                No casualty records found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Click &quot;Log Casualty&quot; to add a new record
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111827]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Injury Type</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((record) => (
                    <tr
                      key={record.id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                            <User size={14} className="text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {record.name || "Unknown"}
                            </p>
                            {record.age != null && (
                              <p className="text-xs text-slate-500">
                                Age {record.age}
                                {record.gender ? ` · ${record.gender}` : ""}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {record.injuryType}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLES[record.severity] ?? "bg-slate-500/15 text-slate-400"}`}
                        >
                          {record.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <MapPin size={12} />
                          {record.locationName || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[record.status] ?? "bg-slate-500/15 text-slate-400"}`}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-white/10 px-4 py-2 text-xs text-slate-500">
                Showing {filtered.length} of {records.length} records
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
