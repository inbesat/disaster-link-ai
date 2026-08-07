import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deployment Map | Field",
};

export default function FieldMapPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-300">Deployment Map</h1>
      <div className="flex min-h-[60vh] items-center justify-center rounded-xl border-2 border-dashed border-[#1c2740] bg-[#0d1526] p-8 text-center">
        <p className="text-lg text-gray-400">
          Live deployment map for field responders arrives in a later Phase 19 step.
        </p>
      </div>
    </div>
  );
}