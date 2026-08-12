import type { Metadata } from "next";
import FmBroadcastHistory from "@/components/admin/broadcast/FmBroadcastHistory";

export const metadata: Metadata = {
  title: "Broadcast History | DRIP Admin",
};

export default function BroadcastHistoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          FM Broadcast History
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Phase 8 · compliance archive — every CAP alert with per-station delivery
          certificates, tamper-proofing hashes, archived audio, and CSV export for
          DDMA/MIB reporting.
        </p>
      </div>

      <FmBroadcastHistory />
    </div>
  );
}
