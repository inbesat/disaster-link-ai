"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import type { GroundReport } from "@/lib/crowdsourced/report";
import { redactReportText } from "@/lib/security/sanitize";

// ---------------------------------------------------------------------
// components/dashboard/TrendingIssues.tsx (Phase 17 Step 8)
// A small sidebar widget that ranks the most common disaster issues spoken
// about in recent citizen ground reports, with a mini sparkline per hit
// showing whether the issue is trending up or down over the recent window.
// ---------------------------------------------------------------------

type TrendingIssuesProps = {
  reports?: GroundReport[];
  /** Optional explicit per-issue counts, e.g. { food: 42, power: 28 }. */
  customIssues?: Record<string, number>;
};

/** Words/phrases to collapse into a ranked issue label. */
const ISSUE_KEYWORDS: Array<{ label: string; terms: string[] }> = [
  { label: "Food Shortage", terms: ["food", "khana", "ration", "starv", "hunger"] },
  { label: "Power Outage", terms: ["power", "electric", "bijli", "blackout", "light"] },
  { label: "Water Logging", terms: ["water", "paani", "logging", "flood", "drowning"] },
  { label: "Road Blocked", terms: ["road", "rasta", "blocked", "jam", "landslide"] },
  { label: "Shelter Needed", terms: ["shelter", "panaah", "roof", "homeless"] },
  { label: "Medical Emergency", terms: ["medical", "hospital", "doctor", "medicine", "dawa"] },
  { label: "Rescue Needed", terms: ["rescue", "bachao", "trapped", "stuck", "catch"] },
];

type TrendingIssue = {
  label: string;
  count: number;
  color: string;
  /** Recent count series per bucket — drives the sparkline + trend. */
  series: number[];
  trend: "up" | "down" | "flat";
};

const BUCKETS = 8; // 8 time-slices across the recent window

// Stable color per issue for consistent charts.
const ISSUE_COLORS = [
  "#f59e0b", // amber
  "#38bdf8", // sky
  "#3b82f6", // blue
  "#ef4444", // red
  "#a855f7", // purple
  "#10b981", // green
  "#eab308", // yellow
];

function tokenize(report: GroundReport): string {
  // Phase 21 · redact PII before keyword extraction so phones/emails in
  // reports can never surface as trending topics.
  return redactReportText(report.raw_text ?? report.summary ?? "").toLowerCase();
}

function matchIssue(report: GroundReport, issue: { label: string; terms: string[] }): boolean {
  const text = tokenize(report);
  return issue.terms.some((term) => text.includes(term));
}

/**
 * Estimate a per-issue time series by bucketing reports (with their
 * createdAt — or the mock ids) into fixed slices over the recent window.
 */
function buildIssueSeries(
  reports: GroundReport[],
  issue: { label: string; terms: string[] },
  now: number,
): number[] {
  const bucketMs = 60_000;
  const series = new Array<number>(BUCKETS).fill(0);
  for (const r of reports) {
    if (!matchIssue(r, issue)) continue;
    const t = r.created_at ? Date.parse(r.created_at) : now;
    if (Number.isNaN(t)) continue;
    const idx = Math.min(
      BUCKETS - 1,
      Math.max(0, BUCKETS - 1 - Math.floor((now - t) / bucketMs)),
    );
    series[idx] += 1;
  }
  return series;
}

function determineTrend(series: number[]): "up" | "down" | "flat" {
  const half = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, half).reduce((a, b) => a + b, 0);
  const secondHalf = series.slice(half).reduce((a, b) => a + b, 0);
  if (secondHalf > firstHalf) return "up";
  if (secondHalf < firstHalf) return "down";
  return "flat";
}

export default function TrendingIssues({
  reports = [],
  customIssues = undefined,
}: TrendingIssuesProps) {
  const now = useMemo(() => Date.now(), []);

  const items = useMemo<TrendingIssue[]>(() => {
    // If explicit counts are provided, prefer them (no reports needed).
    if (customIssues) {
      return Object.entries(customIssues)
        .map(([label, count], i) => ({
          label,
          count,
          color: ISSUE_COLORS[i % ISSUE_COLORS.length],
          series: [count * 0.6, count * 0.8, count], // synthetic upward shape for demo
          trend: "up" as const,
        }))
        .sort((a, b) => b.count - a.count);
    }

    // Default path: rank issues by match count over the passed reports.
    return ISSUE_KEYWORDS.map((issue, i) => {
      const matched = reports.filter((r) => matchIssue(r, issue));
      if (matched.length === 0) return null;
      const series = buildIssueSeries(matched, issue, now);
      return {
        label: issue.label,
        count: matched.length,
        color: ISSUE_COLORS[i % ISSUE_COLORS.length],
        series,
        trend: determineTrend(series),
      };
    })
      .slice(0, BUCKETS)
      .filter((x): x is TrendingIssue => x !== null)
      .sort((a, b) => b.count - a.count);
  }, [reports, customIssues, now]);

  const maxCount = items.length ? items[0].count : 0;

  return (
    <div className="eoc-panel p-4">
      <div className="flex items-center justify-between">
        <p className="eoc-label text-accent">TRENDING ISSUES</p>
        <Activity className="h-4 w-4 text-accent" />
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">
          No recent ground reports to rank.
        </p>
      ) : (
        <ol className="mt-4 space-y-3.5">
          {items.map((item, index) => (
            <li key={item.label} className="group">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm">
                  <span className="font-mono text-eoc-tiny text-slate-500">
                    {index + 1}.
                  </span>
                  <span className="font-semibold text-foreground">{item.label}</span>
                  <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-eoc-tiny font-bold text-slate-300">
                    {item.count}
                    <span className="ml-0.5 text-slate-500">
                      {item.count === 1 ? "report" : "reports"}
                    </span>
                  </span>
                </span>
                {item.trend === "up" ? (
                  <span className="flex items-center gap-1 text-eoc-tiny font-bold uppercase text-severity-green-400">
                    <TrendingUp className="h-3.5 w-3.5" /> Up
                  </span>
                ) : item.trend === "down" ? (
                  <span className="flex items-center gap-1 text-eoc-tiny font-bold uppercase text-severity-red-400">
                    <TrendingDown className="h-3.5 w-3.5" /> Down
                  </span>
                ) : (
                  <span className="text-eoc-tiny font-bold uppercase text-slate-400">
                    Steady
                  </span>
                )}
              </div>

              {/* Relative frequency bar */}
              <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>

              {/* Mini sparkline */}
              <div className="mt-1 h-8 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={item.series.map((v, i) => ({ i, v }))}>
                    <Tooltip
                      content={({ payload, label }) => (
                        <div className="rounded border border-border bg-surface-elevated px-2 py-1 text-eoc-tiny text-slate-300">
                          ago {String(label)}:{" "}
                          <span className="font-bold">{payload?.[0]?.value}</span>
                        </div>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={item.color}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}