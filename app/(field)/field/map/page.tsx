import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Phase 14 · Step 8 — route-aware navigation map. Loaded client-only
// (maplibre-gl touches `window` — the codebase-wide map convention).
const FieldRouteMap = dynamic(
  () => import("@/components/field/FieldRouteMap"),
  { ssr: false, loading: () => <p className="p-8 text-center text-lg text-gray-400">Loading map…</p> },
);

export const metadata: Metadata = {
  title: "Field Navigation | Field",
};

export default function FieldMapPage() {
  return <FieldRouteMap />;
}
