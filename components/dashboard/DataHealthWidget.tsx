import { prisma } from "@/server/prisma";
import RefreshDataButton from "@/components/dashboard/RefreshDataButton";

export const dynamic = "force-dynamic";

const STATUS_META = {
  green: {
    label: "Active",
    dot: "bg-severity-green-500",
    text: "text-severity-green-400",
  },
  amber: {
    label: "Stale",
    dot: "bg-severity-amber-500",
    text: "text-severity-amber-400",
  },
  red: {
    label: "Degraded",
    dot: "bg-severity-red-500",
    text: "text-severity-red-400",
  },
} as const;

type SourceHealth = {
  name: string;
  status: string;
  lastFetchTime: Date | null;
};

const MOCK_SOURCES: SourceHealth[] = [
  { name: "OpenWeatherMap", status: "green", lastFetchTime: new Date() },
  {
    name: "Open-Meteo Flood",
    status: "amber",
    lastFetchTime: new Date(Date.now() - 45 * 60 * 1000),
  },
];

export default async function DataHealthWidget() {
  let sources: SourceHealth[] = [];

  try {
    sources = await prisma.dataSource.findMany({ orderBy: { name: "asc" } });
  } catch {
    // Database not connected yet — fall back to mock so the UI still renders.
    sources = MOCK_SOURCES;
  }

  const latestFetch = sources.reduce<Date | null>((latest, source) => {
    if (!source.lastFetchTime) return latest;
    const date = new Date(source.lastFetchTime);
    return latest === null || date > latest ? date : latest;
  }, null);

  const lastUpdatedMins = latestFetch
    ? Math.max(0, Math.round((Date.now() - latestFetch.getTime()) / 60000))
    : null;

  return (
    <div className="eoc-panel p-5">
      <p className="eoc-label mb-3 text-accent">DATA PIPELINE HEALTH</p>

      <ul className="space-y-3">
        {sources.map((source) => {
          const meta =
            STATUS_META[source.status as keyof typeof STATUS_META] ?? STATUS_META.amber;
          return (
            <li key={source.name} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                <span className="text-sm font-medium text-slate-200">{source.name}</span>
              </div>
              <span className={`text-xs font-semibold uppercase ${meta.text}`}>
                {meta.label}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-slate-500">
        {lastUpdatedMins === null
          ? "No fetch recorded yet"
          : `Last updated: ${lastUpdatedMins} min${lastUpdatedMins === 1 ? "" : "s"} ago`}
      </p>

      <div className="mt-4">
        <RefreshDataButton />
      </div>
    </div>
  );
}
