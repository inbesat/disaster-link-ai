"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/organization/page.tsx — UI/UX Phase 7 · Step 7.
//
// Admin organisation parameters:
//   • district cards with mini map thumbnails
//   • "Danger Mark" sliders whose live preview badges shift green → red as
//     the river level rises
//   • role × action permission matrix (sticky headers, checkbox cells)
// All wrapped in SettingsSection with a red "Admin Only" badge on the title.
// ---------------------------------------------------------------------

import { useState } from "react";
import { Building2, MapPin, ShieldAlert } from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import Toggle from "@/components/settings/Toggle";

type District = {
  id: string;
  name: string;
  population: string;
  active: boolean;
  warning: number;
  critical: number;
};

const DEFAULT_DISTRICTS: District[] = [
  {
    id: "d1",
    name: "Patna",
    population: "1.9M",
    active: true,
    warning: 2.5,
    critical: 3.4,
  },
  {
    id: "d2",
    name: "Purba Champaran",
    population: "0.9M",
    active: true,
    warning: 2.2,
    critical: 3.1,
  },
  {
    id: "d3",
    name: "Ernakulam",
    population: "0.7M",
    active: false,
    warning: 2.0,
    critical: 2.9,
  },
];

const ROLES = ["Super Admin", "Admin", "Incident Cmdr", "Responder", "Viewer"] as const;
const ACTIONS = [
  "Approve evacuation",
  "Dispatch boats",
  "Modify thresholds",
  "Read audit log",
  "Invoke 2FA reset",
] as const;

// baseRoles: role index → allowed action flags
const DEFAULT_MATRIX: boolean[][] = [
  [true, true, true, true, true],
  [true, true, false, true, true],
  [true, true, false, false, false],
  [false, false, false, false, false],
  [false, false, false, true, false],
];

function dangerHue(value: number, min: number, max: number): number {
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return Math.round(142 - t * 142); // 142 (green) → 0 (red)
}

const dangerBadge = (hue: number) => ({
  color: `hsl(${hue} 85% 55%)`,
  borderColor: `hsl(${hue} 85% 55% / 0.4)`,
  backgroundColor: `hsl(${hue} 85% 55% / 0.12)`,
});

function DangerSlider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const hue = dangerHue(value, min, max);
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <span
          className="rounded-full border px-2 py-px font-mono text-[10px] font-bold tabular-nums"
          style={dangerBadge(hue)}
        >
          {label} · {value.toFixed(1)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={value}
        aria-label={`${label} for river level`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-tertiary [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent"
        style={{
          background: `linear-gradient(to right, hsl(${hue} 85% 55%) 0%, hsl(${hue} 85% 55%) ${pct}%, #1e293b ${pct}%, #1e293b 100%)`,
        }}
      />
    </div>
  );
}

export default function OrganizationSettingsPage() {
  const [districts, setDistricts] = useState<District[]>(DEFAULT_DISTRICTS);
  const [matrix, setMatrix] = useState<boolean[][]>(DEFAULT_MATRIX);

  const updateDistrict = (id: string, patch: Partial<District>) => {
    setDistricts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };

  const toggleCell = (roleIdx: number, actionIdx: number) => {
    if (roleIdx === 0) return; // Super Admin permissions are locked
    setMatrix((prev) =>
      prev.map((row, r) =>
        r === roleIdx ? row.map((v, c) => (c === actionIdx ? !v : v)) : row,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title={
          <span className="flex items-center gap-2">
            Organization &amp; Districts
            <span className="flex items-center gap-1 rounded-full border border-accent-danger/40 bg-accent-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-danger">
              <ShieldAlert className="h-3 w-3" aria-hidden />
              Admin Only
            </span>
          </span>
        }
        description="High-level operational parameters — thresholds and role permissions."
        icon={Building2}
      >
        <div>
          {/* District cards */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {districts.map((district) => (
              <div
                key={district.id}
                className="overflow-hidden rounded-xl border border-border bg-secondary"
              >
                {/* Mini map thumbnail placeholder */}
                <div className="relative h-24 bg-gradient-to-br from-[#1e293b] to-[#0b1220]">
                  <div className="absolute left-4 right-4 top-1/2 h-8 -translate-y-1/2 rounded-md border border-white/10" />
                  <div className="absolute left-1/2 top-3 h-16 w-16 -translate-x-1/2 rotate-6 rounded-sm border border-white/10" />
                  <div className="absolute left-[30%] top-[30%] h-8 w-8 rotate-45 rounded-sm border border-accent-purple/30" />
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 font-mono text-[10px] text-slate-200">
                    <MapPin className="h-3 w-3 text-accent-purple" aria-hidden />
                    {district.name}
                  </span>
                </div>

                <div className="flex flex-col gap-4 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-primary">{district.name}</p>
                      <p className="text-[11px] text-muted">
                        Population {district.population}
                      </p>
                    </div>
                    <Toggle
                      checked={district.active}
                      onChange={(v) => updateDistrict(district.id, { active: v })}
                      label={`${district.name} active`}
                    />
                  </div>

                  <DangerSlider
                    label="Warning mark"
                    value={district.warning}
                    min={1.5}
                    max={2.9}
                    unit="m"
                    onChange={(v) => updateDistrict(district.id, { warning: v })}
                  />
                  <DangerSlider
                    label="Danger mark"
                    value={district.critical}
                    min={2.6}
                    max={4}
                    unit="m"
                    onChange={(v) => updateDistrict(district.id, { critical: v })}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-muted">
            Slider badges interpolate green → red: keep danger marks high enough for early
            warning while avoiding fatigue.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title={
          <span className="flex items-center gap-2">
            Role × Action Permissions
            <span className="flex items-center gap-1 rounded-full border border-accent-danger/40 bg-accent-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-danger">
              Admin Only
            </span>
          </span>
        }
        description="What each role may action without escalation."
        icon={ShieldAlert}
      >
        <div className="max-h-80 w-full overflow-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-[var(--bg-tertiary)]">
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
                <th className="border-b border-subtle px-3 py-3 font-semibold">Action</th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    className="border-b border-subtle px-2 py-3 text-center font-semibold"
                  >
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-secondary">
              {ACTIONS.map((action, actionIdx) => (
                <tr key={action} className="hover:bg-[var(--bg-tertiary)]/40">
                  <td className="sticky left-0 bg-secondary px-3 py-2.5 font-semibold text-slate-100">
                    {action}
                  </td>
                  {ROLES.map((role, roleIdx) => {
                    const checked = matrix[roleIdx][actionIdx];
                    return (
                      <td key={role} className="px-2 py-2.5">
                        <div className="flex justify-center">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={checked}
                            aria-label={`${action} · ${role}`}
                            disabled={roleIdx === 0}
                            onClick={() => toggleCell(roleIdx, actionIdx)}
                            className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                              checked
                                ? "border-accent bg-accent text-slate-950"
                                : "border-border bg-tertiary"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {checked && (
                              <svg
                                viewBox="0 0 12 12"
                                className="h-2.5 w-2.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden
                              >
                                <path d="M2 6.5 5 9l5-6" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-muted">
          Super Admin cells are locked. Toggling updates the corresponding role/action at
          runtime.
        </p>
      </SettingsSection>
    </div>
  );
}
