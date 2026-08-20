import dynamic from "next/dynamic";

// ---------------------------------------------------------------------
// app/gov/map/compare/page.tsx — Phase 8 · Step 9 · Split-Screen
// Comparison Mode.
//
// "Normal Rainfall" vs "Extreme Scenario" on two synchronized maps
// (50vw each). Loaded client-only (ssr: false) because maplibre-gl
// touches `window` — the codebase-wide convention for map canvases.
// Access is enforced by the middleware's /gov/* crossover guards.
// ---------------------------------------------------------------------

const CompareWorkspace = dynamic(
  () => import("@/components/gov/map/CompareWorkspace"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen w-screen items-center justify-center bg-primary">
        <p className="text-sm text-white/60">Loading comparison view…</p>
      </div>
    ),
  },
);

export default function ComparePage() {
  return <CompareWorkspace />;
}
