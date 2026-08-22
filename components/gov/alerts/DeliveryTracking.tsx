"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/DeliveryTracking.tsx — Delivery Tracking Dashboard.
//
// Real-time delivery tracking after an alert is sent:
//   • Per-channel stats (In-App, SMS, Voice, WhatsApp)
//   • Aggregate progress bar with reach percentage
//   • Map view showing delivery density by area
//   • Failed deliveries with retry button
// ---------------------------------------------------------------------

import { useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  XCircle,
  Smartphone,
} from "lucide-react";

type ChannelStatus = "sent" | "delivered" | "read" | "acknowledged" | "failed" | "answered" | "voicemail" | "replied";

type ChannelStats = {
  channel: string;
  icon: typeof Smartphone;
  color: string;
  bgColor: string;
  total: number;
  statuses: Array<{ label: string; count: number; color: string }>;
};

type AreaDelivery = {
  area: string;
  total: number;
  delivered: number;
  failed: number;
  lat: number;
  lng: number;
};

const MOCK_CHANNEL_STATS: ChannelStats[] = [
  {
    channel: "In-App Push",
    icon: Smartphone,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    total: 4200,
    statuses: [
      { label: "Delivered", count: 3800, color: "text-emerald-400" },
      { label: "Read", count: 2100, color: "text-blue-400" },
      { label: "Acknowledged", count: 890, color: "text-purple-400" },
      { label: "Failed", count: 400, color: "text-red-400" },
    ],
  },
  {
    channel: "SMS",
    icon: MessageSquare,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    total: 5600,
    statuses: [
      { label: "Sent", count: 5600, color: "text-slate-400" },
      { label: "Delivered", count: 5200, color: "text-emerald-400" },
      { label: "Failed", count: 400, color: "text-red-400" },
    ],
  },
  {
    channel: "Voice Call",
    icon: Phone,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    total: 1800,
    statuses: [
      { label: "Dialed", count: 1800, color: "text-slate-400" },
      { label: "Answered", count: 1200, color: "text-emerald-400" },
      { label: "Voicemail", count: 340, color: "text-amber-400" },
      { label: "Failed", count: 260, color: "text-red-400" },
    ],
  },
  {
    channel: "WhatsApp",
    icon: MessageCircle,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    total: 3400,
    statuses: [
      { label: "Sent", count: 3400, color: "text-slate-400" },
      { label: "Read", count: 2800, color: "text-blue-400" },
      { label: "Replied", count: 450, color: "text-purple-400" },
      { label: "Failed", count: 600, color: "text-red-400" },
    ],
  },
];

const MOCK_AREA_DELIVERY: AreaDelivery[] = [
  { area: "Patna City", total: 3200, delivered: 2900, failed: 300, lat: 25.6, lng: 85.14 },
  { area: "Danapur", total: 2800, delivered: 2500, failed: 300, lat: 25.64, lng: 85.05 },
  { area: "Punpun", total: 2100, delivered: 1800, failed: 300, lat: 25.49, lng: 84.93 },
  { area: "Rampur", total: 1800, delivered: 1650, failed: 150, lat: 25.5, lng: 85.07 },
  { area: "Maner", total: 1500, delivered: 1350, failed: 150, lat: 25.65, lng: 84.87 },
  { area: "Barh", total: 1200, delivered: 1050, failed: 150, lat: 25.48, lng: 85.71 },
  { area: "Fatuha", total: 900, delivered: 800, failed: 100, lat: 25.51, lng: 85.31 },
  { area: "Khagaul", total: 500, delivered: 400, failed: 100, lat: 25.63, lng: 85.05 },
];

const TOTAL_SENT = 15000;
const TOTAL_REACHED = 12450;
const TOTAL_FAILED = MOCK_CHANNEL_STATS.reduce(
  (sum, ch) => sum + (ch.statuses.find((s) => s.label === "Failed")?.count ?? 0),
  0,
);

