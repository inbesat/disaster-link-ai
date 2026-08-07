import type { Metadata } from "next";
import DistrictConfigForm from "@/components/admin/DistrictConfigForm";

export const metadata: Metadata = {
  title: "District Config | DRIP Admin",
};

export default function DistrictsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">District Config</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tune flood thresholds and alert behavior per district. Different
          districts have different river beds and drainage — set each risk
          boundary explicitly.
        </p>
      </div>

      <DistrictConfigForm />
    </div>
  );
}