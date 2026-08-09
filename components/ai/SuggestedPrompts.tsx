"use client";

// ---------------------------------------------------------------------
// components/ai/SuggestedPrompts.tsx — UI/UX Phase 6 · Step 4.
//
// One-tap prompt chips so commanders don't have to type under pressure.
// Horizontally scrollable (scrollbar hidden), pill-shaped ghost buttons
// with a subtle hover state. Rendered above the composer inside the chat
// pane.
// ---------------------------------------------------------------------

const PROMPTS = [
  "Plan evacuation for Patna",
  "Check shelter capacity",
  "Allocate boats to Village X",
  "Show flood prediction",
] as const;

type SuggestedPromptsProps = {
  /** Called with the tapped prompt text. */
  onSelect: (prompt: string) => void;
};

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Suggested prompts"
    >
      {PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="shrink-0 whitespace-nowrap rounded-full border border-border bg-surface-elevated/70 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-accent hover:bg-accent/10 hover:text-accent"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

export default SuggestedPrompts;
