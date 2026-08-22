import type { Metadata } from "next";
import ResponseTimeChart from "@/components/admin/ResponseTimeChart";

export const metadata: Metadata = {
  title: "System Health | DRIP Admin",
};

type Status = "green" | "amber" | "red";

const DOT: Record<Status, string> = {
  green: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  amber: "bg-severity-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
  red: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
};

const STATUS_TEXT: Record<Status, string> = {
  green: "text-emerald-400",
  amber: "text-severity-amber-300",
  red: "text-red-400",
};

const SERVICES: {
  name: string;
  host: string;
  status: Status;
  latency: string;
  note: string;
}[] = [
  {
    name: "Supabase DB Connection",
    host: "db.pooler.supabase.com:5432",
    status: "green",
    latency: "24 ms",
    note: "Postgres + PostGIS + pgvector OK",
  },
  {
    name: "OpenWeather API Sync",
    host: "api.openweathermap.org/v3",
    status: "amber",
    latency: "412 ms",
    note: "Last sync 47m ago · 1 stale station",
  },
  {
    name: "Groq NLP Endpoint",
    host: "api.groq.com/openai/v1",
    status: "green",
    latency: "166 ms",
    note: "Tool-calling + classification healthy",
  },
  {
    name: "XGBoost ML Microservice",
    host: "localhost:8000/predict",
    status: "red",
    latency: "timeout",
    note: "Model node unreachable on :8000",
  },
];

export default function SystemHealthPage() {
  const upCount = SERVICES.filter((s) => s.status === "green").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">System Health</h1>
          <p className="mt-1 text-sm text-slate-400">
            IT pipeline monitor — data, DMS, ML, and message pipelines.
          </p>
        </div>
        <div className="rounded-md border border-panel-border bg-panel px-4 py-2 font-mono text-sm text-severity-amber-300">
          {upCount}/{SERVICES.length} SERVICES HEALTHY
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Server rack status */}
        <div className="rounded-lg border border-panel-border bg-panel lg:col-span-2">
          <div className="border-b border-panel-border px-5 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Server Rack · Service Status
            </h2>
          </div>
          <ul className="divide-y divide-panel-divide">
            {SERVICES.map((s) => (
              <li key={s.name} className="flex items-center gap-4 px-5 py-4">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[s.status]}`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {s.name}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-eoc-tiny font-bold uppercase tracking-wider ${
                        s.status === "green"
                          ? "border-emerald-500/40 text-emerald-400"
                          : s.status === "amber"
                            ? "border-severity-amber-500/40 text-severity-amber-300"
                            : "border-red-500/40 text-red-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </p>
                  <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{s.host}</p>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-semibold ${STATUS_TEXT[s.status]}`}>
                    {s.latency}
                  </p>
                  <p className="text-xs text-slate-500">{s.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Response time chart */}
        <div className="rounded-lg border border-panel-border bg-panel">
          <div className="border-b border-panel-border px-5 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              API Response Time
            </h2>
            <p className="mt-1 text-xs text-slate-500">last 24h · p95 latency</p>
          </div>
          <div className="h-56 p-4">
            <ResponseTimeChart />
          </div>
        </div>
      </div>
    </div>
  );
}