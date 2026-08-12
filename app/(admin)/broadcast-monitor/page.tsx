import type { Metadata } from "next";
import FmBroadcastMonitor from "@/components/admin/broadcast/FmBroadcastMonitor";

export const metadata: Metadata = {
  title: "Broadcast Monitor | DRIP Admin",
};

export default function BroadcastMonitorPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          FM Broadcast Monitor
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          FM Radio Emergency Broadcasting · Phase 5 — live status of every station
          contact: API Push → RDS → FTP → Email → IVR Call → Confirmed. Force a
          control-room call from any station row.
        </p>
      </div>

      <FmBroadcastMonitor />
    </div>
  );
}
