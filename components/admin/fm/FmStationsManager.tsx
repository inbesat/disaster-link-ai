"use client";

// ---------------------------------------------------------------------
// components/admin/fm/FmStationsManager.tsx — Phase 26 · FM Radio
// Emergency Broadcasting admin UI (Phase 1).
//
// Views:
//   • Table  — all stations with search + type/state filters, RDS/active
//     badges, and row actions (edit / toggle active / delete).
//   • Map    — coverage circles per station (turf geodesic circle around
//     the transmitter), click to place a test point → which stations
//     cover it (Test Coverage tool), via /api/fm/coverage.
//   • CRUD   — inline create/edit form; DELETE hits /api/fm/stations/[id].
//   • Import — paste CSV → /api/fm/import (upsert on name+frequency).
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MapGl, Marker, NavigationControl, Source, Layer } from "react-map-gl/maplibre";
import {
  Plus,
  Save,
  Trash2,
  Pencil,
  Upload,
  Radio,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { coverageCircleGeoJSON } from "@/lib/fm/find-stations";
import type { FmStationDTO } from "@/lib/fm/serialize";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const EMPTY_FORM = {
  name: "",
  frequency: "",
  city: "",
  state: "",
  callSign: "",
  coverageRadiusKm: 50,
  lat: "",
  lng: "",
  operator: "",
  type: "private",
  emergencyApiEndpoint: "",
  emergencyContactPhone: "",
  rdsEnabled: false,
  rdsApiEndpoint: "",
};

type FormState = typeof EMPTY_FORM;

type TestResult = {
  point: { lat: number; lng: number };
  covering: FmStationDTO[];
};

export default function FmStationsManager() {
  const [stations, setStations] = useState<FmStationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const states = useMemo(
    () => Array.from(new Set(stations.map((s) => s.state))).sort(),
    [stations],
  );

  const loadStations = useCallback(async () => {
    try {
      const res = await fetch("/api/fm/stations");
      const data = await res.json();
      if (data?.stations) setStations(data.stations);
    } catch (error: unknown) {
      console.error("Failed to load FM stations:", error);
      toast.error("Failed to load FM stations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stations.filter((s) => {
      if (typeFilter && s.type !== typeFilter) return false;
      if (stateFilter && s.state !== stateFilter) return false;
      if (!q) return true;
      return [s.name, s.city, s.state, s.frequency, s.operator]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [stations, search, typeFilter, stateFilter]);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function startEdit(station: FmStationDTO) {
    setEditingId(station.id);
    setForm({
      name: station.name,
      frequency: station.frequency,
      city: station.city,
      state: station.state,
      callSign: station.callSign ?? "",
      coverageRadiusKm: station.coverageRadiusKm,
      lat: station.lat?.toString() ?? "",
      lng: station.lng?.toString() ?? "",
      operator: station.operator ?? "",
      type: station.type,
      emergencyApiEndpoint: station.emergencyApiEndpoint ?? "",
      emergencyContactPhone: station.emergencyContactPhone ?? "",
      rdsEnabled: station.rdsEnabled,
      rdsApiEndpoint: station.rdsApiEndpoint ?? "",
    });
    setShowForm(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...form,
      coverageRadiusKm: Number(form.coverageRadiusKm) || 50,
      lat: form.lat === "" ? null : Number(form.lat),
      lng: form.lng === "" ? null : Number(form.lng),
      rdsEnabled: form.rdsEnabled,
    };
    try {
      const url = editingId ? `/api/fm/stations/${editingId}` : "/api/fm/stations";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Failed to save station.");
        return;
      }
      toast.success(editingId ? "Station updated." : "Station created.");
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await loadStations();
    } catch (error: unknown) {
      console.error("Failed to save FM station:", error);
      toast.error("Failed to save station.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/fm/stations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Failed to delete station.");
        return;
      }
      toast.success("Station deleted.");
      setStations((prev) => prev.filter((s) => s.id !== id));
    } catch (error: unknown) {
      console.error("Failed to delete FM station:", error);
      toast.error("Failed to delete station.");
    }
  }

  async function handleToggleActive(station: FmStationDTO) {
    try {
      const res = await fetch(`/api/fm/stations/${station.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !station.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Failed to update station.");
        return;
      }
      toast.success(station.isActive ? "Station deactivated." : "Station activated.");
      setStations((prev) =>
        prev.map((s) => (s.id === station.id ? { ...s, isActive: !s.isActive } : s)),
      );
    } catch (error: unknown) {
      console.error("Failed to toggle FM station:", error);
      toast.error("Failed to update station.");
    }
  }

  async function handleImport() {
    if (!csvText.trim()) {
      toast.error("Paste CSV content first.");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/fm/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Import failed.");
        return;
      }
      toast.success(`Imported ${data.imported}, updated ${data.updated}, skipped ${data.skipped}.`);
      if (data.errors?.length) {
        console.warn("FM import row errors:", data.errors);
      }
      setCsvOpen(false);
      setCsvText("");
      await loadStations();
    } catch (error: unknown) {
      console.error("Failed to import FM stations:", error);
      toast.error("Import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function testCoverage(lat: number, lng: number) {
    try {
      const res = await fetch(`/api/fm/coverage?lat=${lat}&lng=${lng}&radius=60`);
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Coverage test failed.");
        return;
      }
      setTestResult({ point: { lat, lng }, covering: data.covering ?? [] });
    } catch (error: unknown) {
      console.error("Failed to test coverage:", error);
      toast.error("Coverage test failed.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, city, state, frequency…"
            className="w-full rounded-md border border-border bg-surface-elevated py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-amber-400/60"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-amber-400/60"
        >
          <option value="">All types</option>
          <option value="air">AIR</option>
          <option value="private">Private</option>
          <option value="community">Community</option>
        </select>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-amber-400/60"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCsvOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm font-medium text-foreground transition hover:border-amber-400/50 hover:text-amber-300"
        >
          <Upload className="h-4 w-4" />
          Import CSV
        </button>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          Add Station
        </button>
      </div>

      {/* CSV import panel */}
      {csvOpen && (
        <div className="rounded-lg border border-[#1c2740] bg-[#0b1120] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              CSV Bulk Import (upserts on name + frequency)
            </h3>
            <button
              type="button"
              onClick={() => setCsvOpen(false)}
              className="rounded p-1 text-slate-400 hover:text-foreground"
              aria-label="Close CSV import"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-3 font-mono text-[0.6875rem] leading-relaxed text-slate-500">
            name, frequency, city, state, call_sign, coverage_radius_km, lat, lng,
            operator, type, emergency_api_endpoint, emergency_contact_phone,
            rds_enabled, rds_api_endpoint
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder={"Radio Mirchi Patna,98.3 MHz,Patna,Bihar,FM-PR-23,45,25.5941,85.1376,Entertainment Network India Ltd,private,,,,false,"}
            className="w-full rounded-md border border-border bg-surface-elevated p-3 font-mono text-xs text-foreground outline-none focus:border-amber-400/60"
          />
          <button
            type="button"
            onClick={handleImport}
            disabled={importing}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {importing ? "Importing…" : "Run Import"}
          </button>
        </div>
      )}

      {/* Create / edit form */}
      {showForm && (
        <div className="rounded-lg border border-[#1c2740] bg-[#0b1120] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {editingId ? "Edit Station" : "Add FM Station"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded p-1 text-slate-400 hover:text-foreground"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Name *" value={form.name} onChange={(v) => setField("name", v)} placeholder="Radio Mirchi 98.3" />
            <FormField label="Frequency *" value={form.frequency} onChange={(v) => setField("frequency", v)} placeholder="98.3 MHz" />
            <FormField label="City *" value={form.city} onChange={(v) => setField("city", v)} placeholder="Patna" />
            <FormField label="State *" value={form.state} onChange={(v) => setField("state", v)} placeholder="Bihar" />
            <FormField label="Call Sign" value={form.callSign} onChange={(v) => setField("callSign", v)} placeholder="FM-PR-01" />
            <FormField label="Operator" value={form.operator} onChange={(v) => setField("operator", v)} placeholder="Entertainment Network India Ltd" />
            <FormField label="Coverage Radius (km)" value={form.coverageRadiusKm.toString()} onChange={(v) => setField("coverageRadiusKm", Number(v) || 0)} placeholder="50" />
            <FormField label="Latitude" value={form.lat} onChange={(v) => setField("lat", v)} placeholder="25.5941" />
            <FormField label="Longitude" value={form.lng} onChange={(v) => setField("lng", v)} placeholder="85.1376" />
            <FormField label="Emergency API Endpoint" value={form.emergencyApiEndpoint} onChange={(v) => setField("emergencyApiEndpoint", v)} placeholder="https://…/cap" />
            <FormField label="Control Room Phone" value={form.emergencyContactPhone} onChange={(v) => setField("emergencyContactPhone", v)} placeholder="+91 …" />
            <FormField label="RDS API Endpoint" value={form.rdsApiEndpoint} onChange={(v) => setField("rdsApiEndpoint", v)} placeholder="https://…/rds" />
            <div>
              <label className="text-xs font-medium text-slate-400">Type</label>
              <select
                value={form.type}
                onChange={(e) => setField("type", e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-amber-400/60"
              >
                <option value="private">Private</option>
                <option value="air">AIR</option>
                <option value="community">Community</option>
              </select>
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.rdsEnabled}
                onChange={(e) => setField("rdsEnabled", e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
              RDS Enabled
            </label>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : editingId ? "Update Station" : "Create Station"}
          </button>
        </div>
      )}

      {/* Map + coverage test */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative h-[380px] overflow-hidden rounded-lg border border-[#1c2740] lg:col-span-2">
          <FmCoverageMap
            stations={filtered}
            onTest={testCoverage}
            testPoint={testResult?.point ?? null}
          />
          <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-[#0b1120]/90 px-3 py-2 text-[0.6875rem] text-slate-300 shadow-lg">
            Click the map to test coverage at a point
          </div>
        </div>

        <div className="rounded-lg border border-[#1c2740] bg-[#0b1120] p-4">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <MapPin className="h-4 w-4 text-amber-400" />
            Test Coverage Result
          </h3>
          {!testResult ? (
            <p className="mt-4 text-sm text-slate-500">
              Click anywhere on the map to see which FM stations cover that point.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="font-mono text-xs text-slate-400">
                {testResult.point.lat.toFixed(4)}, {testResult.point.lng.toFixed(4)} ·
                {testResult.covering.length} covering
              </p>
              {testResult.covering.length === 0 ? (
                <p className="text-sm text-amber-300">No FM coverage at this point.</p>
              ) : (
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {testResult.covering.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-md border border-[#1c2740] bg-surface-elevated p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                          <Radio
                            className={`h-3.5 w-3.5 shrink-0 ${s.type === "air" ? "text-amber-400" : "text-sky-400"}`}
                          />
                          <span className="truncate">{s.name}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[0.625rem] text-slate-500">
                          {s.frequency}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[0.6875rem] text-slate-500">
                        <span className="uppercase">{s.type}</span>
                        <span>·</span>
                        <span>
                          {s.distance_km !== undefined
                            ? `${s.distance_km.toFixed(1)} km`
                            : ""}
                        </span>
                        <span>·</span>
                        <span>{s.coverageRadiusKm} km reach</span>
                        {s.rdsEnabled && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400">RDS</span>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-[#1c2740] bg-[#0b1120]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#1c2740]">
            <tr className="text-[0.6875rem] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-semibold">Station</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Reach</th>
              <th className="px-4 py-3 font-semibold">RDS</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading stations…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No stations match. Add one or clear the filters.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="border-b border-[#151d31] last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="font-mono text-[0.6875rem] text-slate-500">
                      {s.frequency}
                      {s.callSign ? ` · ${s.callSign}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {s.city}, {s.state}
                    <p className="text-[0.6875rem] text-slate-500">{s.operator}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[0.6875rem] font-semibold uppercase ${
                        s.type === "air"
                          ? "bg-amber-500/10 text-amber-300"
                          : "bg-sky-500/10 text-sky-300"
                      }`}
                    >
                      {s.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">
                    {s.coverageRadiusKm} km
                  </td>
                  <td className="px-4 py-3">
                    {s.rdsEnabled ? (
                      <span className="text-emerald-400">●</span>
                    ) : (
                      <span className="text-slate-600">○</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(s)}
                      className={`rounded px-2 py-0.5 text-[0.6875rem] font-semibold uppercase transition ${
                        s.isActive
                          ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 hover:bg-slate-500/20"
                      }`}
                    >
                      {s.isActive ? "Active" : "Off"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-[#1a2338] hover:text-amber-300"
                        aria-label={`Edit ${s.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.name)}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                        aria-label={`Delete ${s.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-amber-400/60"
      />
    </div>
  );
}

/** MapLibre canvas: station markers + coverage circles + test point. */
function FmCoverageMap({
  stations,
  onTest,
  testPoint,
}: {
  stations: FmStationDTO[];
  onTest: (lat: number, lng: number) => void;
  testPoint: { lat: number; lng: number } | null;
}) {
  const withCoords = stations.filter((s) => s.lat !== null && s.lng !== null);

  return (
    <MapGl
      mapLib={maplibregl}
      mapStyle={MAP_STYLE}
      initialViewState={{ longitude: 80.0, latitude: 22.0, zoom: 4.3 }}
      style={{ width: "100%", height: "100%" }}
      onClick={(e) => onTest(e.lngLat.lat, e.lngLat.lng)}
    >
      <NavigationControl position="bottom-right" />

      {/* Coverage polygons */}
      {withCoords.length > 0 && (
        <>
          <Source id="fm-coverage-air" type="geojson" data={coverageCollection(withCoords, "air")}>
            <Layer
              id="fm-coverage-air-fill"
              type="fill"
              paint={{
                "fill-color": "#f59e0b",
                "fill-opacity": 0.18,
              }}
            />
            <Layer
              id="fm-coverage-air-line"
              type="line"
              paint={{
                "line-color": "#f59e0b",
                "line-width": 1.5,
              }}
            />
          </Source>
          <Source
            id="fm-coverage-private"
            type="geojson"
            data={coverageCollection(withCoords, "private")}
          >
            <Layer
              id="fm-coverage-private-fill"
              type="fill"
              paint={{
                "fill-color": "#38bdf8",
                "fill-opacity": 0.12,
              }}
            />
            <Layer
              id="fm-coverage-private-line"
              type="line"
              paint={{
                "line-color": "#38bdf8",
                "line-width": 1,
              }}
            />
          </Source>
        </>
      )}

      {/* Station markers */}
      {withCoords.map((s) => (
        <Marker
          key={s.id}
          longitude={s.lng as number}
          latitude={s.lat as number}
          anchor="bottom"
        >
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-white shadow-lg ${
              s.type === "air" ? "bg-amber-500" : "bg-sky-500"
            }`}
            title={`${s.name} · ${s.frequency}`}
          />
        </Marker>
      ))}

      {/* Test point */}
      {testPoint && (
        <Marker
          longitude={testPoint.lng}
          latitude={testPoint.lat}
          anchor="center"
        >
          <div className="relative">
            <span className="absolute -inset-2 animate-ping rounded-full bg-red-500/40" />
            <span className="relative block h-3 w-3 rounded-full border-2 border-white bg-red-500 shadow-glow-red" />
          </div>
        </Marker>
      )}
    </MapGl>
  );
}

function coverageCollection(
  stations: FmStationDTO[],
  type: string,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: stations
      .filter((s) => s.type === type && s.lat !== null && s.lng !== null)
      .map((s) =>
        coverageCircleGeoJSON(s.lat as number, s.lng as number, s.coverageRadiusKm),
      ),
  };
}
