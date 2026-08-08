import type { Metadata } from "next";
import { prisma } from "@/server/prisma";
import AlertHistoryTable from "@/components/dashboard/AlertHistoryTable";
import Translated from "@/components/ui/Translated";

export const metadata: Metadata = {
  title: "Alert History | Disaster Response",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

// Hardcoded demo fallback so the page still renders perfectly when the
// database isn't reachable yet (e.g. Prisma "Can't reach database server").
const MOCK_ALERTS: Array<{
  id: string;
  severity: string;
  channel: string;
  message: string;
  district: string | null;
  isAcknowledged: boolean;
  acknowledgedBy: string | null;
  createdAt: Date;
  acknowledgedAt: Date | null;
}> = [
  {
    id: "mock-crit-ganga",
    severity: "critical",
    channel: "sms",
    message:
      "CRITICAL: Imminent flooding of low-lying areas near the Ganga in Patna. Evacuate to higher ground now.",
    district: "Patna (Ganga)",
    isAcknowledged: false,
    acknowledgedBy: null,
    createdAt: new Date(),
    acknowledgedAt: null,
  },
  {
    id: "mock-warn-periyar",
    severity: "warning",
    channel: "sms",
    message:
      "Warning: Rising river levels along the Periyar in Ernakulam. Avoid riverbanks and low-lying roads.",
    district: "Ernakulam (Periyar)",
    isAcknowledged: true,
    acknowledgedBy: "District Control Room",
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    acknowledgedAt: new Date(Date.now() - 40 * 60 * 1000),
  },
  {
    id: "mock-info-brahmaputra",
    severity: "info",
    channel: "inapp",
    message:
      "Advisory: Monsoon rainfall expected to intensify over Kamrup in the next 24 hours. Monitor official updates.",
    district: "Kamrup (Brahmaputra)",
    isAcknowledged: false,
    acknowledgedBy: null,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    acknowledgedAt: null,
  },
];

export default async function AlertsPage() {
  let rows: Array<{
    id: string;
    severity: string;
    channel: string;
    message: string;
    district: string | null;
    isAcknowledged: boolean;
    acknowledgedBy: string | null;
    createdAt: Date;
    acknowledgedAt: Date | null;
  }> = MOCK_ALERTS;

  try {
    const result = await prisma.alertLog.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
    });
    rows = result;
  } catch {
    console.warn(
      "[alerts] Database unavailable — falling back to mock data. If the DB is merely slow, the alert simulator writes real rows via the API route instead.",
    );
  }

  const alerts = rows.map((alert) => ({
    id: alert.id,
    severity: alert.severity,
    channel: alert.channel,
    message: alert.message,
    district: alert.district,
    isAcknowledged: alert.isAcknowledged,
    acknowledgedBy: alert.acknowledgedBy,
    createdAt: alert.createdAt.toISOString(),
    acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
  }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eoc-label text-accent">
            <Translated k="command_center" />
          </p>
          <h1 className="text-2xl font-bold">
            <Translated k="alert_history" /> &amp; Dispatch Log
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Emergency communications issued to the response network.
          </p>
        </div>
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {alerts.length} recorded {alerts.length === 1 ? "entry" : "entries"}
        </p>
      </header>

      <section className="mt-6">
        <AlertHistoryTable alerts={alerts} />
      </section>
    </main>
  );
}
