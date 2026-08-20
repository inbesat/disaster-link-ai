"use client";

// ---------------------------------------------------------------------
// components/settings/integrations/IncomingWebhooksCard.tsx — Integrations (Phase 8 · Step 6).
//
// Incoming Data & IoT Pipelines:
//   • "Generate Sensor Webhook URL" produces a mock ingest endpoint
//     (https://api.bharatshakti.in/v1/ingest/sensor_xxxxx) with copy and
//     rotate controls.
//   • "Recent Payloads" terminal box shows mock JSON telemetry received in
//     the last hour and simulates a live inbound stream every few seconds.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  Check,
  Copy,
  Cpu,
  RadioTower,
  RefreshCw,
  Terminal,
  Trash2,
} from "lucide-react";

type SensorPayload = {
  id: string;
  json: Record<string, unknown>;
  receivedAt: number; // epoch ms
};

const MAX_VISIBLE_PAYLOADS = 8;

/** Relative label for the terminal timestamp column. */
function relativeTime(ts: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - ts) / 1000));
  if (seconds < 60) return "just now";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min ago`;
  return `${Math.round(mins / 60)} hr ago`;
}

/** A new random sensor reading, used by the live-stream simulation. */
function randomPayload(): SensorPayload {
  const gauges = ["river_gauge_4", "rainfall_12", "weather_station_7", "soil_moisture_9"];
  const sensor = gauges[Math.floor(Math.random() * gauges.length)];
  let json: Record<string, unknown>;
  switch (sensor) {
    case "rainfall_12":
      json = { sensor, mm_24h: Math.round(60 + Math.random() * 90) };
      break;
    case "weather_station_7":
      json = { sensor, wind_kmh: Math.round(18 + Math.random() * 40) };
      break;
    case "soil_moisture_9":
      json = { sensor, saturation_pct: Math.round(55 + Math.random() * 40) };
      break;
    default:
      json = {
        sensor,
        level_m: +(4.1 + Math.random() * 0.9).toFixed(2),
        trend: "rising",
      };
  }
  return { id: nextPayloadId(), json, receivedAt: Date.now() };
}

let payloadCounter = 0;

function nextPayloadId(): string {
  payloadCounter += 1;
  return `payload-${Date.now().toString(36)}-${payloadCounter}`;
}

/** Seed the terminal with readings received over the last ~45 minutes. */
function seedPayloads(): SensorPayload[] {
  const now = Date.now();
  const raw: Record<string, unknown>[] = [
    { sensor: "rainfall_12", mm_24h: 86.4 },
    { sensor: "river_gauge_4", level_m: 4.2, trend: "stable" },
    { sensor: "weather_station_7", wind_kmh: 24 },
    { sensor: "river_gauge_2", level_m: 3.87 },
    { sensor: "soil_moisture_9", saturation_pct: 71 },
  ];
  const offsetsMin = [2, 9, 18, 31, 46];
  return raw.map((json, i) => ({
    id: `seed-${i}`,
    json,
    receivedAt: now - offsetsMin[i] * 60_000,
  }));
}

function generateWebhookUrl(): string {
  // Always 5 lowercase hex chars (padded) — stable sensor_xxxxx shape.
  const suffix = Math.floor(Math.random() * 0x100000)
    .toString(16)
    .padStart(5, "0");
  return `https://api.bharatshakti.in/v1/ingest/sensor_${suffix}`;
}

/** Prepend a fresh payload and keep the terminal bounded. */
function appendPayload(prev: SensorPayload[]): SensorPayload[] {
  return [randomPayload(), ...prev].slice(0, MAX_VISIBLE_PAYLOADS);
}

