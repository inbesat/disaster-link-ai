"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { distance } from "@turf/distance";
import { point } from "@turf/helpers";
import {
  approveRequest,
  getInventory,
  getPendingRequests,
  type InventoryResource,
  type ResourceRequest,
} from "@/app/actions/resources";

const URGENCY_STYLES: Record<string, string> = {
  critical: "border-severity-red-500 bg-severity-red-600/10 text-severity-red-400",
  high: "border-severity-amber-500 bg-severity-amber-600/10 text-severity-amber-400",
  low: "border-severity-green-600 bg-severity-green-600/10 text-severity-green-400",
};

export default function DispatchPage() {
  // Phase 14 · SWR caching: both feeds revalidate every 30s, so the dispatch
  // console always reflects fresh depot stock without refetching on mount.
  const {
    data: fetchedRequests = [] as ResourceRequest[],
    mutate: mutateRequests,
    isLoading: loading,
  } = useSWR<ResourceRequest[]>("dispatch-requests", () => getPendingRequests(), {
    refreshInterval: 30_000,
  });
  const { data: inventory = [] as InventoryResource[] } = useSWR<InventoryResource[]>(
    "inventory",
    () => getInventory(),
    { refreshInterval: 30_000 },
  );
  const [dispatching, setDispatching] = useState<string | null>(null);

  // Local copy drives the optimistic Pending → Deployed column moves in
  // fulfill(); kept in sync with the SWR cache whenever it revalidates.
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  useEffect(() => {
    setRequests(fetchedRequests);
  }, [fetchedRequests]);

  const pending = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests],
  );
  const deployed = useMemo(
    () => requests.filter((r) => r.status !== "pending"),
    [requests],
  );

  // Smart Dispatch: for every pending request, find the nearest depot that has
  // the requested category in stock (available). Used both to suggest a match
  // on the card and as the resource to deploy on "Fulfill & Dispatch".
  const nearestMatches = useMemo(() => {
    const matches: Record<
      string,
      { id: string; name: string; distanceKm: number } | null
    > = {};
    for (const req of pending) {
      let best: { id: string; name: string; distanceKm: number } | null = null;
      for (const r of inventory) {
        if (r.category !== req.category || r.status !== "available") continue;
        const km = distance(point([req.lng, req.lat]), point([r.lng, r.lat]), {
          units: "kilometers",
        });
        if (!best || km < best.distanceKm) {
          best = {
            id: r.id,
            name: r.depotName ?? "Unknown Depot",
            distanceKm: km,
          };
        }
      }
      matches[req.id] = best;
    }
    return matches;
  }, [pending, inventory]);

  async function fulfill(req: ResourceRequest) {
    // Optimistic move to the Deployed column immediately.
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "fulfilled" } : r)),
    );
    setDispatching(req.id);

    const source =
      nearestMatches[req.id] ??
      inventory.find((r) => r.category === req.category) ??
      inventory[0];

    const ok = await approveRequest(req.id, source?.id ?? req.id);
    setDispatching(null);

    if (ok) {
      // Movement trail entry is written server-side on approval; revalidate
      // so the Deployed column + inventory movements feed reflect it.
      void mutateRequests();
    }

    if (!ok) {
      // Revert on failure.
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "pending" } : r)),
      );
      toast.error("Dispatch failed. Request returned to Pending.");
      return;
    }
    toast.success(
      `Dispatched ${req.quantityNeeded}× ${req.category} to ${req.requestedBy}.`,
    );
  }

  function Card({
    req,
    showDispatch,
    match,
  }: {
    req: ResourceRequest;
    showDispatch: boolean;
    match?: { id: string; name: string; distanceKm: number } | null;
  }) {
    const busy = dispatching === req.id;
    return (
      <div className="rounded-eoc border border-border bg-surface-muted/40 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold leading-snug text-foreground">{req.requestedBy}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {req.quantityNeeded}×{" "}
              {req.category.charAt(0).toUpperCase() + req.category.slice(1)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${URGENCY_STYLES[req.urgency] ?? "border-border text-slate-400"}`}
          >
            {req.urgency}
          </span>
        </div>
        <p className="mt-3 font-mono text-[11px] text-slate-500">
          {req.lat.toFixed(4)}, {req.lng.toFixed(4)}
        </p>
        {showDispatch && match && (
          <p className="mt-3 rounded-lg border border-severity-green-600 bg-severity-green-600/10 px-3 py-2 text-xs font-semibold text-severity-green-400">
            💡 Nearest Match: {match.name} ({match.distanceKm.toFixed(1)} km away).
            Dispatch now.
          </p>
        )}
        {showDispatch && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void fulfill(req)}
            className="mt-3 w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-glow transition hover:bg-sky-300 active:scale-95 disabled:opacity-50"
          >
            {busy ? "Dispatching…" : "Fulfill & Dispatch"}
          </button>
        )}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header>
        <p className="eoc-label text-accent">COMMAND CENTER · PHASE 12</p>
        <h1 className="text-2xl font-bold">Dispatch & Approval</h1>
        <p className="mt-1 text-sm text-slate-400">
          Review field requests and dispatch resources to the field.
        </p>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Pending column */}
        <section className="rounded-eoc border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-severity-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Pending Field Requests
            </h2>
            <span className="ml-auto rounded-full bg-surface-muted px-2 py-0.5 text-xs tabular-nums text-slate-300">
              {pending.length}
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            {loading && (
              <p className="py-8 text-center text-sm text-slate-500">Loading requests…</p>
            )}
            {!loading &&
              pending.map((req) => (
                <Card
                  key={req.id}
                  req={req}
                  showDispatch
                  match={nearestMatches[req.id] ?? null}
                />
              ))}
            {!loading && pending.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No pending requests. All clear.
              </p>
            )}
          </div>
        </section>

        {/* Deployed column */}
        <section className="rounded-eoc border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-severity-green-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Deployed
            </h2>
            <span className="ml-auto rounded-full bg-surface-muted px-2 py-0.5 text-xs tabular-nums text-slate-300">
              {deployed.length}
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            {!loading && deployed.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                Nothing deployed yet.
              </p>
            )}
            {deployed.map((req) => (
              <Card key={req.id} req={req} showDispatch={false} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
