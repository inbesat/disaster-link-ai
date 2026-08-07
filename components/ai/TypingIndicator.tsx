"use client";

/**
 * "AI Commander is synthesizing data…" with a 3-dot pulse animation.
 * Rendered at the bottom of the chat feed while the model is thinking.
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-2xl rounded-bl-sm border border-slate-800 bg-slate-900 px-4 py-3">
      <span
        className="flex h-6 w-6 items-center justify-center text-sm"
        aria-hidden="true"
      >
        🛰️
      </span>
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
        AI Commander is synthesizing data
      </span>
      <span className="flex items-center gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-severity-red-500 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-severity-red-500 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-severity-red-500" />
      </span>
    </div>
  );
}
