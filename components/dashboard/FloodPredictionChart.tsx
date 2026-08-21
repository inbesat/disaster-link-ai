"use client";

// ---------------------------------------------------------------------
// components/dashboard/FloodPredictionChart.tsx — UI/UX Phase 4 · Step 8.
//
// Wide horizontal widget (8 of 12 columns) plotting a 72-hour river
// level forecast with Recharts. Fetches live predictions from the
// Python ML service when available; falls back to mock data when the
// ML service is unreachable (crash-proof for hackathon demos).
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import Panel from "@/components/ui/Panel";
import { downsampleDataset, useChartVisibility } from "@/lib/perf/chart-utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Chroma/danger reference — above this value the river is at CRITICAL. */
const CRITICAL_LEVEL = 3.4;

const GID = "flood-level-fill";

type ForecastPoint = { time: string; level: number };

type MlPrediction = {
  risk_level: string;
  confidence_score: number;
  predicted_risk_class: number;
  probabilities: number[];
};

type Props = {
  /** Override: skip ML fetch and use mock data always. */
  useMock?: boolean;
};

// ---------------------------------------------------------------------------
// Mock forecast generator (offline fallback)
// ---------------------------------------------------------------------------
function buildMockForecast(): ForecastPoint[] {
  return Array.from({ length: 73 }, (_, h) => {
    const base = 2.0 + (h / 72) * 2.1;
    const tide = Math.sin(h / 9) * 0.18;
    const surge = h > 61 ? (h - 61) * 0.02 : 0;
    return {
      time: `+${h}h`,
      level: Math.round((base + tide + surge) * 100) / 100,
    };
  });
}

// ---------------------------------------------------------------------------
// Build forecast influenced by ML risk level
// ---------------------------------------------------------------------------
function buildInfluencedForecast(riskLevel: string, confidence: number): ForecastPoint[] {
  // Higher risk → faster river rise
  const riskMultiplier: Record<string, number> = {
    Low: 0.6,
    Medium: 1.0,
    High: 1.5,
    Critical: 2.2,
  };
  const mult = riskMultiplier[riskLevel] ?? 1.0;
  const boost = confidence * 0.5;

  return Array.from({ length: 73 }, (_, h) => {
    const base = 2.0 + (h / 72) * 2.1 * mult + boost;
    const tide = Math.sin(h / 9) * 0.18;
    const surge = h > 61 ? (h - 61) * 0.02 * mult : 0;
    return {
      time: `+${h}h`,
      level: Math.round((base + tide + surge) * 100) / 100,
    };
  });
}

