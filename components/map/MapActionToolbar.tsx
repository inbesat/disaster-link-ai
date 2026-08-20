"use client";

// ---------------------------------------------------------------------
// components/map/MapActionToolbar.tsx — right-edge map action stack.
//
// Consolidates every ad-hoc `absolute right-N top-M z-10` action button
// that used to float independently over DisasterMap (Share Alert was its
// own absolutely-positioned button at right-3 top-24; the Measure / Road
// Closure / Draw stack lived in a separate absolutely-positioned div at
// right-3 top-32). Two independent absolute stacks drifted apart and got
// clipped by sibling panels sharing the same edge (the command-center
// mobile bottom sheet and the /map MeasurementToolbar painted on top of
// the lower buttons, leaving only a thin colored sliver visible).
//
// This component turns the whole right-edge stack into ONE self-contained
// flex column:
//   • consistent vertical `gap` and equal-width buttons (`w-full`),
//   • a `max-w` cap so the stack can never grow into a sibling panel,
//   • its own stacking context (`isolate` + explicit z-index) so nothing
//     else floating on the map edge can paint over it,
//   • a `className` prop so every page can dock it clear of its own
//     panels (command center, full-screen map workspace, allocation map).
// ---------------------------------------------------------------------

import type { ReactNode } from "react";
import RoadClosureTool from "@/components/map/RoadClosureTool";

export type MapActionToolbarProps = {
  /**
   * Positioning classes. The default docks the stack to the right edge,
   * below the ScenarioSelector / LayerControl, and — crucially — above
   * every other floating map control AND the command-center mobile bottom
   * sheet (z-40) so it is never clipped by a sibling panel.
   */
  className?: string;
  measuring: boolean;
  points: [number, number][];
  onToggleMeasure: () => void;
  onClearMeasurement: () => void;
  closingMode: boolean;
  closureCount: number;
  onToggleClosing: () => void;
  drawingRisk: boolean;
  drawPoints: [number, number][];
  onToggleDrawing: () => void;
  onClearDrawing: () => void;
  onBroadcastDrawing: () => void;
  /** Optional first item in the stack (e.g. the Share Alert button). */
  shareAlert?: ReactNode;
};

export default function MapActionToolbar({
  className = "absolute right-3 top-16 z-50 isolate md:top-24",
  measuring,
  points,
  onToggleMeasure,
  onClearMeasurement,
  closingMode,
  closureCount,
  onToggleClosing,
  drawingRisk,
  drawPoints,
  onToggleDrawing,
  onClearDrawing,
  onBroadcastDrawing,
  shareAlert,
}: MapActionToolbarProps) {
  const buttonBase =
    "w-full justify-start rounded-md border px-2.5 py-1 text-left text-[10px] font-semibold leading-tight transition backdrop-blur md:px-3 md:py-2 md:text-xs md:leading-normal";
  const quiet =
    "border-border bg-surface-elevated/95 text-foreground shadow-glow-accent hover:border-accent";
  const danger =
    "border-border bg-surface-elevated/95 text-severity-red-400 shadow-glow-red hover:border-severity-red-500";

  return (
    <div
      className={`flex w-max max-w-[15rem] flex-col gap-1 md:gap-2 ${className}`}
      aria-label="Map actions"
    >
      {shareAlert}

      <button
        type="button"
        onClick={onToggleMeasure}
        className={`${buttonBase} ${
          measuring
            ? "border-accent bg-accent text-slate-950"
            : quiet
        }`}
      >
        {measuring ? "Stop Measuring" : "Measure"}
      </button>

      {points.length > 0 && (
        <button
          type="button"
          onClick={onClearMeasurement}
          className={`${buttonBase} ${danger}`}
        >
          Clear Measurement
        </button>
      )}

      <RoadClosureTool
        active={closingMode}
        onToggle={onToggleClosing}
        count={closureCount}
      />

      <button
        type="button"
        onClick={onToggleDrawing}
        className={`${buttonBase} ${
          drawingRisk
            ? "border-amber-400 bg-amber-400 text-slate-950"
            : "border-border bg-surface-elevated/95 text-foreground shadow-glow-accent hover:border-amber-400"
        }`}
      >
        {drawingRisk ? "Stop Drawing" : "Draw Risk Area"}
      </button>

      {drawPoints.length > 0 && (
        <>
          <button
            type="button"
            onClick={onClearDrawing}
            className={`${buttonBase} ${danger}`}
          >
            Clear Drawing
          </button>
          <button
            type="button"
            disabled={drawPoints.length < 3}
            onClick={onBroadcastDrawing}
            className={`${buttonBase} border-amber-400 bg-amber-400/15 text-amber-300 shadow-glow transition hover:bg-amber-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Broadcast Drawing
          </button>
        </>
      )}
    </div>
  );
}