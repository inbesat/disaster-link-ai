"use client";

import { useMemo, useState } from "react";
import { updateOccupancy } from "@/app/actions/shelters";
import { isOnline, OfflineSyncQueue } from "@/lib/field-offline";

export type FieldShelter = {
  id: string;
  name: string;
  district: string | null;
  capacity: number;
  currentOccupancy: number;
};

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function gaugeColor(pct: number) {
  if (pct >= 80) return "var(--severity-red-500)"; // critically full
  if (pct >= 50) return "var(--severity-amber-500)"; // filling up
  return "var(--severity-green-500)"; // comfortable
}

export default function FieldOccupancyUpdater({
  shelters: initial,
}: {
  shelters: FieldShelter[];
}) {
  const [shelters, setShelters] = useState<FieldShelter[]>(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const shelter = useMemo(
    () => shelters.find((s) => s.id === selectedId) ?? null,
    [shelters, selectedId],
  );

  const pct =
    shelter && shelter.capacity > 0
      ? Math.min(100, Math.round((shelter.currentOccupancy / shelter.capacity) * 100))
      : 0;
  const remaining = shelter
    ? Math.max(0, shelter.capacity - shelter.currentOccupancy)
    : 0;

  async function adjust(delta: number) {
    if (!shelter || saving) return;
    const next = Math.max(
      0,
      Math.min(shelter.capacity, shelter.currentOccupancy + delta),
    );
    setSaving(true);
    setFlash(null);
    try {
      if (!isOnline()) {
        // Offline: store the write locally, optimistically reflect it, and let
        // the OfflineBanner push it back when connectivity returns.
        OfflineSyncQueue.enqueue({
          url: "/api/shelters/occupancy",
          method: "POST",
          body: { shelterId: shelter.id, occupancy: next },
        });
        setShelters((prev) =>
          prev.map((s) =>
            s.id === shelter.id ? { ...s, currentOccupancy: next } : s,
          ),
        );
        setFlash(
          `Offline — saved locally (${next} occupied). Will auto-sync.`,
        );
        window.setTimeout(() => setFlash(null), 2200);
        return;
      }

      const updated = await updateOccupancy(shelter.id, next);
      setShelters((prev) =>
        prev.map((s) =>
          s.id === updated.id
            ? {
                id: updated.id,
                name: updated.name,
                district: updated.district,
                capacity: updated.capacity,
                currentOccupancy: updated.currentOccupancy,
              }
            : s,
        ),
      );
      const pctNow =
        updated.capacity > 0
          ? Math.round((updated.currentOccupancy / updated.capacity) * 100)
          : 0;
      setFlash(`${updated.currentOccupancy} occupied · ${pctNow}% full`);
      window.setTimeout(() => setFlash(null), 2000);
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "Update failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col gap-5 px-4 py-6">
      <header>
        <p className="eoc-label text-accent">FIELD RESPONDER</p>
        <h1 className="mt-1 text-2xl font-bold">Shelter Check-In</h1>
        <p className="mt-1 text-sm text-slate-400">
          Tap + to register arrivals, − to release beds at the gate.
        </p>
      </header>

      {/* Shelter selector */}
      <label htmlFor="shelter-select" className="eoc-label block">
        SELECT SHELTER
      </label>
      <select
        id="shelter-select"
        value={selectedId}
        disabled={saving}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-xl border-2 border-border bg-surface px-4 py-4 text-base font-semibold text-foreground focus:border-accent focus:outline-none"
      >
        {shelters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {s.district ?? "Unknown"}
          </option>
        ))}
      </select>

      {/* Circular occupancy gauge */}
      <div className="flex flex-col items-center rounded-eoc border-2 border-border bg-surface p-6">
        <div className="relative h-44 w-44">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="var(--border)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={gaugeColor(pct)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - pct / 100)}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black tabular-nums text-foreground">
              {pct}%
            </span>
            <span className="text-xs uppercase tracking-wider text-slate-400">full</span>
          </div>
        </div>

        <p className="mt-4 text-lg font-bold tabular-nums">
          {shelter ? shelter.currentOccupancy : "—"}
          <span className="text-sm font-semibold text-slate-400">
            {" "}
            / {shelter?.capacity ?? 0} occupied
          </span>
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {shelter ? `${remaining} bed${remaining === 1 ? "" : "s"} remaining` : ""}
        </p>
      </div>

      {/* Flash feedback */}
      <div
        aria-live="polite"
        className={`min-h-10 rounded-xl border px-4 py-2.5 text-center text-sm font-semibold ${
          flash
            ? flash.startsWith("Update failed") || flash.startsWith("Failed")
              ? "border-severity-red-600 bg-severity-red-600/10 text-severity-red-400"
              : "border-severity-green-600 bg-severity-green-600/10 text-severity-green-400"
            : "border-transparent bg-transparent text-transparent"
        }`}
      >
        {flash ?? "waiting…"}
      </div>

      {/* Massive increment / decrement */}
      <div className="flex items-stretch gap-4">
        <button
          type="button"
          disabled={saving || !shelter || shelter.currentOccupancy <= 0}
          onClick={() => void adjust(-1)}
          className="flex h-28 flex-1 items-center justify-center rounded-2xl border-2 border-border bg-surface text-6xl font-black text-severity-red-400 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Remove one person"
        >
          −
        </button>
        <button
          type="button"
          disabled={saving || !shelter}
          onClick={() => void adjust(1)}
          className="flex h-28 flex-1 items-center justify-center rounded-2xl border-2 border-severity-green-500 bg-severity-green-600/20 text-6xl font-black text-severity-green-400 transition active:scale-95"
          aria-label="Add one person"
        >
          +
        </button>
      </div>

      <p className="text-center text-xs text-slate-500">
        Occupancy auto-flags the shelter as “full” when it reaches capacity.
      </p>
    </main>
  );
}
