"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  Lock,
  Mail,
  Radio,
  Search,
  ShieldAlert,
  Star,
  Unlock,
  Users,
  Zap,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";

const DISTRICTS = ["All Districts", "Patna", "Ernakulam", "Purba Champaran"] as const;

type Priority = "critical" | "high" | "medium" | "low";

type Row = {
  id: string;
  plan: string;
  district: string;
  priority: Priority;
  assets: string;
  owner: string;
  updated: string;
  status: "LIVE" | "EXECUTING" | "STAGED" | "COMPLETE";
};

const ROWS: Row[] = [
  {
    id: "evac-112",
    plan: "Evacuate Riverline B Sector",
    district: "Patna",
    priority: "critical",
    assets: "14 units",
    owner: "R. Verma",
    updated: "2m ago",
    status: "LIVE",
  },
  {
    id: "deploy-88",
    plan: "Deploy Boats to Kadamtala",
    district: "Patna",
    priority: "high",
    assets: "6 boats",
    owner: "S. Nair",
    updated: "9m ago",
    status: "EXECUTING",
  },
  {
    id: "medical-7",
    plan: "Mobile Clinic – Kampur Staging",
    district: "Purba Champaran",
    priority: "high",
    assets: "3 clinics",
    owner: "T. Das",
    updated: "22m ago",
    status: "EXECUTING",
  },
  {
    id: "shelter-30",
    plan: "Open Shelter 8 + Water Drop",
    district: "Ernakulam",
    priority: "medium",
    assets: "1 site",
    owner: "M. Ali",
    updated: "41m ago",
    status: "STAGED",
  },
  {
    id: "scan-55",
    plan: "Fly Recon Grid 4N",
    district: "Purba Champaran",
    priority: "low",
    assets: "3 drones",
    owner: "J. Kaur",
    updated: "1h ago",
    status: "STAGED",
  },
  {
    id: "warn-90",
    plan: "Broadcast Lowland Warning",
    district: "Ernakulam",
    priority: "critical",
    assets: "SMS · Radio",
    owner: "R. Verma",
    updated: "1h ago",
    status: "LIVE",
  },
  {
    id: "supply-21",
    plan: "Resupply Caveman Trail Depot",
    district: "Patna",
    priority: "medium",
    assets: "6 trucks",
    owner: "S. Nair",
    updated: "2h ago",
    status: "COMPLETE",
  },
];

