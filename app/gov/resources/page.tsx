"use client";

// ---------------------------------------------------------------------
// app/gov/resources/page.tsx — Phase 10 · Steps 1–2 · Resource Inventory.
//
// The logistics backbone for the Command Center: a full-page, dark-themed
// inventory workspace with a top-right toggle switching between the
// TanStack data table (Step 1) and the MapLibre map view (Step 2).
//
// ResourceMap is loaded client-only (ssr: false) — maplibre-gl touches
// `window`, the codebase-wide convention for map canvases.
// ---------------------------------------------------------------------

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { LayoutGrid, Map as MapIcon, ShieldCheck, Boxes } from "lucide-react";
import InventoryTable from "@/components/gov/resources/InventoryTable";
import {
  CATEGORY_META,
  RESOURCE_INVENTORY,
  STATUS_META,
  resourcesByStatus,
  type ResourceCategory,
  type ResourceStatus,
} from "@/lib/mock-data/resource-inventory";

const ResourceMap = dynamic(() => import("@/components/gov/resources/ResourceMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-white/10 bg-secondary">
      <p className="text-sm text-white/60">Loading resource map…</p>
    </div>
  ),
});

type ViewMode = "table" | "map";

const VIEW_TABS: Array<{ mode: ViewMode; label: string; icon: typeof LayoutGrid }> = [
  { mode: "table", label: "Table View", icon: LayoutGrid },
  { mode: "map", label: "Map View", icon: MapIcon },
];

/** Top-right segmented toggle: Table View ⇄ Map View. */
function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Resource view"
      className="flex rounded-lg border border-white/10 bg-white/5 p-1"
    >
      {VIEW_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = mode === tab.mode;
        return (
          <button
            key={tab.mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.mode)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              active
                ? "bg-accent-purple text-white shadow-[0_2px_10px_rgba(139,92,246,0.45)]"
                : "text-muted hover:text-white"
            }`}
          >
            <Icon aria-hidden className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function GovResourcesPage() {
  const [mode, setMode] = useState<ViewMode>("table");

  // Per-status counts for the summary strip (available / deployed / maintenance).
  const counts = useMemo(() => {
    const byStatus: Record<ResourceStatus, number> = {
      available: resourcesByStatus("available").length,
      deployed: resourcesByStatus("deployed").length,
      maintenance: resourcesByStatus("maintenance").length,
    };
    const byCategory = Object.keys(CATEGORY_META) as ResourceCategory[];
    const total = RESOURCE_INVENTORY.length;
    return { byStatus, byCategory, total };
  }, []);

  return (
    <main className="min-h-screen bg-primary text-foreground">
      <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6">
        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eoc-label text-accent-purple">
              BIHAR · DISTRICT RESOURCES · LIVE
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Resource Inventory
            </h1>
            <p className="mt-1 text-sm text-muted">
              District-wide assets, assignments &amp; readiness
            </p>
          </div>

          {/* Step 2 — top-right Table/Map toggle */}
          <ViewToggle mode={mode} onChange={setMode} />
        </div>

        {/* Summary strip — per-category totals + status chips */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-purple/40 bg-accent-purple/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-purple">
            <Boxes aria-hidden className="h-3.5 w-3.5" />
            {counts.total} assets
          </span>
          {counts.byCategory.map((category) => (
            <span
              key={category}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300"
            >
              <span aria-hidden>{CATEGORY_META[category].emoji}</span>
              {CATEGORY_META[category].label}
            </span>
          ))}
        </div>

        {/* Status legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {(Object.keys(STATUS_META) as ResourceStatus[]).map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300"
            >
              <span
                aria-hidden
                className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`}
              />
              {STATUS_META[status].label}
              <span className="font-mono text-muted">{counts.byStatus[status]}</span>
            </span>
          ))}
        </div>

        {/* Step 1 / Step 2 — table or map */}
        <div className="mt-5 min-h-0">
          {mode === "table" ? (
            <InventoryTable />
          ) : (
            <div className="h-[calc(100vh-320px)] min-h-[420px]">
              <ResourceMap />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 border-t border-white/10 py-5">
        <p className="flex items-center justify-center gap-2 px-4 text-center text-xs text-muted">
          <ShieldCheck aria-hidden className="h-3.5 w-3.5 text-accent-purple" />
          Authorized personnel only · All access is logged &amp; audited
        </p>
      </footer>
    </main>
  );
}
