import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | DRIP",
};

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          System-wide control for super administrators.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Users", value: "42" },
          { label: "Districts Configured", value: "3" },
          { label: "Open Alerts", value: "1" },
          { label: "ML Service Status", value: "Healthy" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-[#1c2740] bg-[#0b1120] p-5"
          >
            <p className="text-xs uppercase tracking-wider text-slate-500">{kpi.label}</p>
            <p className="mt-2 text-xl font-semibold text-amber-300">{kpi.value}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-slate-500">
        This demo shell will be expanded as the Admin Control Panel phase progresses.
      </p>
    </div>
  );
}