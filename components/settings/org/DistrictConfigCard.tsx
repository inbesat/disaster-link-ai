"use client";

// ---------------------------------------------------------------------
// components/settings/org/DistrictConfigCard.tsx — Organization (Phase 5 · Step 2).
//
// District management & geofencing:
//   • Lists operational districts (Patna, Ernakulam, ...) with state, map
//     center and boundary status.
//   • "Add New District" opens an inline form: District Name, State, Default
//     Map Center (Lat/Lng) and a Boundary GeoJSON file upload.
//   • Each district row has an Active / Standby toggle switch.
//
// Demo data lives in local component state; the add-form validates required
// fields + lat/lng ranges and appends to the visible list.
// ---------------------------------------------------------------------

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FileJson,
  MapPinned,
  Locate,
  Plus,
  UploadCloud,
  X,
} from "lucide-react";
import { useOrgSettings } from "@/lib/org-settings-mock";
import type { OrgBoundaryInfo } from "@/lib/settings/org-settings";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default function DistrictConfigCard() {
  const {
    settings,
    addDistrict,
    setDistrictActive,
  } = useOrgSettings();
  const districts = settings.districts;
  const [adding, setAdding] = useState(false);

  // New-district form fields
  const [name, setName] = useState("");
  const [state, setState] = useState("Bihar");
  const [centerLat, setCenterLat] = useState("");
  const [centerLng, setCenterLng] = useState("");
  const [boundary, setBoundary] = useState<OrgBoundaryInfo | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".geojson") && !file.name.toLowerCase().endsWith(".json")) {
      toast.error("Boundary upload must be a .geojson file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Boundary GeoJSON is too large (max 25 MB).");
      return;
    }
    setBoundary({
      name: file.name,
      sizeBytes: file.size,
      featureCount: 1,
    });
    toast.success(`Boundary file "${file.name}" ready.`);
  }

  function resetForm() {
    setName("");
    setState("Bihar");
    setCenterLat("");
    setCenterLng("");
    setBoundary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAdd() {
    const lat = Number.parseFloat(centerLat);
    const lng = Number.parseFloat(centerLng);

    if (!name.trim()) {
      toast.error("District name is required.");
      return;
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      toast.error("Map center latitude must be between -90 and 90.");
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      toast.error("Map center longitude must be between -180 and 180.");
      return;
    }

    const newDistrict = {
      name: name.trim(),
      state: state.trim() || "Unknown",
      centerLat: lat,
      centerLng: lng,
      active: true,
      boundary,
      geojsonActive: Boolean(boundary),
    };
    addDistrict(newDistrict);
    toast.success(`${newDistrict.name} added as an active district.`);
    setAdding(false);
    resetForm();
  }

  function toggleRow(id: string) {
    const target = districts.find((d) => d.id === id);
    if (!target) return;
    setDistrictActive(id, !target.active);
  }

  return (
    <section
      data-settings-key="org-district-config"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <MapPinned className="h-5 w-5 text-red-300" aria-hidden />
          </div>
          <div>
            <p className="eoc-label text-red-300/80">DISTRICTS</p>
            <h2 className="mt-0.5 text-lg font-bold">
              District Configuration &amp; Geofencing
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20"
        >
          {adding ? (
            <X className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Plus className="h-3.5 w-3.5" aria-hidden />
          )}
          {adding ? "Cancel" : "Add New District"}
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Operational districts drive thresholds, alert routing and map
        geofencing. Toggle a district to cycle it between Active and Standby.
      </p>

      {/* Add district form */}
      {adding && (
        <div className="mt-5 rounded-md border border-red-400/30 bg-surface-muted/40 p-4">
          <p className="text-[11px] font-semibold tracking-wide text-red-300">
            NEW DISTRICT
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">
                District Name <span className="text-red-400">*</span>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sitamarhi"
                className="mt-1.5 w-full rounded-md border border-[#1c2740] bg-[#0a0f1d] px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-red-400/60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">State</span>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Bihar"
                className="mt-1.5 w-full rounded-md border border-[#1c2740] bg-[#0a0f1d] px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-red-400/60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">
                Default Map Center — Latitude
              </span>
              <input
                value={centerLat}
                onChange={(e) => setCenterLat(e.target.value)}
                placeholder="e.g. 26.6141"
                inputMode="decimal"
                className="mt-1.5 w-full rounded-md border border-[#1c2740] bg-[#0a0f1d] px-3 py-2 font-mono text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-red-400/60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-300">
                Default Map Center — Longitude
              </span>
              <input
                value={centerLng}
                onChange={(e) => setCenterLng(e.target.value)}
                placeholder="e.g. 85.3143"
                inputMode="decimal"
                className="mt-1.5 w-full rounded-md border border-[#1c2740] bg-[#0a0f1d] px-3 py-2 font-mono text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-red-400/60"
              />
            </label>
          </div>

          {/* GeoJSON upload */}
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-300">
              Boundary GeoJSON Upload
            </span>
            {boundary ? (
              <div className="mt-1.5 flex items-center justify-between gap-3 rounded-md border border-emerald-400/40 bg-emerald-500/[0.07] px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <FileJson className="h-4 w-4 text-emerald-300" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">
                      {boundary.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatBytes(boundary.sizeBytes)} · {boundary.featureCount}{" "}
                      feature(s) · ready
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBoundary(null)}
                  aria-label="Remove boundary file"
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ) : (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 py-6 text-center transition ${
                  dragOver
                    ? "border-red-400 bg-red-500/10"
                    : "border-[#1c2740] bg-[#0a0f1d] hover:border-red-400/40"
                }`}
              >
                <UploadCloud className="h-5 w-5 text-slate-500" aria-hidden />
                <span className="text-xs font-semibold text-slate-300">
                  Drop a .geojson file here or{" "}
                  <span className="text-red-300">browse</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  District boundary polygon · max 25 MB
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".geojson,.json,application/geo+json,application/json"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-red-400/60 bg-red-500/15 px-4 py-2 text-sm font-bold text-red-100 transition hover:bg-red-500/25"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add District
          </button>
        </div>
      )}

      {/* District list */}
      <div className="mt-5 overflow-hidden rounded-md border border-[#1c2740]">
        <div className="hidden grid-cols-12 gap-2 border-b border-[#1c2740] bg-surface-muted/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 md:grid">
          <div className="col-span-4">District</div>
          <div className="col-span-3">Map Center</div>
          <div className="col-span-3">Boundary</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        {districts.map((district, index) => (
          <div
            key={district.id}
            className={`grid grid-cols-1 items-center gap-3 border-b border-[#152033] px-4 py-3 transition last:border-b-0 md:grid-cols-12 ${
              index % 2 === 0 ? "bg-[#0a0f1d]" : "bg-surface-muted/20"
            }`}
          >
            {/* Name + state */}
            <div className="col-span-1 flex items-center gap-3 md:col-span-4">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  district.active
                    ? "bg-red-500/15 text-red-300"
                    : "bg-[#1c2740] text-slate-500"
                }`}
              >
                <MapPinned className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">
                  {district.name}
                </p>
                <p className="text-[11px] text-slate-500">{district.state}</p>
              </div>
            </div>

            {/* Center */}
            <div className="col-span-1 font-mono text-xs text-slate-400 md:col-span-3">
              {district.centerLat.toFixed(4)}, {district.centerLng.toFixed(4)}
            </div>

            {/* Boundary */}
            <div className="col-span-1 flex items-center gap-2 md:col-span-3">
              {district.boundary ? (
                <>
                  <Locate className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
                  <span className="truncate text-xs text-slate-400">
                    {district.boundary.name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-600">No boundary set</span>
              )}
              {district.geojsonActive && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                  Geofence
                </span>
              )}
            </div>

            {/* Status toggle */}
            <div className="col-span-1 flex items-center justify-between gap-2 md:col-span-2 md:justify-end">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider md:hidden ${
                  district.active ? "text-emerald-300" : "text-slate-500"
                }`}
              >
                {district.active ? "Active" : "Standby"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={district.active}
                aria-label={`${district.name} district ${
                  district.active ? "Active" : "Standby"
                }`}
                onClick={() => toggleRow(district.id)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  district.active ? "bg-emerald-500" : "bg-slate-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    district.active ? "left-[1.375rem]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        {districts.filter((d) => d.active).length} of {districts.length}{" "}
        districts active
      </p>
    </section>
  );
}