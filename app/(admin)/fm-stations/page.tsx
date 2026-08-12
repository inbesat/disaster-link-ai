import type { Metadata } from "next";
import FmStationsManager from "@/components/admin/fm/FmStationsManager";

export const metadata: Metadata = {
  title: "FM Stations | DRIP Admin",
};

export default function FmStationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          FM Radio Stations
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          FM Radio Emergency Broadcasting · Phase 1 — station registry with
          geospatial coverage. AIR stations lead broadcasts (mandatory EWS
          obligation), private stations follow by reach. Click the map to test
          which stations cover a disaster point.
        </p>
      </div>

      <FmStationsManager />
    </div>
  );
}
