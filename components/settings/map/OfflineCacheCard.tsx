"use client";

// ---------------------------------------------------------------------
// components/settings/map/OfflineCacheCard.tsx — Map & GIS (Phase 3 · Step 8).
//
// Offline map storage manager:
//   • Pick districts (Patna, Muzaffarpur, ...) to pre-download offline.
//     Downloads are mocked with a setTimeout loading state for the demo.
//   • Cache Size Limit selector: 100 MB · 500 MB · 1 GB · 2 GB.
//   • Visual storage progress bar — current usage vs configured ceiling.
//   • Destructive red "Clear Map Cache" button with a confirm step + toast.
//
// Everything persists through useMapSettings → localStorage.
// ---------------------------------------------------------------------

import {
  Check,
  Download,
  HardDrive,
  MapPin,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";

const SIZE_LIMIT_OPTIONS: { value: number; label: string }[] = [
  { value: 100, label: "100 MB" },
  { value: 500, label: "500 MB" },
  { value: 1024, label: "1 GB" },
  { value: 2048, label: "2 GB" },
];

const DISTRICT_OPTIONS: { name: string; sizeMb: number }[] = [
  { name: "Patna", sizeMb: 112 },
  { name: "Muzaffarpur", sizeMb: 96 },
  { name: "Darbhanga", sizeMb: 84 },
  { name: "Bhagalpur", sizeMb: 78 },
  { name: "Purba Champaran", sizeMb: 61 },
  { name: "Kosi River Basin", sizeMb: 142 },
];

function formatMb(mb: number): string {
  return mb >= 1024
    ? `${(mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1)} GB`
    : `${mb} MB`;
}

export default function OfflineCacheCard() {
  const { settings, update } = useMapSettings();
  const cache = settings.cache;
  const [downloading, setDownloading] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const usageMb = cache.cacheSizeMb;
  const limitMb = cache.sizeLimitMb;
  const usagePercent = Math.min((usageMb / limitMb) * 100, 100);
  const atLimit = usageMb >= limitMb;

  function setSizeLimit(value: number) {
    update({ cache: { ...cache, sizeLimitMb: value } });
  }

  function downloadDistrict(name: string, sizeMb: number) {
    if (downloading) return;
    if (cache.cachedRegions.includes(name)) return;
    if (atLimit) {
      toast.error(`${formatMb(limitMb)} limit reached — raise the cache size limit first.`);
      return;
    }
    setDownloading(name);
    // Mock the actual download with a pseudo progress for the demo.
    window.setTimeout(() => {
      setDownloading(null);
      update({
        cache: {
          ...cache,
          cachedRegions: [...cache.cachedRegions, name],
          cacheSizeMb: cache.cacheSizeMb + sizeMb,
        },
      });
      toast.success(`${name} tiles downloaded for offline use.`);
    }, 1400);
  }

  function removeDistrict(name: string, sizeMb: number) {
    update({
      cache: {
        ...cache,
        cachedRegions: cache.cachedRegions.filter((region) => region !== name),
        cacheSizeMb: Math.max(cache.cacheSizeMb - sizeMb, 0),
      },
    });
    toast(`Removed ${name} from offline cache.`);
  }

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      toast("Clear all offline map data? Click red button again to confirm.", {
        duration: 4000,
      });
      return;
    }
    setConfirmClear(false);
    update({
      cache: {
        ...cache,
        cachedRegions: [],
        cacheSizeMb: 0,
      },
    });
    toast.success("Offline map cache cleared.");
  }

  return (
    <section
      data-settings-key="map-offline-cache"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <HardDrive className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-emerald-300/80">OFFLINE</p>
          <h2 className="mt-0.5 text-lg font-bold">Offline Map Cache Manager</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Pre-download district maps so responders keep navigating with zero
        signal in the field.
      </p>

      {/* Storage progress bar */}
      <div className="mt-5 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-2 font-semibold">
            <HardDrive className="h-3.5 w-3.5" aria-hidden />
            Current Cache Usage
          </span>
<span className="font-mono text-emerald-300">
            {formatMb(usageMb)} / {formatMb(limitMb)}
          </span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#161f3a]">
          <div
            className={`h-full rounded-full transition-all ${
              atLimit
                ? "bg-red-500/80"
                : usagePercent > 75
                  ? "bg-amber-400/80"
                  : "bg-emerald-500/80"
            }`}
            style={{ width: `${usagePercent}%` }}
            role="progressbar"
            aria-valuenow={Math.round(usageMb)}
            aria-valuemin={0}
            aria-valuemax={limitMb}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">
          {usagePercent === 100
            ? "Cache limit reached — raise the limit or remove a district."
            : `${Math.round(usagePercent)}% of your configured storage used.`}
        </p>
      </div>

      {/* Cache size limit selector */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400">
          CACHE SIZE LIMIT
        </p>
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          {SIZE_LIMIT_OPTIONS.map((option) => {
            const active = cache.sizeLimitMb === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSizeLimit(option.value)}
                aria-pressed={active}
                className={`rounded-md border px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-200"
                    : "border-panel-border bg-[#0a0f1d] text-slate-400 hover:border-emerald-400/40"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* District downloads */}
      <div className="mt-4">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400">
          DISTRICTS TO PRE-DOWNLOAD
        </p>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {DISTRICT_OPTIONS.map((district) => {
            const cached = cache.cachedRegions.includes(district.name);
            const isDownloading = downloading === district.name;
            return (
              <div
                key={district.name}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 transition ${
                  cached
                    ? "border-emerald-400/40 bg-emerald-500/[0.07]"
                    : "border-panel-border bg-surface-muted/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin
                    className={`h-4 w-4 shrink-0 ${cached ? "text-emerald-300" : "text-slate-500"}`}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {district.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatMb(district.sizeMb)}
                    </p>
                  </div>
                </div>

                {cached ? (
                  <button
                    type="button"
                    onClick={() => removeDistrict(district.name, district.sizeMb)}
                    aria-label={`Remove ${district.name} from offline cache`}
                    className="inline-flex items-center gap-1 rounded-md border border-panel-borderHover bg-[#0a0f1d] px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:border-red-400/60 hover:text-red-300"
                  >
                    <Check className="h-3 w-3" aria-hidden />
                    Ready
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      downloadDistrict(district.name, district.sizeMb)
                    }
                    disabled={isDownloading || (atLimit && !cached)}
                    aria-label={`Download ${district.name} for offline use`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60"
                  >
                    <Download
                      className={`h-3 w-3 ${isDownloading ? "animate-bounce" : ""}`}
                      aria-hidden
                    />
                    {isDownloading ? "Syncing…" : "Download"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Destructive clear */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-panel-border pt-4">
        <p className="text-[11px] text-slate-500">
          Frees all downloaded district data and storage instantly.
        </p>
        <button
          type="button"
          onClick={handleClear}
          className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition ${
            confirmClear
              ? "border-red-400 bg-red-500 text-white hover:bg-red-600"
              : "border-red-400/60 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          }`}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          {confirmClear ? "Confirm Clear?" : "Clear Map Cache"}
        </button>
      </div>
    </section>
  );
}