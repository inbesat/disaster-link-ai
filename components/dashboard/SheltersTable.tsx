"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { addShelter, updateOccupancy } from "@/app/actions/shelters";
import { uploadShelterPhoto } from "@/lib/supabase/storage";
import ShelterCSVUploader from "@/components/dashboard/ShelterCSVUploader";

export type ShelterRow = {
  id: string;
  name: string;
  district: string | null;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  facilities: Record<string, boolean> | null;
  status: string;
  contactPerson: string | null;
  phone: string | null;
  imageUrl: string | null;
};

type StatusFilter = "all" | "open" | "full" | "closed";

const STATUS_META: Record<string, { chip: string; dot: string }> = {
  open: { chip: "bg-severity-green-600 text-white", dot: "bg-severity-green-500" },
  full: { chip: "bg-severity-red-600 text-white", dot: "bg-severity-red-500" },
  closed: { chip: "bg-surface-elevated text-slate-300", dot: "bg-slate-500" },
};

const FACILITY_LABELS: Record<string, string> = {
  water: "Water",
  food: "Food",
  medical: "Medical",
  electricity: "Power",
};

function facilitiesOf(row: ShelterRow) {
  return (Object.keys(FACILITY_LABELS) as (keyof typeof FACILITY_LABELS)[]).filter(
    (key) => row.facilities?.[key],
  );
}

function occupancyPercent(row: ShelterRow) {
  if (row.capacity <= 0) return 0;
  return Math.min(100, Math.round((row.currentOccupancy / row.capacity) * 100));
}

function barColor(pct: number) {
  if (pct >= 100) return "bg-severity-red-500";
  if (pct >= 80) return "bg-severity-amber-500";
  return "bg-severity-green-500";
}

