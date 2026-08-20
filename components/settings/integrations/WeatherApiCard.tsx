"use client";

// ---------------------------------------------------------------------
// components/settings/integrations/WeatherApiCard.tsx — Integrations (Phase 8 · Step 2).
//
// Meteorological & Flood APIs:
//   • API key fields for IMD, OpenWeatherMap and GLOFAS — password-masked
//     with a show/hide toggle.
//   • "Priority Failover" drag-and-drop list: the first healthy source in
//     this order wins the fetch (with keyboard up/down controls).
//   • "Test Connection" per source: mock 1-second spinner, then a green
//     "200 OK" badge.
// ---------------------------------------------------------------------

import { useState, type DragEvent } from "react";
import toast from "react-hot-toast";
import { useIntegrationSettings } from "@/lib/integrations-settings-mock";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudRain,
  CloudSun,
  Eye,
  EyeOff,
  GripVertical,
  KeyRound,
  Loader2,
  Waves,
} from "lucide-react";

type ProviderId = "imd" | "openweather" | "glofas";

type Provider = {
  id: ProviderId;
  shortName: string;
  name: string;
  hint: string;
  icon: typeof CloudSun;
  placeholder: string;
};

const PROVIDERS: Provider[] = [
  {
    id: "imd",
    shortName: "IMD",
    name: "IMD (Indian Meteorological Dept)",
    hint: "Rainfall records + district alerts",
    icon: CloudRain,
    placeholder: "imd_••••••••",
  },
  {
    id: "openweather",
    shortName: "OpenWeather",
    name: "OpenWeatherMap",
    hint: "Live conditions + 5-day forecasts",
    icon: CloudSun,
    placeholder: "owm_••••••••",
  },
  {
    id: "glofas",
    shortName: "GLOFAS",
    name: "GLOFAS",
    hint: "River discharge + flood forecasts",
    icon: Waves,
    placeholder: "glofas_••••••",
  },
];

const PROVIDER_LOOKUP = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p]),
) as Record<ProviderId, Provider>;

type TestStatus = "idle" | "testing" | "ok";

