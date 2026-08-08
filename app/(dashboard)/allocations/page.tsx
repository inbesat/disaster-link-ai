"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import AllocationList, { type Allocation } from "@/components/allocations/AllocationList";
import AllocationTimeline from "@/components/allocations/AllocationTimeline";
import AllocationMap, {
  type MapAllocation,
} from "@/components/allocations/AllocationMap";
import ScenarioSimulator from "@/components/allocations/ScenarioSimulator";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type UnmetDemand = {
  demandId: string;
  category: string;
  quantityNeeded: number;
  quantityAllocated: number;
  unmet: number;
  priorityScore: number;
};

type OptimizeResponse = {
  ok: boolean;
  event_id: string;
  plan: Allocation[];
  unmet_demand: UnmetDemand[];
  meta: {
    resources_scanned: number;
    demands_scanned: number;
    allocations_proposed: number;
    locked_allocations: number;
    fleet_availability: number;
    demand_surge: number;
  };
};

function totalUnmet(res: OptimizeResponse): number {
  return res.unmet_demand.reduce((sum, d) => sum + d.unmet, 0);
}

export default function AllocationsPage() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const [lockedKeys, setLockedKeys] = useState<string[]>([]);
  const [baselineGap, setBaselineGap] = useState<number | null>(null);

  function toggleLock(key: string) {
    setLockedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function runOptimization(overrides?: {
    fleetAvailability?: number;
    demandSurge?: number;
  }) {
    setRunning(true);
    try {
      const res = await fetch("/api/allocations/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: result?.event_id ?? undefined,
          locked_allocations: lockedKeys.map((key) => {
            const [resource_id, demand_id] = key.split(":");
            return { resource_id, demand_id };
          }),
          fleet_availability: overrides?.fleetAvailability ?? 100,
          demand_surge: overrides?.demandSurge ?? 0,
        }),
      });
      const data = (await res.json()) as OptimizeResponse;
      if (!data.ok) {
        toast.error("Optimization failed.");
        return;
      }
      setResult(data);
      if (!overrides) {
        // A plain "Run Optimization" re-establishes the baseline gap.
        setBaselineGap(totalUnmet(data));
      }
      toast.success(`Optimized — ${data.plan.length} allocations proposed.`);
    } catch {
      toast.error("Could not reach the allocation engine.");
    } finally {
      setRunning(false);
    }
  }

  const unmetGap = result ? totalUnmet(result) : null;

  const mapAllocations = useMemo<MapAllocation[]>(
    () =>
      (result?.plan ?? []).map((a) => ({
        id: `${a.resourceId}:${a.demandId}`,
        origin: { lat: a.originLat, lng: a.originLng },
        destination: { lat: a.destinationLat, lng: a.destinationLng },
        category: a.category,
        quantity: a.quantityAllocated,
      })),
    [result],
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Top section */}
      <section className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="eoc-label text-accent">
            {t("command_center").toUpperCase()} · PHASE 13
          </p>
          <h1 className="text-2xl font-bold">{t("allocations")}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Auto-prioritizes demand and assigns the nearest available resources.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 md:w-80">
          <button
            type="button"
            disabled={running}
            onClick={() => void runOptimization()}
            className="rounded-md bg-accent px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-glow transition hover:bg-sky-300 active:scale-95 disabled:opacity-50"
          >
            {running ? "Optimizing…" : "⚡ Run Optimization"}
          </button>
          <ScenarioSimulator
            running={running}
            unmetGap={unmetGap}
            baselineGap={baselineGap}
            onRecalculate={(fleetAvailability, demandSurge) =>
              void runOptimization({ fleetAvailability, demandSurge })
            }
          />
        </div>
      </section>

      {result && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Allocations Proposed", value: result.meta.allocations_proposed },
            { label: "Unmet Demand", value: result.unmet_demand.length },
            { label: "Resources Scanned", value: result.meta.resources_scanned },
            { label: "Demands Scanned", value: result.meta.demands_scanned },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-eoc border border-border bg-surface p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Middle section — Timeline Chart + Map visualization */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {result && result.plan.length > 0 ? (
          <AllocationTimeline plan={result.plan} />
        ) : (
          <div className="flex min-h-72 items-center justify-center rounded-eoc border border-dashed border-border bg-surface-muted/30">
            <p className="text-sm text-slate-500">
              Deployment Timeline — run the optimizer to populate
            </p>
          </div>
        )}
        <div className="overflow-hidden rounded-eoc border border-border">
          {result && result.plan.length > 0 ? (
            <div className="h-96">
              <AllocationMap allocations={mapAllocations} />
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center bg-surface-muted/30">
              <p className="text-sm text-slate-500">
                Allocation Map — run the optimizer to draw dispatch lines
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom section — Allocation List Table */}
      <section className="mt-6">
        {result ? (
          <AllocationList
            plan={result.plan}
            lockedKeys={lockedKeys}
            onToggleLock={toggleLock}
          />
        ) : (
          <div className="flex min-h-48 items-center justify-center rounded-eoc border border-dashed border-border bg-surface-muted/30">
            <p className="text-sm text-slate-500">
              Allocation List Table — pending, en-route &amp; delivered. Run
              the optimizer to populate the dispatch plan.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
