"use client";

import dynamic from "next/dynamic";

export type MapAllocation = {
  id: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  category: string;
  quantity: number;
};

const DisasterMap = dynamic(() => import("@/components/map/DisasterMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <p className="eoc-label text-accent">LOADING MAP…</p>
    </div>
  ),
});

export default function AllocationMap({ allocations }: { allocations: MapAllocation[] }) {
  return (
    <DisasterMap
      visibleLayers={{ floodZones: false, shelters: false, resources: false }}
      hoursAhead={24}
      disasterType="flood"
      activeAllocations={allocations}
    />
  );
}
