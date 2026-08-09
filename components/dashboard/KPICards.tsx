"use client";

// ---------------------------------------------------------------------
// components/dashboard/KPICards.tsx — legacy command-center KPI row.
//
// Phase 10 · Step 1 — values count up on load via CountUpNumber.
// Phase 10 · Step 3 (Aug 9, 2026 follow-up) — the People-at-Risk card now
// ALSO subscribes to the demo simulation's drip:demo-sim:people-at-risk
// event (same pattern as HeroKPIs), so the drifting numbers are visible on
// the guest /command-center surface judges actually see during the pitch
// (HeroKPIs alone lives on the admin-only /dashboard route).
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Building2,
  Package,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Translated from "@/components/ui/Translated";
import type { TranslationKey } from "@/lib/i18n/LanguageContext";
import CountUpNumber from "@/components/ui/CountUpNumber";
import {
  DEMO_PEOPLE_AT_RISK_EVENT,
  type PeopleAtRiskBumpEvent,
} from "@/hooks/useDemoSimulation";

type Kpi = {
  id: string;
  labelKey: TranslationKey;
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
    labelKey: "people_at_risk",
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
    labelKey: "shelters_open",
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
    labelKey: "resources_deployed",
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
    labelKey: "active_responders",
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
  // Live People-at-Risk total — { from, value } lets the count-up animate
  // the small demo bumps instead of re-counting from zero (Phase 10 · 3).
  // from starts at 0 so the load still counts up 0 → 48,210 (same as
  // HeroKPIs); the demo bumps then animate from the previous value.
  const [peopleAtRisk, setPeopleAtRisk] = useState(() => {
    const atRisk = KPIS.find((kpi) => kpi.id === "at-risk");
    return { from: 0, value: atRisk?.value ?? 0 };
  });

  useEffect(() => {
    const onBump = (e: Event) => {
      const { delta } = (e as PeopleAtRiskBumpEvent).detail;
      setPeopleAtRisk((k) => ({ from: k.value, value: k.value + delta }));
    };
    window.addEventListener(DEMO_PEOPLE_AT_RISK_EVENT, onBump);
    return () => window.removeEventListener(DEMO_PEOPLE_AT_RISK_EVENT, onBump);
  }, []);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPIS.map((kpi) => {
        const Icon = kpi.icon;
        const TrendIcon = kpi.trendUp ? TrendingUp : TrendingDown;
        const isAtRisk = kpi.id === "at-risk";
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
                <Translated k={kpi.labelKey} />
              </p>
              <p className="mt-0.5 text-3xl font-black tabular-nums leading-none text-foreground">
                <CountUpNumber
                  value={isAtRisk ? peopleAtRisk.value : kpi.value}
                  from={isAtRisk ? peopleAtRisk.from : 0}
                />
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