const PRIORITY: Record<Priority, { badge: string; dot: string }> = {
  critical: { badge: "border-red-500/50 bg-red-500/10 text-red-300", dot: "bg-red-500" },
  high: {
    badge: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  medium: {
    badge: "border-cyan-500/50 bg-cyan-500/10 text-cyan-300",
    dot: "bg-cyan-400",
  },
  low: {
    badge: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    dot: "bg-emerald-400",
  },
};

const STATUS_BADGE: Record<Row["status"], string> = {
  LIVE: "bg-red-500/15 text-red-300",
  EXECUTING: "bg-amber-500/15 text-amber-200",
  STAGED: "bg-cyan-500/15 text-cyan-300",
  COMPLETE: "bg-emerald-500/15 text-emerald-300",
};

export default function AdminDashboardPage() {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState<(typeof DISTRICTS)[number]>("All Districts");
  const [priority, setPriority] = useState("all");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [locked, setLocked] = useState(false);

  const rows = useMemo(
    () =>
      ROWS.filter((r) => {
        const q = query.trim().toLowerCase();
        const matchQ =
          q === "" ||
          r.plan.toLowerCase().includes(q) ||
          r.owner.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q);
        const matchD = district === "All Districts" || r.district === district;
        const matchP = priority === "all" || r.priority === priority;
        return matchQ && matchD && matchP;
      }),
    [query, district, priority],
  );

  const allVisible = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const selectedCount = rows.filter((r) => selected.has(r.id)).length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      rows.forEach((r) => (allVisible ? next.delete(r.id) : next.add(r.id)));
      return next;
    });
  }

  function runBulk(action: "sms" | "lockdown") {
    const count = selectedCount || rows.length;
    if (!selectedCount) {
      showToast("warning", {
        title: "No rows selected",
        description: "Select operations to target.",
      });
      return;
    }
    if (action === "sms") {
      showToast("info", {
        title: "Mass SMS Blast queued",
        description: `${count} operation owner${count === 1 ? "" : "s"} notified · dispatch batch #B-221`,
        duration: 5000,
      });
    } else {
      if (locked) {
        setLocked(false);
        showToast("success", {
          title: "System Lockdown released",
          description: "Field channels restored.",
        });
      } else {
        setLocked(true);
        showToast("error", {
          title: "SYSTEM LOCKDOWN ENGAGED",
          description: `${count} operation${count === 1 ? "" : "s"} frozen. Full audit trail active.`,
          duration: 6000,
        });
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            icon: Users,
            label: "Active Users",
            value: "42",
            sub: "+4 / hr",
            tint: "text-cyan-300",
          },
          {
            icon: Radio,
            label: "Live Operations",
            value: "7",
            sub: "3 critical",
            tint: "text-red-300",
          },
          {
            icon: Star,
            label: "Districts",
            value: "3",
            sub: "All configured",
            tint: "text-amber-300",
          },
          {
            icon: Activity,
            label: "ML Service",
            value: "Healthy",
            sub: "0.98 confidence",
            tint: "text-emerald-300",
          },
        ].map(({ icon: Icon, label, value, sub, tint }) => (
          <div
            key={label}
            className="rounded-lg border border-[#1c2740] bg-[#0b1120] p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {label}
              </p>
              <Icon className={`h-4 w-4 ${tint}`} aria-hidden />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* System Lockdown banner */}
      {locked && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-red-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-red-300">System Lockdown Active</p>
            <p className="text-xs text-slate-400">
              New logins blocked · field commands frozen · full audit trail enabled.
            </p>
          </div>
          <span
            className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500"
            aria-hidden
          />
        </div>
      )}

      {/* Persistent filter bar */}
      <div className="sticky top-12 z-30 -my-1 rounded-lg border border-[#1c2740] bg-[#020617]/95 py-2 pl-2 pr-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-[#1c2740] bg-[#0b1120] px-2.5 py-1.5">
            <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plan, owner, district…"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-slate-600"
            />
          </div>

          <label className="sr-only">District</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value as (typeof DISTRICTS)[number])}
            className="rounded-md border border-[#1c2740] bg-[#0b1120] px-2 py-1.5 text-xs font-medium text-slate-300 outline-none focus:border-[#2c3f6d]"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <label className="sr-only">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-[#1c2740] bg-[#0b1120] px-2 py-1.5 text-xs font-medium text-slate-300 outline-none focus:border-[#2c3f6d]"
          >
            <option value="all">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            type="button"
            onClick={() =>
              showToast("info", {
                title: "Filter snapshot saved",
                description: `Showing ${rows.length} operation${rows.length === 1 ? "" : "s"} under current filters.`,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-[#1c2740] bg-[#0b1120] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
          >
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Apply
          </button>
        </div>

        {/* Bulk operation row */}
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-[#1c2740] pt-2">
          <div className="flex flex-1 items-center gap-2 text-xs">
            <input
              id="select-all"
              type="checkbox"
              checked={allVisible}
              onChange={toggleAll}
              className="h-3.5 w-3.5 accent-amber-400"
            />
            <label
              htmlFor="select-all"
              className="cursor-pointer select-none text-slate-400"
            >
              Select all{" "}
              {rows.length > 0 && (
                <span className="text-slate-500">({selectedCount} selected)</span>
              )}
            </label>
          </div>

          <button
            type="button"
            onClick={() => runBulk("sms")}
            disabled={selectedCount === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Mass SMS Blast
          </button>
          <button
            type="button"
            onClick={() => runBulk("lockdown")}
            disabled={selectedCount === 0}
            className={`inline-flex items-center gap-1.5 rounded-md bg-accent-danger px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${
              locked ? "bg-red-500" : ""
            }`}
          >
            {locked ? (
              <Unlock className="h-4 w-4" aria-hidden />
            ) : (
              <Lock className="h-4 w-4" aria-hidden />
            )}
            {locked ? "Release" : "System Lockdown"}
          </button>
          <button
            type="button"
            onClick={() =>
              showToast("info", {
                title: "Export started",
                description: "Compiling operations manifest (CSV).",
              })
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-[#1c2740] bg-[#0b1120] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </button>
        </div>
      </div>

      {/* Dense operations table */}
      <div className="overflow-hidden rounded-lg border border-[#1c2740]">
        <div className="flex items-center justify-between border-b border-[#1c2740] bg-[#0b1120] px-4 py-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-300" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Active Operations
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            {rows.length}/{ROWS.length} visible
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0b1120] text-[10px] uppercase tracking-widest text-slate-500">
                <th className="w-9 border-b border-b-slate-700 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="h-3.5 w-3.5 accent-amber-400"
                  />
                </th>
                <th className="border-b border-b-slate-700 py-2 pe-4">Operation Plan</th>
                <th className="border-b border-b-slate-700 px-4 py-2">District</th>
                <th className="border-b border-b-slate-700 px-4 py-2">Priority</th>
                <th className="border-b border-b-slate-700 px-4 py-2">Status</th>
                <th className="border-b border-b-slate-700 px-4 py-2">Resources</th>
                <th className="border-b border-b-slate-700 px-4 py-2">Owner</th>
                <th className="border-b border-b-slate-700 py-2 ps-4 text-right">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const checked = selected.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className="group border-b border-[#141d33] text-sm transition-colors last:border-0 hover:bg-[#0d1526]"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(row.id)}
                        aria-label={`Select ${row.plan}`}
                        className="h-3.5 w-3.5 cursor-pointer accent-amber-400"
                      />
                    </td>
                    <td className="max-w-[280px] py-2 pe-4">
                      <p className="truncate font-medium text-slate-200">{row.plan}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-400">
                      {row.district}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PRIORITY[row.priority].badge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${PRIORITY[row.priority].dot}`}
                          aria-hidden
                        />
                        {row.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-400">
                      {row.assets}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-slate-400">
                      {row.owner}
                    </td>
                    <td className="whitespace-nowrap py-2 ps-4 text-right text-[11px] text-slate-500">
                      {row.updated}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center">
                    <AlertTriangle
                      className="mx-auto h-6 w-6 text-slate-600"
                      aria-hidden
                    />
                    <p className="mt-2 text-sm text-slate-500">
                      No operations match the current filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
        Ingest stream healthy · {selectedCount} operation{selectedCount === 1 ? "" : "s"}{" "}
        queued for bulk actions
      </p>
    </div>
  );
}