export default function SheltersTable({
  initialShelters,
}: {
  initialShelters: ShelterRow[];
}) {
  const [rows, setRows] = useState<ShelterRow[]>(initialShelters);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialShelters);
  }, [initialShelters]);

  const filtered = useMemo(
    () => rows.filter((row) => statusFilter === "all" || row.status === statusFilter),
    [rows, statusFilter],
  );

  async function handleAdd(input: {
    name: string;
    district: string;
    lat: number;
    lng: number;
    capacity: number;
    facilities: Record<string, boolean>;
    imageUrl?: string | null;
  }) {
    const created = await addShelter({
      ...input,
      currentOccupancy: 0,
      facilities: input.facilities,
      imageUrl: input.imageUrl ?? undefined,
    });
    setRows((prev) => [created as unknown as ShelterRow, ...prev]);
    setModalOpen(false);
    setNotice(`Shelter "${created.name}" added.`);
    window.setTimeout(() => setNotice(null), 4000);
  }

  async function handleOccupancy(shelterId: string, value: number) {
    const updated = await updateOccupancy(shelterId, value);
    setRows((prev) =>
      prev.map((r) => (r.id === shelterId ? (updated as unknown as ShelterRow) : r)),
    );
  }

  const totalCapacity = rows.reduce((sum, r) => sum + r.capacity, 0);
  const totalOccupancy = rows.reduce((sum, r) => sum + r.currentOccupancy, 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "open", "full", "closed"] as StatusFilter[]).map((key) => {
            const label = key === "all" ? "All" : key[0].toUpperCase() + key.slice(1);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  statusFilter === key
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-surface text-slate-400 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
          <span className="ml-1 text-xs uppercase tracking-wider text-slate-500">
            {filtered.length} of {rows.length} shelters
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ShelterCSVUploader />
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-md bg-accent px-4 py-2 text-sm font-bold uppercase tracking-wider text-slate-950 shadow-glow transition hover:bg-sky-300"
          >
            + Add New Shelter
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-3 rounded-md border border-severity-green-600 bg-severity-green-600/10 px-3 py-2 text-xs text-severity-green-400">
          {notice}
        </div>
      )}

      {/* Summary strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-eoc border border-border bg-surface p-3">
          <p className="eoc-label">SHELTERS</p>
          <p className="text-lg font-bold">{rows.length}</p>
        </div>
        <div className="rounded-eoc border border-border bg-surface p-3">
          <p className="eoc-label">TOTAL CAPACITY</p>
          <p className="text-lg font-bold">{totalCapacity.toLocaleString()}</p>
        </div>
        <div className="rounded-eoc border border-border bg-surface p-3">
          <p className="eoc-label">OCCUPIED</p>
          <p className="text-lg font-bold text-severity-amber-400">
            {totalOccupancy.toLocaleString()}
          </p>
        </div>
        <div className="rounded-eoc border border-border bg-surface p-3">
          <p className="eoc-label">FULL</p>
          <p className="text-lg font-bold text-severity-red-400">
            {rows.filter((r) => r.status === "full").length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-eoc border border-border bg-surface">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated/60 text-xs uppercase tracking-wider text-slate-400">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">District</th>
              <th className="px-4 py-3 font-semibold">Capacity vs Occupancy</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Facilities</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const pct = occupancyPercent(row);
              const meta = STATUS_META[row.status] ?? STATUS_META.closed;
              const facilities = facilitiesOf(row);
              return (
                <tr
                  key={row.id}
                  className="border-b border-border/60 transition last:border-0 hover:bg-surface-muted/60"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      {row.contactPerson
                        ? `Contact: ${row.contactPerson}`
                        : "No contact listed"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{row.district ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className={`h-full rounded-full ${barColor(pct)} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="whitespace-nowrap text-xs tabular-nums text-slate-300">
                        {row.currentOccupancy.toLocaleString()} /{" "}
                        {row.capacity.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.chip}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {facilities.length === 0 && (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                      {facilities.map((key) => (
                        <span
                          key={key}
                          className="rounded border border-border bg-surface-muted px-1.5 py-0.5 text-eoc-tiny font-medium uppercase tracking-wider text-slate-300"
                        >
                          {FACILITY_LABELS[key]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={row.currentOccupancy <= 0}
                        onClick={() => handleOccupancy(row.id, row.currentOccupancy - 1)}
                        className="rounded border border-border bg-surface-muted px-2 py-1 text-xs font-bold text-slate-300 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        title="Decrease occupancy"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        disabled={row.currentOccupancy >= row.capacity}
                        onClick={() => handleOccupancy(row.id, row.currentOccupancy + 1)}
                        className="rounded border border-border bg-surface-muted px-2 py-1 text-xs font-bold text-slate-300 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        title="Increase occupancy"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No shelters match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <AddShelterModal onClose={() => setModalOpen(false)} onSave={handleAdd} />
      )}
    </div>
  );
}

function AddShelterModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: {
    name: string;
    district: string;
    lat: number;
    lng: number;
    capacity: number;
    facilities: Record<string, boolean>;
    imageUrl?: string | null;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("Patna (Ganga)");
  const [lat, setLat] = useState("25.5941");
  const [lng, setLng] = useState("85.1376");
  const [capacity, setCapacity] = useState("300");
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    water: true,
    food: true,
    medical: false,
    electricity: true,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    const parsedCapacity = Number(capacity);
    if (!name.trim()) return setError("Name is required.");
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      return setError("Latitude and longitude must be numbers.");
    }
    if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
      return setError("Capacity must be a positive whole number.");
    }

    setBusy(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (photo) {
        imageUrl = await uploadShelterPhoto(photo);
      }
      await onSave({
        name: name.trim(),
        district: district.trim() || "Unknown",
        lat: parsedLat,
        lng: parsedLng,
        capacity: parsedCapacity,
        facilities: toggles,
        imageUrl,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add shelter.");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-eoc border border-border-strong bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="eoc-label text-accent">REGISTRY</p>
            <h2 className="text-lg font-bold">Add New Shelter</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition hover:bg-surface-muted hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="block">
            <span className="eoc-label">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              placeholder="Central Community Hall"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="eoc-label">District</span>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              >
                <option>Patna (Ganga)</option>
                <option>Ernakulam (Periyar)</option>
                <option>Kamrup (Brahmaputra)</option>
              </select>
            </label>
            <label className="block">
              <span className="eoc-label">Capacity</span>
              <input
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                inputMode="numeric"
                className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="eoc-label">Latitude</span>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                inputMode="decimal"
                className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="eoc-label">Longitude</span>
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                inputMode="decimal"
                className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <fieldset className="rounded-md border border-border p-3">
            <legend className="eoc-label px-1">Shelter Photo</legend>
            {photoPreview ? (
              <div className="flex items-center gap-3">
                <Image
                  src={photoPreview}
                  alt="Shelter preview"
                  width={96}
                  height={64}
                  unoptimized
                  className="h-16 w-24 rounded-md border border-border object-cover"
                />
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="w-max rounded border border-border px-2 py-1 text-xs text-slate-300 transition hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-slate-400 transition hover:border-accent hover:text-accent">
                <span className="text-lg">+</span>
                <span>Upload a shelter photo (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhoto(file);
                    setPhotoPreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            )}
          </fieldset>

          <fieldset className="rounded-md border border-border p-3">
            <legend className="eoc-label px-1">Facilities</legend>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(FACILITY_LABELS) as (keyof typeof FACILITY_LABELS)[]).map(
                (key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={!!toggles[key]}
                      onChange={(e) =>
                        setToggles((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="accent-sky-400"
                    />
                    {FACILITY_LABELS[key]}
                  </label>
                ),
              )}
            </div>
          </fieldset>

          {error && (
            <p className="rounded-md border border-severity-red-600 bg-severity-red-600/10 px-3 py-2 text-xs text-severity-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-bold uppercase tracking-wider text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Saving…" : "Add Shelter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
