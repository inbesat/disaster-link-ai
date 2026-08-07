import {
  Building2,
  Package,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

type Kpi = {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
  iconColor: string;
  iconBg: string;
  trendColor: string;
};

const KPIS: Kpi[] = [
  {
    id: "at-risk",
    label: "People at Risk",
    value: 48210,
    icon: Users,
    trend: "+12%",
    trendUp: true,
    iconColor: "text-severity-red-400",
    iconBg: "bg-severity-red-500/10",
    trendColor: "text-severity-red-400",
  },
  {
    id: "shelters",
    label: "Shelters Open",
    value: 132,
    icon: Building2,
    trend: "+4%",
    trendUp: true,
    iconColor: "text-severity-green-400",
    iconBg: "bg-severity-green-500/10",
    trendColor: "text-severity-green-400",
  },
  {
    id: "deployed",
    label: "Resources Deployed",
    value: 1847,
    icon: Package,
    trend: "-3%",
    trendUp: false,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-500/10",
    trendColor: "text-sky-400",
  },
  {
    id: "responders",
    label: "Active Responders",
    value: 863,
    icon: ShieldAlert,
    trend: "+8%",
    trendUp: true,
    iconColor: "text-severity-amber-400",
    iconBg: "bg-severity-amber-500/10",
    trendColor: "text-severity-green-400",
  },
];

export default function KPICards() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPIS.map((kpi) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trendUp ? TrendingUp : TrendingDown;
        return (
          <div
            key={kpi.id}
            className="flex items-start gap-3 rounded-eoc border border-border bg-surface p-4"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${kpi.iconBg}`}
            >
              <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {kpi.label}
              </p>
              <p className="mt-0.5 text-3xl font-black tabular-nums leading-none text-foreground">
                {kpi.value.toLocaleString()}
              </p>
              <p
                className={`mt-1 inline-flex items-center gap-1 text-[11px] font-semibold ${kpi.trendColor}`}
              >
                <TrendIcon className="h-3 w-3" />
                {kpi.trend}{" "}
                <span className="font-normal text-slate-500">since yesterday</span>
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