export default function WeatherApiCard() {
  const { settings, setWeatherApiKey, setWeatherPriority } =
    useIntegrationSettings();
  // API keys + failover order live in the shared persisted store.
  const { weatherApiKeys: apiKeys, weatherPriority: priority } = settings;
  const [status, setStatus] = useState<Record<ProviderId, TestStatus>>({
    imd: "idle",
    openweather: "idle",
    glofas: "idle",
  });
  const [visible, setVisible] = useState<Record<ProviderId, boolean>>({
    imd: false,
    openweather: false,
    glofas: false,
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function testConnection(id: ProviderId) {
    if (status[id] === "testing") return;
    setStatus((prev) => ({ ...prev, [id]: "testing" }));
    // Mock 1-second connectivity round-trip.
    window.setTimeout(() => {
      setStatus((prev) => ({ ...prev, [id]: "ok" }));
      toast.success(`${PROVIDER_LOOKUP[id].shortName} connection OK — 200.`);
    }, 1000);
  }

  function reorderPriority(from: number, to: number) {
    if (from === to) return;
    const movedName = PROVIDER_LOOKUP[priority[from]].shortName;
    const next = [...priority];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setWeatherPriority(next);
    toast(
      `${movedName} moved to failover position ${to + 1}.`,
      { duration: 2500 },
    );
  }

  function moveBy(index: number, direction: -1 | 1) {
    reorderPriority(index, index + direction);
  }

  return (
    <section
      data-settings-key="integrations-weather"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
          <CloudSun className="h-5 w-5 text-sky-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-sky-300/80">METEOROLOGICAL DATA</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Meteorological &amp; Flood APIs
          </h2>
        </div>
        <span className="ml-auto rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-sky-200">
          {PROVIDERS.length} sources
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Connect the ingestion pipeline to live weather and river data. Keys
        are stored encrypted and only used server-side.
      </p>

      {/* API key rows */}
      <div className="mt-5 space-y-3">
        {PROVIDERS.map((provider) => {
          const ProviderIcon = provider.icon;
          const state = status[provider.id];
          return (
            <div
              key={provider.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-panel-border bg-surface-muted/40 p-3.5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
                <ProviderIcon className="h-4 w-4 text-sky-300" aria-hidden />
              </span>

              <div className="min-w-0 flex-1 basis-40">
                <p className="text-sm font-bold text-slate-100">
                  {provider.name}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {provider.hint}
                </p>
              </div>

              {/* Masked API key input */}
              <div className="relative w-full sm:w-64">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  type={visible[provider.id] ? "text" : "password"}
                  value={apiKeys[provider.id]}
                  onChange={(e) => setWeatherApiKey(provider.id, e.target.value)}
                  placeholder={provider.placeholder}
                  aria-label={`${provider.shortName} API key`}
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-md border border-panel-border bg-[#0a0f1d] py-2 pl-9 pr-9 font-mono text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-400/60"
                />
                <button
                  type="button"
                  onClick={() =>
                    setVisible((prev) => ({
                      ...prev,
                      [provider.id]: !prev[provider.id],
                    }))
                  }
                  aria-label={
                    visible[provider.id]
                      ? `Hide ${provider.shortName} API key`
                      : `Show ${provider.shortName} API key`
                  }
                  aria-pressed={visible[provider.id]}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-slate-300"
                >
                  {visible[provider.id] ? (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                  )}
                </button>
              </div>

              {/* Test Connection */}
              <div className="flex shrink-0 items-center gap-2.5">
                {state === "ok" ? (
                  <button
                    type="button"
                    onClick={() => testConnection(provider.id)}
                    title="Re-test connection"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    <CheckCircle2 className="h-3 w-3" aria-hidden />
                    200 OK
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => testConnection(provider.id)}
                    disabled={state === "testing"}
                    className="inline-flex items-center gap-1.5 rounded-md border border-panel-borderHover px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-sky-400/50 hover:bg-sky-500/10 hover:text-sky-200 disabled:cursor-wait disabled:opacity-50"
                  >
                    {state === "testing" ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        Testing…
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Priority failover */}
      <div className="mt-5 rounded-md border border-panel-border bg-[#0a0f1d] p-4">
        <p className="eoc-label text-sky-300/80">PRIORITY FAILOVER</p>
        <p className="mt-1 text-xs text-slate-500">
          The first healthy source in this order wins the fetch — drag rows or
          use the arrows.
        </p>

        <ol className="mt-3 space-y-2">
          {priority.map((id, index) => {
            const provider = PROVIDER_LOOKUP[id];
            const Icon = provider.icon;
            const dragging = dragIndex === index;
            const dropTarget =
              dragIndex !== null && dragIndex !== index && overIndex === index;
            return (
              <li
                key={id}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIndex(index);
                }}
                onDrop={(e: DragEvent<HTMLLIElement>) => {
                  e.preventDefault();
                  setOverIndex(null);
                  if (dragIndex !== null) reorderPriority(dragIndex, index);
                  setDragIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
                className={`group flex items-center gap-3 rounded-md border p-2.5 transition ${
                  dragging
                    ? "border-sky-400/60 bg-sky-500/10 opacity-40"
                    : dropTarget
                      ? "border-t-2 border-t-sky-400 bg-sky-500/[0.06]"
                      : "border-panel-border bg-surface-muted/40 hover:border-sky-400/40"
                }`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1c2740] font-mono text-[10px] font-bold tabular-nums text-slate-300">
                  {index + 1}
                </span>
                <span
                  className="shrink-0 cursor-grab text-slate-500 transition group-hover:text-sky-300 active:cursor-grabbing"
                  aria-hidden
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <Icon className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-200">
                  {provider.shortName}
                </span>
                <span className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveBy(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${provider.shortName} up`}
                    className="rounded p-1 text-slate-500 transition hover:bg-sky-500/10 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBy(index, 1)}
                    disabled={index === priority.length - 1}
                    aria-label={`Move ${provider.shortName} down`}
                    className="rounded p-1 text-slate-500 transition hover:bg-sky-500/10 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Demo fixtures — keys are masked, never logged, and rotated via the
        Privacy &amp; Security panel.
      </p>
    </section>
  );
}
