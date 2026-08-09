// ---------------------------------------------------------------------
// components/dashboard/dynamic/CommandCenterChartsLazy.tsx
// Demo-day hardening · Step 10 — performance budget: lazy charts.
//
// Client-only wrapper around the Recharts-heavy CommandCenterCharts so
// the chart bundle (~recharts + d3-shape + …) is split out of the
// initial load. Rendered only on the client (ssr: false), so the chart
// never blocks first paint or the server HTML.
//
// NOTE: `next/dynamic` + `ssr: false` cannot live in the server
// component page (App Router throws for ssr:false in RSC), so this
// wrapper is a tiny client island and the page imports THIS module.
//
// The loading fallback mirrors the three eoc chart cards (label + sub-
// label + h-40 chart area) with roadmap SkeletonLoaders, so the sidebar
// keeps its exact height while the charts stream in — zero layout shift.
// ---------------------------------------------------------------------

"use client";

import dynamic from "next/dynamic";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

function CommandCenterChartsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-eoc border border-border bg-surface p-4">
          <SkeletonLoader height={12} width="45%" />
          <SkeletonLoader height={10} width="30%" className="mt-2" />
          {/* Mirrors the chart's h-40 ResponsiveContainer area */}
          <SkeletonLoader height={160} width="100%" className="mt-3" borderRadius={10} />
        </div>
      ))}
    </div>
  );
}

const CommandCenterCharts = dynamic(() => import("../CommandCenterCharts"), {
  ssr: false,
  loading: () => <CommandCenterChartsSkeleton />,
});

export default CommandCenterCharts;
