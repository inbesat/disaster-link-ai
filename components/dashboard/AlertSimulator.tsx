"use client";

import { useState } from "react";
import { simulateCriticalAlert } from "@/app/actions/alerts";

// Aligned with lib/data-ingestion/fetcher.ts demo districts + the map focus.
const DISTRICTS = [
  { name: "Patna (Ganga)", lat: 25.5941, lng: 85.1376 },
  { name: "Ernakulam (Periyar)", lat: 9.9816, lng: 76.2999 },
  { name: "Kamrup (Brahmaputra)", lat: 26.3161, lng: 91.5984 },
];

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; sms: number }
  | { state: "error"; message: string };

export default function AlertSimulator() {
  const [district, setDistrict] = useState(DISTRICTS[0].name);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function run() {
    const selected = DISTRICTS.find((d) => d.name === district) ?? DISTRICTS[0];
    setStatus({ state: "loading" });

    const result = await simulateCriticalAlert({
      district: selected.name,
      lat: selected.lat,
      lng: selected.lng,
    });

    if (result.ok) {
      const sms = result.result.smsResults?.filter((r) => r.ok).length ?? 0;
      setStatus({ state: "success", sms });
    } else {
      setStatus({ state: "error", message: result.error });
    }
  }

  return (
    <div className="relative overflow-hidden rounded-eoc border-2 border-severity-red-600/60 bg-surface">
      {/* Diagonal striped warning trim — clearly "dev tools" */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-2"
        style={{
          background:
            "repeating-linear-gradient(45deg, #dc2626 0 10px, #fbbf24 10px 20px)",
        }}
      />
      <div className="p-5 pt-6">
        <p className="eoc-label text-severity-amber-400">DEV TOOLS · DEMO SIMULATOR</p>
        <h3 className="mt-1 text-sm font-bold text-severity-red-400">
          Simulate a Critical Flood Alert
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Directly runs the alert engine (bypasses the ML model) — fires SMS + in-app
          alerts to the selected district.
        </p>

        <label htmlFor="sim-district" className="eoc-label mt-4 block mb-1.5">
          District
        </label>
        <select
          id="sim-district"
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setStatus({ state: "idle" });
          }}
          className="w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          {DISTRICTS.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => void run()}
          disabled={status.state === "loading"}
          className="mt-4 w-full rounded-md bg-severity-red-600 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-glow-red transition hover:bg-severity-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status.state === "loading"
            ? "Triggering…"
            : "⚡ SIMULATE CRITICAL FLOOD ALERT"}
        </button>

        {status.state === "success" && (
          <div className="mt-3 rounded-md border border-severity-green-600 bg-severity-green-600/10 px-3 py-2 text-xs text-severity-green-400">
            Alert triggered for {district}
            {status.sms > 0
              ? ` · ${status.sms} SMS dispatched`
              : " · recorded (no SMS # configured)"}
            .
          </div>
        )}
        {status.state === "error" && (
          <div className="mt-3 rounded-md border border-severity-red-600 bg-severity-red-600/10 px-3 py-2 text-xs text-severity-red-400">
            Failed: {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
