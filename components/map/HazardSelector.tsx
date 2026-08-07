"use client";

import type { DisasterType } from "@/lib/disasters/disaster-types";
import { DISASTER_TYPE_LIST } from "@/lib/disasters/disaster-types";

type HazardSelectorProps = {
  value: DisasterType;
  onChange: (value: DisasterType) => void;
};

export default function HazardSelector({ value, onChange }: HazardSelectorProps) {
  return (
    <div>
      <p className="eoc-label mb-2">HAZARD TYPE</p>
      <select
        aria-label="Select hazard type"
        value={value}
        onChange={(e) => onChange(e.target.value as DisasterType)}
        className="w-full rounded-md border border-border bg-surface-elevated/95 px-3 py-2 text-sm font-medium text-foreground focus:border-accent focus:outline-none"
      >
        {DISASTER_TYPE_LIST.map((hazard) => (
          <option key={hazard.id} value={hazard.id}>
            {hazard.icon} {hazard.label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-slate-500">
        {DISASTER_TYPE_LIST.find((hazard) => hazard.id === value)?.description}
      </p>
    </div>
  );
}