export default function IncomingWebhooksCard() {
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [payloads, setPayloads] = useState<SensorPayload[]>(seedPayloads);
  const copyTimer = useRef<number | null>(null);

  // Simulate a live inbound stream — one new telemetry POST every 7s.
  useEffect(() => {
    const interval = window.setInterval(() => setPayloads(appendPayload), 7000);
    return () => {
      window.clearInterval(interval);
      // Also drop any pending copy-button reset timer.
      if (copyTimer.current !== null) {
        window.clearTimeout(copyTimer.current);
        copyTimer.current = null;
      }
    };
  }, []);

  function handleGenerate() {
    setWebhookUrl(generateWebhookUrl());
    toast.success("Sensor webhook URL generated.");
  }

  function handleCopy() {
    if (!webhookUrl) return;
    void navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied to clipboard.");
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  function handleRotate() {
    setWebhookUrl(generateWebhookUrl());
    toast("URL rotated — the previous endpoint stops accepting data.", {
      duration: 3000,
    });
  }

  function handleSimulate() {
    setPayloads(appendPayload);
    toast.success("Payload ingested — 200 OK.");
  }

  function handleClear() {
    setPayloads([]);
    toast("Terminal cleared.", { duration: 2000 });
  }

  const now = Date.now();

  return (
    <section
      data-settings-key="integrations-sensors"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
          <RadioTower className="h-5 w-5 text-violet-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eoc-label text-violet-300/80">INCOMING DATA · IOT PIPELINES</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Incoming Data &amp; IoT Pipelines
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {payloads.length} payloads / 60 min
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Receive telemetry from river gauges, rain stations and soil sensors.
        Each reading is validated, cleaned and fed straight into the
        prediction pipeline.
      </p>

      {/* Sensor ingest endpoint */}
      <div className="mt-5 rounded-md border border-panel-border bg-[#0a0f1d] p-4">
        <p className="eoc-label flex items-center gap-1.5 text-violet-300/80">
          <Cpu className="h-3 w-3" aria-hidden />
          SENSOR INGEST ENDPOINT
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Devices POST JSON to this URL with{" "}
          <code className="rounded bg-[#1c2740] px-1 py-0.5 font-mono text-[10px] text-slate-400">
            Content-Type: application/json
          </code>
          .
        </p>

        {webhookUrl ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-md border border-panel-border bg-surface-muted/40 px-3 py-2 font-mono text-xs text-violet-200">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy webhook URL"
              title="Copy webhook URL"
              className="inline-flex items-center gap-1.5 rounded-md border border-panel-borderHover px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-violet-200"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copy
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleRotate}
              title="Rotate URL — old endpoint stops accepting data"
              className="inline-flex items-center gap-1.5 rounded-md border border-panel-borderHover px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:bg-amber-500/10 hover:text-amber-200"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Rotate
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-violet-400/50 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-200 transition hover:bg-violet-500/20"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Generate Sensor Webhook URL
          </button>
        )}
      </div>

      {/* Recent payloads terminal */}
      <div className="mt-5 overflow-hidden rounded-md border border-panel-border bg-[#04080f]">
        {/* Terminal chrome */}
        <div className="flex items-center gap-2 border-b border-[#122033] bg-[#0a1322] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <p className="ml-2 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Recent Payloads · Last 60 min
          </p>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
          <button
            type="button"
            onClick={handleSimulate}
            className="inline-flex items-center gap-1 rounded-md border border-panel-border px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-300 transition hover:border-violet-400/50 hover:bg-violet-500/10"
          >
            <Activity className="h-3 w-3" aria-hidden />
            Simulate
          </button>
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear payload terminal"
            title="Clear terminal"
            className="rounded-md p-1 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        {/* Payload stream */}
        <div
          role="log"
          aria-live="off"
          aria-label="Recent sensor payloads"
          className="max-h-64 overflow-y-auto p-3 font-mono text-xs"
        >
          {payloads.length === 0 ? (
            <p className="px-2 py-4 text-slate-600">
              No payloads received — devices are offline or the endpoint is
              unused.
            </p>
          ) : (
            payloads.map((payload, index) => {
              const newest = index === 0;
              return (
                <div
                  key={payload.id}
                  className={`flex items-start gap-3 rounded px-2 py-1.5 transition-colors ${
                    newest ? "bg-violet-500/[0.07]" : "hover:bg-surface-muted/30"
                  }`}
                >
                  <span className="w-20 shrink-0 pt-0.5 text-[10px] tabular-nums text-slate-600">
                    {relativeTime(payload.receivedAt, now)}
                  </span>
                  {newest && (
                    <span className="mt-0.5 shrink-0 rounded-sm bg-violet-500/20 px-1 text-[9px] font-bold uppercase tracking-wider text-violet-300">
                      New
                    </span>
                  )}
                  <code className="min-w-0 break-all leading-relaxed text-emerald-200/90">
                    {JSON.stringify(payload.json)}
                  </code>
                </div>
              );
            })
          )}
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <Terminal className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Demo fixtures — payloads are simulated; the stream refreshes every few
        seconds for the live feed.
      </p>
    </section>
  );
}
