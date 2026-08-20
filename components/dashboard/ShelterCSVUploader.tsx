"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { addShelter, type ShelterFacilities } from "@/app/actions/shelters";

type ParsedRow = {
  name: string;
  district?: string;
  lat: number;
  lng: number;
  capacity: number;
  facilities: ShelterFacilities;
};

type ImportState =
  | { state: "idle" }
  | { state: "ready"; rows: ParsedRow[]; fileName: string }
  | { state: "importing" }
  | { state: "done"; imported: number; skipped: number; message: string }
  | { state: "error"; message: string };

const FACILITY_KEYS: (keyof ShelterFacilities)[] = [
  "water",
  "food",
  "medical",
  "electricity",
];

function parseFacilities(value: string | undefined): ShelterFacilities {
  if (!value) return {};
  const flags: ShelterFacilities = {};
  for (const part of String(value)
    .split(/[;,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)) {
    if ((FACILITY_KEYS as string[]).includes(part)) {
      flags[part as keyof ShelterFacilities] = true;
    }
  }
  return flags;
}

function normalizeRow(raw: Record<string, unknown>): ParsedRow | null {
  const name = String(raw.name ?? "").trim();
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  const capacity = Number(raw.capacity);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!Number.isInteger(capacity) || capacity <= 0) return null;

  return {
    name,
    district: raw.district ? String(raw.district).trim() : undefined,
    lat,
    lng,
    capacity,
    facilities: parseFacilities(raw.facilities ? String(raw.facilities) : undefined),
  };
}

export default function ShelterCSVUploader() {
  const [status, setStatus] = useState<ImportState>({ state: "idle" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.some((e) => e.type === "FieldMismatch")) {
          setStatus({
            state: "error",
            message:
              "CSV has a malformed row. Expected columns: name, lat, lng, capacity, facilities (optional district).",
          });
          return;
        }
        const rows = result.data
          .map(normalizeRow)
          .filter((r): r is ParsedRow => r !== null);
        if (rows.length === 0) {
          setStatus({
            state: "error",
            message: "No valid rows found. Ensure columns: name, lat, lng, capacity.",
          });
          return;
        }
        setStatus({ state: "ready", rows, fileName: file.name });
      },
    });
  }

  async function confirmImport() {
    if (status.state !== "ready") return;
    setStatus({ state: "importing" });

    let imported = 0;
    let skipped = 0;
    let firstError: string | null = null;

    for (const row of status.rows) {
      try {
        await addShelter({
          name: row.name,
          district: row.district,
          lat: row.lat,
          lng: row.lng,
          capacity: row.capacity,
          currentOccupancy: 0,
          facilities: row.facilities,
        });
        imported += 1;
      } catch (e: unknown) {
        skipped += 1;
        if (!firstError) firstError = e instanceof Error ? e.message : String(e);
      }
    }

    setStatus({
      state: "done",
      imported,
      skipped,
      message: firstError
        ? `${imported} imported · ${skipped} skipped (first error: ${firstError})`
        : `All ${imported} shelters imported successfully.`,
    });
  }

  function reset() {
    setStatus({ state: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      className={dragging ? "ring-2 ring-accent" : ""}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <label
        htmlFor="shelter-csv-input"
        className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm font-semibold transition ${
          status.state === "ready" || status.state === "done"
            ? "border-severity-green-600 bg-severity-green-600/10 text-severity-green-400"
            : dragging
              ? "border-accent bg-accent-soft text-accent"
              : "border-border bg-surface text-slate-300 hover:border-accent hover:text-accent"
        }`}
      >
        {dragging ? "⬇ Drop the CSV here" : "⤓ Import CSV"}
      </label>
      <input
        ref={inputRef}
        id="shelter-csv-input"
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {(status.state === "ready" || status.state === "importing") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-eoc border border-border-strong bg-surface p-6 shadow-2xl">
            <p className="eoc-label text-accent">BULK IMPORT</p>
            <h3 className="mt-1 text-lg font-bold">
              {status.state === "ready" ? status.fileName : "Importing bulk shelters…"}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {status.state === "importing"
                ? "Creating shelters…"
                : status.state === "ready"
                  ? `${status.rows.length} rows parsed. Review below before importing.`
                  : ""}
            </p>

            {status.state === "ready" && (
              <div className="mt-4 max-h-64 overflow-auto rounded-md border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-elevated/60 text-foreground">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Lat</th>
                      <th className="px-3 py-2 font-semibold">Lng</th>
                      <th className="px-3 py-2 font-semibold">Capacity</th>
                      <th className="px-3 py-2 font-semibold">Facilities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.rows.map((row, i) => (
                      <tr key={i} className="border-t border-border/60 text-slate-300">
                        <td className="px-3 py-1.5">{row.name}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.lat}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.lng}</td>
                        <td className="px-3 py-1.5 tabular-nums">{row.capacity}</td>
                        <td className="px-3 py-1.5">
                          {Object.entries(row.facilities)
                            .filter(([, v]) => v)
                            .map(([k]) => k)
                            .join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={status.state === "importing"}
                className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-semibold text-slate-300 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmImport()}
                disabled={status.state === "importing"}
                className="flex-1 rounded-md bg-severity-red-600 px-4 py-2 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-severity-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status.state === "importing" ? "Importing…" : "Confirm Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {(status.state === "done" || status.state === "error") && (
        <div
          className={`mt-2 rounded-md border px-3 py-2 text-xs ${
            status.state === "done"
              ? "border-severity-green-600 bg-severity-green-600/10 text-severity-green-400"
              : "border-severity-red-600 bg-severity-red-600/10 text-severity-red-400"
          }`}
        >
          {status.message}
          <button
            type="button"
            onClick={reset}
            className="ml-2 font-semibold underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
