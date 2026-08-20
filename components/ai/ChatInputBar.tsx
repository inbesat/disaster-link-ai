"use client";

// ---------------------------------------------------------------------
// components/ai/ChatInputBar.tsx — UI/UX Phase 6 · Step 5.
//
// Multi-modal composer pinned to the bottom of the chat pane:
//   • attachment (paperclip) control on the left
//   • auto-expanding textarea ("Message AI Commander…")
//   • mic (voice) control + filled-accent Send button on the right
// A 3-dot typing indicator idles directly above the bar while the avatar
// (or future stream) is processing.
// ---------------------------------------------------------------------

import { useEffect, useRef } from "react";
import { Mic, Paperclip, Send } from "lucide-react";

type ChatInputBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isProcessing: boolean;
};

export function ChatInputBar({
  value,
  onChange,
  onSend,
  isProcessing,
}: ChatInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 108)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="sticky bottom-0 border-t border-border bg-[rgb(var(--bg-primary-rgb)/95)] backdrop-blur">
      {isProcessing && (
        <div className="flex items-center gap-2 px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted">
          <span className="flex items-center gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-purple"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
          AI Advisor is drafting…
        </div>
      )}

      <div className="flex items-center gap-2 p-3 pt-2">
        <div className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border border-border bg-[var(--bg-secondary)] px-3 py-2 focus-within:border-accent-purple/60 focus-within:ring-1 focus-within:ring-accent-purple/40">
          <button
            type="button"
            aria-label="Attach file"
            className="rounded-md p-1.5 text-muted transition hover:bg-tertiary hover:text-slate-200"
          >
            <Paperclip className="h-4 w-4 shrink-0" aria-hidden />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Commander…"
            className="max-h-[108px] flex-1 resize-none bg-transparent text-sm text-slate-50 outline-none placeholder:text-muted"
          />

          <button
            type="button"
            aria-label="Voice input"
            className="rounded-md p-1.5 text-muted transition hover:bg-tertiary hover:text-slate-200"
          >
            <Mic className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || isProcessing}
          aria-label="Send message"
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-accent text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default ChatInputBar;
