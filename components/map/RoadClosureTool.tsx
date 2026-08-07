"use client";

export type RoadClosureToolProps = {
  /** Whether map clicks are currently being captured as closures. */
  active: boolean;
  onToggle: () => void;
  /** Number of closures placed so far (shown as a badge). */
  count: number;
};

/**
 * Small floating control on the map. Toggles "closure mode": while active,
 * the DisasterMap captures each map click as a mock RoadClosure point.
 */
export default function RoadClosureTool({
  active,
  onToggle,
  count,
}: RoadClosureToolProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-left text-xs font-semibold transition ${
        active
          ? "border-severity-red-600 bg-severity-red-600 text-white shadow-glow-red"
          : "border-border bg-surface-elevated/95 text-foreground shadow-glow-accent backdrop-blur hover:border-severity-red-500"
      }`}
    >
      {active ? (
        <span>Click the map to mark a road (toggle again to stop)</span>
      ) : (
        <span>🚧 Mark Road Closed</span>
      )}
      {count > 0 && (
        <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-severity-red-400">
          {count}
        </span>
      )}
    </button>
  );
}
