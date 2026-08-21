"use client";

// ---------------------------------------------------------------------
// components/ai/ChatMessage.tsx — UI/UX Phase 6 · Step 3.
//
// Single tactical briefing bubble.
//   • user → right-aligned, tertiary-glass fill, crisp light text
//   • ai   → left-aligned, secondary fill with a thick accent-purple left
//            border, content rendered as GitHub-flavoured Markdown via
//            react-markdown + remark-gfm.
//
// The AI markdown gets the roadmap typographic treatment: prose-invert for
// dark surfaces, uppercase trackable h3/h4 headings, and bordered GFM
// tables (border-subtle hairlines + alternating row tint) so allocation
// grids read like official data.
// ---------------------------------------------------------------------

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import SourcesPanel from "./SourcesPanel";

type ChatMessageProps = {
  role: "user" | "ai";
  content: string;
  /** Display timestamp, e.g. "09:12 AM". */
  timestamp: string;
  /** RAG document references rendered under AI briefings (Step 7). */
  sources?: string[];
};

type Feedback = "up" | "down" | null;

export function ChatMessage({ role, content, timestamp, sources }: ChatMessageProps) {
  const isAI = role === "ai";
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [thanks, setThanks] = useState(false);
  const [fading, setFading] = useState(false);

  const handleFeedback = (dir: "up" | "down") => {
    setFeedback((prev) => (prev === dir ? null : dir));
    setThanks(true);
    setFading(false);
    window.setTimeout(() => setFading(true), 1400);
    window.setTimeout(() => {
      setThanks(false);
      setFading(false);
    }, 2000);
  };

  return (
    <div className={`flex w-full flex-col ${isAI ? "items-start" : "items-end"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2.5 ${
          isAI
            ? "border-l-4 border-accent-purple bg-secondary text-slate-100"
            : "border border-border bg-[var(--bg-tertiary)] text-slate-50"
        }`}
      >
        {isAI && (
          <p className="mb-1.5 flex items-center gap-1.5 text-eoc-tiny font-bold uppercase tracking-wider text-accent-purple">
            <Bot className="h-3 w-3" aria-hidden />
            AI Advisor
          </p>
        )}

        {isAI ? (
          <div className="prose prose-invert max-w-none text-sm leading-relaxed [&_h3]:mt-3 [&_h3]:text-[11px] [&_h3]:font-bold [&_h3]:uppercase [&_h3]:tracking-wider [&_h3]:text-accent-purple [&_h4]:mt-2 [&_h4]:text-xs [&_h4]:font-bold [&_h4]:uppercase [&_h4]:tracking-wider [&_h4]:text-slate-200 [&_p]:mt-0 [&_ul]:my-1 [&_ol]:my-1 [&_table]:mt-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_thead_th]:border [&_thead_th]:border-border-subtle [&_thead_th]:bg-tertiary [&_thead_th]:px-2 [&_thead_th]:py-1.5 [&_thead_th]:text-left [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wider [&_tbody_td]:border [&_tbody_td]:border-border-subtle [&_tbody_td]:px-2 [&_tbody_td]:py-1.5 [&_tbody_tr:nth-child(even)]:bg-[var(--bg-tertiary)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        )}
      </div>
      {isAI && sources && sources.length > 0 && <SourcesPanel sources={sources} />}

      <div className="mt-1 flex items-center gap-2 px-1">
        {isAI &&
          (thanks ? (
            <span
              className={`text-eoc-tiny font-semibold italic text-accent-success transition-opacity duration-500 ${
                fading ? "opacity-0" : "opacity-100"
              }`}
            >
              Thank you for the feedback!
            </span>
          ) : (
            <span className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => handleFeedback("up")}
                aria-pressed={feedback === "up"}
                aria-label="Helpful"
                title="Helpful"
                className={`rounded p-1 transition hover:bg-tertiary ${
                  feedback === "up"
                    ? "text-accent-purple"
                    : "text-muted hover:text-slate-300"
                }`}
              >
                <ThumbsUp
                  className="h-3 w-3"
                  aria-hidden
                  fill={feedback === "up" ? "currentColor" : "none"}
                />
              </button>
              <button
                type="button"
                onClick={() => handleFeedback("down")}
                aria-pressed={feedback === "down"}
                aria-label="Not helpful"
                title="Not helpful"
                className={`rounded p-1 transition hover:bg-tertiary ${
                  feedback === "down"
                    ? "text-accent-danger"
                    : "text-muted hover:text-slate-300"
                }`}
              >
                <ThumbsDown
                  className="h-3 w-3"
                  aria-hidden
                  fill={feedback === "down" ? "currentColor" : "none"}
                />
              </button>
            </span>
          ))}
        <span className="text-eoc-tiny tabular-nums text-muted">{timestamp}</span>
      </div>
    </div>
  );
}

export default ChatMessage;
