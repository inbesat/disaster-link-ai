"use client";

export const QUICK_ACTIONS: string[] = [
  "Generate a 48-hour evacuation plan for Patna",
  "Check shelter capacity near the river",
  "What is the fleet requirement for 500 evacuees?",
  "Generate a medical triaging plan based on current shelter capacity",
  "Identify supply chain bottlenecks for a 48-hour flood",
];

/**
 * Horizontal, scrollable chip list of demo prompts shown above the chat
 * input. Clicking a chip submits it directly to the planner.
 */
export default function QuickActions({
  onSelect,
  disabled = false,
}: {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-slate-500">
        Quick Actions
      </span>
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onSelect(action)}
          disabled={disabled}
          className="shrink-0 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-red-500/50 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
