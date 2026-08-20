import dynamic from "next/dynamic";

// ---------------------------------------------------------------------
// app/gov/map/page.tsx — Phase 8 · Step 1 · Full-Screen Gov Map
// Workspace.
//
// A dedicated, full-screen map workspace (h-screen w-screen, no
// dashboard chrome). This route lives OUTSIDE the /gov/dashboard layout
// (which wraps pages in the DashboardShell sidebar + nav), so the map
// owns the entire viewport with zero chrome. Gov access is enforced by
// the middleware's /gov/* crossover guards — the same cookie that lets
// officials into /gov/dashboard.
//
// GovMapWorkspace is loaded client-only (ssr: false) because
// maplibre-gl touches `window` — the codebase-wide convention for map
// canvases.
// ---------------------------------------------------------------------

const GovMapWorkspace = dynamic(() => import("@/components/gov/map/GovMapWorkspace"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-primary">
      <p className="text-sm text-white/60">Loading operations map…</p>
    </div>
  ),
});

export default function GovMapPage() {
  return <GovMapWorkspace />;
}
