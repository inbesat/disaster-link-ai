"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateFleetRequirements } from "@/lib/map/fleet-allocation";
import { fetchEvacuationPlans } from "@/lib/map/evacuation-plans-client";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type PlanStatus = "pending" | "in_transit" | "completed";

type PlanCard = {
  id: string;
  villageName: string;
  shelterName: string;
  evacuees: number;
  routeDurationSec: number;
  status: PlanStatus;
};

const MOCK_PLANS: PlanCard[] = [
  {
    id: "plan-1",
    villageName: "Ganga Floodplain Village",
    shelterName: "Central Community Hall",
    evacuees: 150,
    routeDurationSec: 40 * 60,
    status: "in_transit",
  },
  {
    id: "plan-2",
    villageName: "Phaganpur Village",
    shelterName: "Riverside High School",
    evacuees: 280,
    routeDurationSec: 65 * 60,
    status: "pending",
  },
  {
    id: "plan-3",
    villageName: "Sonepur Riverside",
    shelterName: "District Hospital Annex",
    evacuees: 95,
    routeDurationSec: 22 * 60,
    status: "in_transit",
  },
  {
    id: "plan-4",
    villageName: "Digha Ghat Settlement",
    shelterName: "Central Community Hall",
    evacuees: 210,
    routeDurationSec: 15 * 60,
    status: "completed",
  },
  {
    id: "plan-5",
    villageName: "Kankarbagh Colony",
    shelterName: "Civic Center",
    evacuees: 340,
    routeDurationSec: 75 * 60,
    status: "pending",
  },
];

const COLUMNS: { key: PlanStatus; title: string; accent: string; dot: string }[] = [
  {
    key: "pending",
    title: "Pending Assignment",
    accent: "border-severity-amber-500/60",
    dot: "bg-severity-amber-500",
  },
  {
    key: "in_transit",
    title: "Convoy In Transit",
    accent: "border-severity-red-500/60",
    dot: "bg-severity-red-500",
  },
  {
    key: "completed",
    title: "Safely Arrived",
    accent: "border-severity-green-500/60",
    dot: "bg-severity-green-500",
  },
];

const NEXT_STATUS: Record<PlanStatus, PlanStatus | null> = {
  pending: "in_transit",
  in_transit: "completed",
  completed: null,
};

const PREV_STATUS: Record<PlanStatus, PlanStatus | null> = {
  pending: null,
  in_transit: "pending",
  completed: "in_transit",
};

export default function EvacuationsPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PlanCard[]>(MOCK_PLANS);
  const [dragId, setDragId] = useState<string | null>(null);

  // Merge persisted plans created via the Mass Evacuation Planner into the
  // board, de-duplicating against the demo cards by village name.
  useEffect(() => {
    let active = true;
    fetchEvacuationPlans()
      .then((persisted) => {
        if (!active || persisted.length === 0) return;
        const mockVillages = new Set(MOCK_PLANS.map((p) => p.villageName));
        const extra = persisted
          .filter((p) => !mockVillages.has(p.villageName))
          .map<PlanCard>((p) => ({
            id: p.id,
            villageName: p.villageName,
            shelterName: p.shelterName ?? "Assigned shelter",
            evacuees: p.estimatedEvacuees,
            routeDurationSec: 30 * 60,
            status: (p.status in { pending: 1, in_transit: 1, completed: 1 }
              ? p.status
              : "pending") as PlanStatus,
          }));
        if (extra.length) setPlans((prev) => [...extra, ...prev]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const moveTo = (id: string, status: PlanStatus) =>
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

  const totals = useMemo(() => {
    const evacuees = plans.reduce((s, p) => s + p.evacuees, 0);
    const arrived = plans
      .filter((p) => p.status === "completed")
      .reduce((s, p) => s + p.evacuees, 0);
    const inTransit = plans
      .filter((p) => p.status === "in_transit")
      .reduce((s, p) => s + p.evacuees, 0);
    return { evacuees, arrived, inTransit };
  }, [plans]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eoc-label text-accent">
            {t("command_center").toUpperCase()} · PHASE 9
          </p>
          <h1 className="text-2xl font-bold">{t("evacuations")}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Active convoy operations across all affected districts.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-300">
          <span>
            Total evacuees: <b className="tabular-nums">{totals.evacuees}</b>
          </span>
          <span className="text-severity-red-400">
            In transit: <b className="tabular-nums">{totals.inTransit}</b>
          </span>
          <span className="text-severity-green-400">
            Arrived: <b className="tabular-nums">{totals.arrived}</b>
          </span>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const cards = plans.filter((p) => p.status === col.key);
          return (
            <div
              key={col.key}
              className={`flex flex-col rounded-eoc border-2 border-border bg-surface ${col.accent}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) moveTo(dragId, col.key);
                setDragId(null);
              }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    {col.title}
                  </h2>
                </div>
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs tabular-nums text-slate-300">
                  {cards.length}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                {cards.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No convoys here
                  </p>
                )}
                {cards.map((plan) => {
                  const fleet = calculateFleetRequirements(
                    plan.evacuees,
                    plan.routeDurationSec,
                  );
                  return (
                    <div
                      key={plan.id}
                      draggable
                      onDragStart={() => setDragId(plan.id)}
                      onDragEnd={() => setDragId(null)}
                      className="cursor-grab rounded-eoc border border-border-strong bg-surface-elevated/60 p-4 transition hover:border-accent active:cursor-grabbing"
                    >
                      <p className="font-semibold text-foreground">{plan.villageName}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        → {plan.shelterName}
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded border border-border bg-surface-muted p-1.5">
                          <p className="text-sm font-bold tabular-nums">
                            {plan.evacuees}
                          </p>
                          <p className="text-[10px] uppercase text-slate-400">Evacuees</p>
                        </div>
                        <div className="rounded border border-border bg-surface-muted p-1.5">
                          <p className="text-sm font-bold tabular-nums">
                            {fleet.busesNeeded}
                          </p>
                          <p className="text-[10px] uppercase text-slate-400">Buses</p>
                        </div>
                        <div className="rounded border border-border bg-surface-muted p-1.5">
                          <p className="text-sm font-bold tabular-nums">
                            {fleet.boatsNeeded}
                          </p>
                          <p className="text-[10px] uppercase text-slate-400">Boats</p>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        {PREV_STATUS[plan.status] && (
                          <button
                            type="button"
                            onClick={() => moveTo(plan.id, PREV_STATUS[plan.status]!)}
                            className="flex-1 rounded border border-border px-2 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:text-foreground"
                          >
                            ← Move back
                          </button>
                        )}
                        {NEXT_STATUS[plan.status] && (
                          <button
                            type="button"
                            onClick={() => moveTo(plan.id, NEXT_STATUS[plan.status]!)}
                            className={`flex-1 rounded px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                              plan.status === "in_transit"
                                ? "bg-severity-green-600 text-white hover:bg-severity-green-500"
                                : "bg-accent text-slate-950 hover:bg-sky-300"
                            }`}
                          >
                            {plan.status === "in_transit" ? "Mark Arrived" : "Dispatch"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