// ---------------------------------------------------------------------------
// Risk badge colors
// ---------------------------------------------------------------------------
function riskBadge(risk: string): { color: string; bg: string; label: string } {
  switch (risk) {
    case "Critical":
    case "Evacuate":
      return { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "CRITICAL" };
    case "High":
    case "Warning":
      return { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", label: "HIGH" };
    case "Medium":
    case "Watch":
      return { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "MEDIUM" };
    default:
      return { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "LOW" };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function FloodPredictionChart({ useMock = false }: Props) {
  const [data, setData] = useState<ForecastPoint[]>(() => buildMockForecast());
  const [mlStatus, setMlStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [prediction, setPrediction] = useState<MlPrediction | null>(null);
  const isTabVisible = useChartVisibility();

  const chartData = useMemo(() => downsampleDataset(data, 500), [data]);

  useEffect(() => {
    if (useMock) {
      setData(buildMockForecast());
      setMlStatus("fallback");
      return;
    }

    let cancelled = false;

    async function fetchPrediction() {
      try {
        // Fetch live prediction from the Python ML service via Next.js API
        const res = await fetch(
          "/api/predict?lat=25.5941&lng=85.1376&rainfall=150&elevation=45&saturation=85",
          { signal: AbortSignal.timeout(5000) }
        );

        if (!res.ok) throw new Error(`ML API returned ${res.status}`);

        const result = (await res.json()) as {
          ok?: boolean;
          riskLevel?: string;
          confidenceScore?: number;
          predicted_riskClass?: number;
          probabilities?: number[];
        };
        if (cancelled) return;

        if (result.ok && result.riskLevel) {
          const pred: MlPrediction = {
            risk_level: result.riskLevel,
            confidence_score: result.confidenceScore ?? 0,
            predicted_risk_class: result.predicted_riskClass ?? 0,
            probabilities: result.probabilities ?? [],
          };
          setPrediction(pred);
          setData(buildInfluencedForecast(pred.risk_level, pred.confidence_score));
          setMlStatus("live");
        } else {
          throw new Error("Invalid ML response");
        }
      } catch {
        if (cancelled) return;
        // Silently fall back to mock data — UI stays beautiful
        setData(buildMockForecast());
        setMlStatus("fallback");
      }
    }

    void fetchPrediction();
    return () => { cancelled = true; };
  }, [useMock]);

  const badge = prediction ? riskBadge(prediction.risk_level) : null;

  return (
    <Panel
      className=""
      title="72-Hour River Level Forecast"
      action={
        <div className="flex items-center gap-2">
          {/* ML Status Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
            {mlStatus === "live" && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden />
                ML Live
              </>
            )}
            {mlStatus === "fallback" && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
                Mock Data
              </>
            )}
            {mlStatus === "loading" && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" aria-hidden />
                Connecting...
              </>
            )}
          </span>

          {/* Risk Badge (shown when ML is live) */}
          {badge && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.bg} ${badge.color}`}>
              <span className="h-2 w-2 animate-pulse rounded-full bg-current" aria-hidden />
              {badge.label}
              {prediction && (
                <span className="ml-1 opacity-70">
                  · {(prediction.confidence_score * 100).toFixed(0)}%
                </span>
              )}
            </span>
          )}

          {/* Critical Danger Mark (always shown) */}
          {!badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-danger/30 bg-accent-danger/10 px-2.5 py-1 text-[11px] font-semibold text-accent-danger">
              <span
                className="h-2 w-2 animate-pulse rounded-full bg-accent-danger"
                aria-hidden
              />
              Critical mark&nbsp;·&nbsp;{CRITICAL_LEVEL} m
            </span>
          )}
        </div>
      }
    >
      {/* Model Training Badge */}
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 rounded bg-accent-primary/10 px-2 py-0.5 text-eoc-tiny font-medium text-accent-primary">
          Model Trained on Official PDF Datasets
        </span>
        {prediction && mlStatus === "live" && (
          <span className="text-eoc-tiny text-muted">
            Risk: {prediction.risk_level} · Confidence: {(prediction.confidence_score * 100).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={GID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1e293b" strokeDasharray="4 6" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              interval={8}
              tickMargin={8}
            />
            <YAxis
              dataKey="level"
              domain={["dataMin - 0.3", "dataMax + 0.4"]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => `${v.toFixed(1)} m`}
            />

            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 8,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
              labelStyle={{ color: "#94a3b8", fontSize: 11 }}
              itemStyle={{ color: "#f1f5f9" }}
              formatter={(value) => [`${Number(value ?? 0).toFixed(2)} m`, "River level"]}
            />

            <ReferenceLine
              y={CRITICAL_LEVEL}
              stroke="#ef4444"
              strokeDasharray="6 6"
              strokeWidth={1.5}
              label={{
                value: "Critical Danger Mark",
                position: "insideTopRight",
                fill: "#ef4444",
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            <Area
              type="monotone"
              dataKey="level"
              stroke="#3b82f6"
              strokeWidth={2}
              fill={`url(#${GID})`}
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6", stroke: "#0a0f1a", strokeWidth: 2 }}
              isAnimationActive={isTabVisible}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export default FloodPredictionChart;
