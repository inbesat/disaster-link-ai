"use client";

// ---------------------------------------------------------------------
// components/public/transparency/PublicFloodChartLazy.tsx — client
// wrapper that lazy-loads the Recharts FloodChartWidget on demand so
// the (~110 kB) charting library stays out of the public dashboard's
// initial bundle. The chart uses mock 72-hour data only — no API.
// ---------------------------------------------------------------------

import dynamic from "next/dynamic";

const LazyFloodChart = dynamic(
  () => import("@/components/gov/dashboard/FloodChartWidget"),
  {
    ssr: false,
    loading: () => (
      <section className="flex h-72 flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
        <span className="h-4 w-44 animate-pulse rounded bg-white/10" />
        <span className="mt-4 h-52 w-full animate-pulse rounded bg-white/5" />
      </section>
    ),
  },
);

export default function PublicFloodChartLazy() {
  return <LazyFloodChart />;
}
