"use client";

import { Waves, Construction, Home, LifeBuoy, type LucideIcon } from "lucide-react";

export type ReportType = "flooding" | "road_blocked" | "shelter_needed" | "rescue";

interface IssueStat {
  type: ReportType;
  label: string;
  count: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

const MOCK_ISSUES: Omit<IssueStat, "icon" | "label" | "colorClass" | "bgClass">[] = [
  { type: "flooding", count: 142 },
  { type: "road_blocked", count: 89 },
  { type: "shelter_needed", count: 45 },
  { type: "rescue", count: 12 },
];

const ISSUE_META: Record<
  ReportType,
  { label: string; icon: LucideIcon; colorClass: string; bgClass: string }
> = {
  flooding: {
    label: "Flooding",
    icon: Waves,
    colorClass: "text-severity-blue-400",
    bgClass: "bg-severity-blue-500",
  },
  road_blocked: {
    label: "Road Blocked",
    icon: Construction,
    colorClass: "text-severity-amber-400",
    bgClass: "bg-severity-amber-500",
  },
  shelter_needed: {
    label: "Shelter Needed",
    icon: Home,
    colorClass: "text-severity-green-400",
    bgClass: "bg-severity-green-500",
  },
  rescue: {
    label: "Rescue Required",
    icon: LifeBuoy,
    colorClass: "text-severity-red-400",
    bgClass: "bg-severity-red-500",
  },
};

export default function TrendingIssuesWidget() {
  const issues: IssueStat[] = MOCK_ISSUES.map((issue) => ({
    ...issue,
    ...ISSUE_META[issue.type],
  })).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...issues.map((i) => i.count));

  return (
    <div className="eoc-panel p-5 bg-secondary text-primary">
      <p className="eoc-label mb-4 text-accent uppercase tracking-wider text-xs font-semibold">
        Trending Issues
      </p>

      <ul className="space-y-4">
        {issues.map((issue) => {
          const Icon = issue.icon;
          const percentage = Math.max(5, Math.round((issue.count / maxCount) * 100));

          return (
            <li key={issue.type} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${issue.colorClass}`} aria-hidden="true" />
                  <span className="font-medium text-secondary">{issue.label}</span>
                </div>
                <span className="font-semibold text-primary">{issue.count}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)] opacity-80">
                <div
                  className={`h-full rounded-full ${issue.bgClass} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
