"use client";

import { useMemo, useState } from "react";

export type Allocation = {
  resourceId: string;
  resourceName?: string;
  category: string;
  demandId: string;
  disasterEventId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  quantityAllocated: number;
  priorityScore: number;
  estimatedArrival?: string;
  status: string;
};

export function allocationKey(a: Allocation): string {
  return `${a.resourceId}:${a.demandId}`;
}

function priorityBadge(score: number): string {
  if (score >= 160)
    return "border-severity-red-500 bg-severity-red-600/10 text-severity-red-400";
  if (score >= 130)
    return "border-severity-amber-500 bg-severity-amber-600/10 text-severity-amber-400";
  return "border-severity-green-600 bg-severity-green-600/10 text-severity-green-400";
}

function hoursUntil(eta?: string): number | null {
  if (!eta) return null;
  const diff = new Date(eta).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 3600000));
}

export default function AllocationList({
  plan,
  lockedKeys,
  onToggleLock,
}: {
  plan: Allocation[];
  lockedKeys: string[];
  onToggleLock: (key: string) => void;
}) {
  const sorted = useMemo(
    () => [...plan].sort((a, b) => b.priorityScore - a.priorityScore),
    [plan],
  );

  const [printing, setPrinting] = useState(false);

  function printManifest() {
    setPrinting(true);
    window.setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 80);
  }

  return (
    <>
      {/* Print-only styles: hide everything else, keep only the manifest. */}
      {printing && (
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #dispatch-manifest, #dispatch-manifest * { visibility: visible; }
            #dispatch-manifest { position: absolute; left: 0; top: 0; width: 100%; }
          }
        `}</style>
      )}

      <div className="rounded-eoc border border-border bg-surface print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Proposed Allocation Plan
          </h2>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs tabular-nums text-slate-300">
              {sorted.length}
            </span>
            <button
              type="button"
              onClick={printManifest}
              disabled={sorted.length === 0}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground transition hover:bg-surface-muted disabled:opacity-40"
            >
              🖨️ Print Dispatch Manifest
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/60 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Priority Score</th>
                <th className="px-4 py-3 font-semibold">Resource Type</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Destination</th>
                <th className="px-4 py-3 font-semibold">ETA</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a) => {
                const key = allocationKey(a);
                const isLocked = lockedKeys.includes(key);
                const hours = hoursUntil(a.estimatedArrival);
                return (
                  <tr
                    key={key}
                    className={`border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted/40 ${isLocked ? "bg-accent/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold tabular-nums ${priorityBadge(a.priorityScore)}`}
                      >
                        {isLocked ? "🔒 " : ""}
                        {Math.round(a.priorityScore)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold capitalize text-foreground">
                        {a.category}
                      </p>
                      {a.resourceName && (
                        <p className="text-xs text-slate-500">{a.resourceName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold tabular-nums text-foreground">
                      {a.quantityAllocated}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {a.destinationLat.toFixed(4)}, {a.destinationLng.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">
                      {hours === null ? "—" : `~${hours}h`}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onToggleLock(key)}
                        aria-pressed={isLocked}
                        className={`rounded-md border px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${
                          isLocked
                            ? "border-severity-amber-500 bg-severity-amber-600/10 text-severity-amber-400"
                            : "border-border text-slate-400 hover:text-foreground"
                        }`}
                      >
                        {isLocked ? "🔒 Unlock" : "🔒 Lock"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Run the optimizer to generate a plan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print-only dispatch manifest for convoy drivers */}
      <div
        id="dispatch-manifest"
        className={`${printing ? "block" : "hidden"} fixed inset-0 z-[999] overflow-auto bg-white p-6 text-black print:static print:block print:p-4`}
      >
        <header className="border-b-2 border-black pb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest">
            SafeSphere Platform · Dispatch Manifest
          </p>
          <h1 className="mt-1 text-2xl font-black">DISPATCH MANIFEST</h1>
          <p className="mt-1 text-xs">
            Generated {new Date().toLocaleString()} · {sorted.length} assignment
            {sorted.length === 1 ? "" : "s"} · For convoy driver handoff
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="mt-4 w-full border-collapse text-xs">
            <thead>
            <tr className="border-b-2 border-black text-left uppercase">
              <th className="py-1.5 pr-2 font-bold">#</th>
              <th className="py-1.5 pr-2 font-bold">Resource</th>
              <th className="py-1.5 pr-2 font-bold">Category</th>
              <th className="py-1.5 pr-2 font-bold">Qty</th>
              <th className="py-1.5 pr-2 font-bold">Origin (Lat, Lng)</th>
              <th className="py-1.5 pr-2 font-bold">Destination (Lat, Lng)</th>
              <th className="py-1.5 pr-2 font-bold">ETA</th>
              <th className="py-1.5 font-bold">Priority</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr key={allocationKey(a)} className="border-b border-black/40">
                <td className="py-1.5 pr-2 font-bold">{i + 1}</td>
                <td className="py-1.5 pr-2">{a.resourceName ?? a.category}</td>
                <td className="py-1.5 pr-2 capitalize">{a.category}</td>
                <td className="py-1.5 pr-2 font-bold">{a.quantityAllocated}</td>
                <td className="py-1.5 pr-2 font-mono">
                  {a.originLat.toFixed(4)}, {a.originLng.toFixed(4)}
                </td>
                <td className="py-1.5 pr-2 font-mono">
                  {a.destinationLat.toFixed(4)}, {a.destinationLng.toFixed(4)}
                </td>
                <td className="py-1.5 pr-2">
                  {a.estimatedArrival
                    ? new Date(a.estimatedArrival).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
                <td className="py-1.5">{Math.round(a.priorityScore)}</td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        <footer className="mt-6 border-t-2 border-black pt-3 text-xs">
          <p className="font-bold">DRIVER INSTRUCTIONS</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5">
            <li>Verify the load against the manifest before departure.</li>
            <li>
              Follow the assigned route; report any road closures to Command Center.
            </li>
            <li>Confirm arrival and handoff at the destination coordinates.</li>
          </ol>
        </footer>
      </div>
    </>
  );
}
