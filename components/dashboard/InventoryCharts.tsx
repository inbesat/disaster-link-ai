"use client";

import { useEffect, useState } from "react";
import { useChartVisibility } from "@/lib/perf/chart-utils";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { getInventory, type InventoryResource } from "@/app/actions/resources";

const CATEGORY_COLORS: Record<string, string> = {
  boat: "#38bdf8",
  medical: "#f472b6",
  food: "#fbbf24",
  water: "#60a5fa",
  personnel: "#a78bfa",
  vehicle: "#34d399",
  communication: "#22d3ee",
  power: "#fb923c",
};

const STATUS_COLORS: Record<string, string> = {
  available: "#34d399",
  deployed: "#fbbf24",
  maintenance: "#f87171",
};

type CategorySlice = { name: string; value: number };
type CategoryBars = {
  category: string;
  available: number;
  deployed: number;
  maintenance: number;
};

/** Aggregate resources into category → slice / status-stacked shapes. */
function buildChartData(
  resources: { category: string; quantity: number; status: string }[],
) {
  const buckets: Record<string, CategoryBars> = {};
  for (const r of resources) {
    const key = r.category;
    const bucket = buckets[key] ?? {
      category: r.category,
      available: 0,
      deployed: 0,
      maintenance: 0,
    };
    if (r.status === "deployed") bucket.deployed += r.quantity;
    else if (r.status === "maintenance") bucket.maintenance += r.quantity;
    else bucket.available += r.quantity;
    buckets[key] = bucket;
  }
  const bars: CategoryBars[] = Object.values(buckets).map((b) => ({
    ...b,
    category: b.category.charAt(0).toUpperCase() + b.category.slice(1),
  }));
  const pie: CategorySlice[] = bars.map((b) => ({
    name: b.category,
    value: b.available + b.deployed + b.maintenance,
  }));
  return { pie, bars };
}

export default function InventoryCharts() {
  const [pie, setPie] = useState<CategorySlice[]>([]);
  const [bars, setBars] = useState<CategoryBars[]>([]);
  const isTabVisible = useChartVisibility();

  useEffect(() => {
    let active = true;
    getInventory()
      .then((rows) => {
        if (!active) return;
        const { pie: p, bars: b } = buildChartData(rows as InventoryResource[]);
        setPie(p);
        setBars(b);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const sliceColor = (name: string) => CATEGORY_COLORS[name.toLowerCase()] ?? "#94a3b8";

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-eoc border border-border bg-surface p-5">
        <p className="eoc-label text-accent">RESOURCES BY CATEGORY</p>
        <h3 className="mt-1 text-sm font-bold">Inventory Composition</h3>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pie}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={88}
                paddingAngle={2}
                stroke="#0b0f19"
                isAnimationActive={isTabVisible}
              >
                {pie.map((entry) => (
                  <Cell key={entry.name} fill={sliceColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0b0f19",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-eoc border border-border bg-surface p-5">
        <p className="eoc-label text-accent">AVAILABILITY BY CATEGORY</p>
        <h3 className="mt-1 text-sm font-bold">Available vs Deployed</h3>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="category"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
              />
              <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "#0b0f19",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Bar
                dataKey="available"
                stackId="a"
                fill={STATUS_COLORS.available}
                name="Available"
                isAnimationActive={isTabVisible}
              />
              <Bar
                dataKey="deployed"
                stackId="a"
                fill={STATUS_COLORS.deployed}
                name="Deployed"
                isAnimationActive={isTabVisible}
              />
              <Bar
                dataKey="maintenance"
                stackId="a"
                fill={STATUS_COLORS.maintenance}
                name="Maintenance"
                isAnimationActive={isTabVisible}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
