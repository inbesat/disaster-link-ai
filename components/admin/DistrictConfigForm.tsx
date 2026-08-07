"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { saveDistrictConfig } from "@/app/actions/admin";

const DISTRICTS = ["Patna", "Sitamarhi", "Muzaffarpur", "Darbhanga", "Samastipur"];

export default function DistrictConfigForm() {
  const [district, setDistrict] = useState("Patna");
  const [rainThreshold, setRainThreshold] = useState(120);
  const [riverDanger, setRiverDanger] = useState(2.5);
  const [autoSms, setAutoSms] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const config = {
      district,
      criticalRainThresholdMm: rainThreshold,
      riverDangerMarkM: riverDanger,
      autoAlertSms: autoSms,
    };
    const res = await saveDistrictConfig(config);
    setSaving(false);
    if (res.success) {
      toast.success(`Saved threshold config for ${res.saved.district}`);
    } else {
      toast.error("Failed to save configuration");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Threshold controls */}
        <div className="rounded-lg border border-[#1c2740] bg-[#0b1120] p-5 space-y-6">
          <div>
            <div className="flex items-center">
              <label
                htmlFor="district"
                className="text-sm font-medium text-foreground"
              >
                District
              </label>
            </div>
            <select
              id="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-amber-400/60"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d} className="bg-surface-elevated">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <SliderField
            id="rain"
            label="Critical Rain Threshold"
            hint="mm / 24h"
            min={0}
            max={300}
            step={5}
            value={rainThreshold}
            onChange={setRainThreshold}
            display={`${rainThreshold} mm`}
          />

          <SliderField
            id="river"
            label="River Danger Mark"
            hint="meters"
            min={0}
            max={10}
            step={0.1}
            value={riverDanger}
            onChange={setRiverDanger}
            display={`${riverDanger.toFixed(1)} m`}
          />

          <div className="flex items-center justify-between rounded-md border border-border bg-surface-elevated px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Auto-Alert SMS Channels
              </p>
              <p className="text-xs text-slate-500">
                Push critical alerts to field responders via SMS.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoSms}
              onClick={() => setAutoSms((v) => !v)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                autoSms ? "bg-amber-500" : "bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  autoSms ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Live summary */}
        <div className="rounded-lg border border-[#1c2740] bg-[#0b1120] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Live Summary
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <PreviewRow label="District" value={district} />
            <PreviewRow
              label="Alert triggered when rain ≥"
              value={`${rainThreshold} mm/24h`}
            />
            <PreviewRow
              label="River danger at"
              value={`${riverDanger.toFixed(1)} m`}
            />
            <PreviewRow
              label="SMS auto-alert"
              value={autoSms ? "Enabled" : "Disabled"}
            />
          </dl>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SliderField({
  id,
  label,
  hint,
  min,
  max,
  step,
  value,
  onChange,
  display,
}: {
  id: string;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label} <span className="text-xs text-slate-500">({hint})</span>
        </label>
        <span className="rounded bg-surface-elevated px-2 py-0.5 text-xs font-semibold text-amber-300">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-amber-500"
      />
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#151d31] pb-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}