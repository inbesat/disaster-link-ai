"use client";

// ---------------------------------------------------------------------
// components/map/MeasurementToolbar.tsx — UI/UX Phase 5 · Step 7.
//
// Vertical GIS tool stack pinned mid-right of the screen: Distance (Ruler),
// Area (Polygon) and Elevation Profile (Mountain). Each button has a holo
// tooltip (left side), and the selected tool shows an accent "filled" state
// instead of the quiet ghost. Controlled via `tool`/`onToolChange` when
// given, otherwise it manages its own active tool.
// ---------------------------------------------------------------------------

import { useState, type ReactNode } from "react";
import { Hexagon, Mountain, Ruler } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

export type MeasurementTool = "distance" | "area" | "elevation";

const TOOLS: { id: MeasurementTool; label: string; hint: string; icon: ReactNode }[] = [
  {
    id: "distance",
    label: "Measure distance",
    hint: "Ruler · straight-line / path distance",
    icon: <Ruler className="h-5 w-5" aria-hidden />,
  },
  {
    id: "area",
    label: "Measure area",
    hint: "Polygon · flood-extent area",
    icon: <Hexagon className="h-5 w-5" aria-hidden />,
  },
  {
    id: "elevation",
    label: "Elevation profile",
    hint: "Mountain · slope along a line",
    icon: <Mountain className="h-5 w-5" aria-hidden />,
  },
];

type MeasurementToolbarProps = {
  /** Controlled tool (null = none). Omit to self-manage. */
  tool?: MeasurementTool | null;
  onToolChange?: (tool: MeasurementTool | null) => void;
  className?: string;
};

function Tooltip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <span className="group relative flex items-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 mr-3 w-max max-w-[220px] -translate-y-1/2 rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-slate-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

export function MeasurementToolbar({
  tool,
  onToolChange,
  className = "",
}: MeasurementToolbarProps) {
  const [internal, setInternal] = useState<MeasurementTool | null>(null);
  const active = tool !== undefined ? tool : internal;

  const select = (id: MeasurementTool) => {
    const next = active === id ? null : id;
    if (tool !== undefined) onToolChange?.(next);
    else setInternal(next);
  };

  return (
    <div className={`${className}`}>
      <div className="flex flex-col gap-2.5" aria-label="Map measurement tools">
        {TOOLS.map((t) => {
          const isActive = active === t.id;
          return (
            <Tooltip key={t.id} label={`${t.label} — ${t.hint}`}>
              <IconButton
                label={t.label}
                size="md"
                variant={isActive ? "filled" : "floating"}
                aria-pressed={isActive}
                onClick={() => select(t.id)}
              >
                {t.icon}
              </IconButton>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

export default MeasurementToolbar;