function ProgressBar({ reached, total }: { reached: number; total: number }) {
  const pct = Math.round((reached / total) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Delivery Progress</span>
        <span className="font-mono text-sm font-bold text-white">{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#0a0f1a]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[0.625rem] text-slate-500">
        <span>{reached.toLocaleString("en-IN")} reached</span>
        <span>{total.toLocaleString("en-IN")} total</span>
      </div>
    </div>
  );
}

function ChannelCard({ stats }: { stats: ChannelStats }) {
  const Icon = stats.icon;
  const failedCount = stats.statuses.find((s) => s.label === "Failed")?.count ?? 0;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${stats.bgColor} ${stats.color}`}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{stats.channel}</p>
          <p className="text-[0.625rem] text-slate-500">{stats.total.toLocaleString("en-IN")} total</p>
        </div>
        {failedCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-400/10 px-2 py-0.5 text-[0.5625rem] font-bold text-red-400">
            <XCircle className="h-2.5 w-2.5" aria-hidden />
            {failedCount}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {stats.statuses.map((status) => (
          <div key={status.label} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${status.color.replace("text-", "bg-")}`} aria-hidden />
              {status.label}
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${status.color.replace("text-", "bg-")}`}
                  style={{ width: `${(status.count / stats.total) * 100}%` }}
                />
              </div>
              <span className="font-mono text-xs tabular-nums text-slate-300 w-12 text-right">
                {status.count.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AreaRow({ area }: { area: AreaDelivery }) {
  const pct = Math.round((area.delivered / area.total) * 100);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => setRetrying(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 transition hover:border-white/10">
      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{area.area}</p>
        <p className="text-[0.625rem] text-slate-500">
          {area.delivered.toLocaleString("en-IN")} / {area.total.toLocaleString("en-IN")} delivered
        </p>
      </div>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full ${pct >= 90 ? "bg-emerald-400" : pct >= 70 ? "bg-amber-400" : "bg-red-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums text-slate-400 w-10 text-right">{pct}%</span>
      {area.failed > 0 && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-400/10 px-2 py-1 text-[0.5625rem] font-bold text-red-400 transition hover:bg-red-400/20 disabled:opacity-50"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${retrying ? "animate-spin" : ""}`} aria-hidden />
          Retry {area.failed}
        </button>
      )}
    </div>
  );
}

export function DeliveryTracking() {
  const [activeTab, setActiveTab] = useState<"channels" | "areas">("channels");

  return (
    <section className="rounded-xl border border-white/10 bg-[#111827] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0a0f1a]/80 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
            <BarChart3 className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Delivery Tracking</h2>
            <p className="text-[0.625rem] uppercase tracking-wider text-slate-500">Real-time · Post-send</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[0.625rem] font-bold uppercase tracking-wider text-emerald-400">Live</span>
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="border-b border-white/10 bg-[#0a0f1a]/50 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-2xl font-bold text-white">{TOTAL_REACHED.toLocaleString("en-IN")}</span>
          <span className="text-sm text-slate-400">of</span>
          <span className="font-mono text-lg font-bold text-slate-300">{TOTAL_SENT.toLocaleString("en-IN")}</span>
          <span className="text-sm text-slate-400">reached</span>
          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[0.625rem] font-bold text-emerald-400">
            {Math.round((TOTAL_REACHED / TOTAL_SENT) * 100)}%
          </span>
        </div>
        <ProgressBar reached={TOTAL_REACHED} total={TOTAL_SENT} />
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-white/10 bg-[#0a0f1a]/30">
        <button
          type="button"
          onClick={() => setActiveTab("channels")}
          className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
            activeTab === "channels"
              ? "border-b-2 border-purple-400 text-purple-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          By Channel
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("areas")}
          className={`flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
            activeTab === "areas"
              ? "border-b-2 border-purple-400 text-purple-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          By Area
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "channels" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK_CHANNEL_STATS.map((stats) => (
              <ChannelCard key={stats.channel} stats={stats} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {MOCK_AREA_DELIVERY.map((area) => (
              <AreaRow key={area.area} area={area} />
            ))}
          </div>
        )}
      </div>

      {/* Failed summary */}
      {TOTAL_FAILED > 0 && (
        <div className="border-t border-white/10 bg-red-400/5 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" aria-hidden />
              <span className="text-xs font-bold text-red-400">{TOTAL_FAILED} failed deliveries</span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-400/20"
            >
              <RefreshCw className="h-3 w-3" aria-hidden />
              Retry All Failed
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default DeliveryTracking;
