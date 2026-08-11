"use client";

// ---------------------------------------------------------------------
// components/gov/ai/PlannerChat.tsx — Phase 9 · Step 6 · Tool-Calling
// Chat Interface (left pane).
//
// The commander's conversational surface:
//   • Standard thread — user bubbles right (blue), AI bubbles left with
//     the signature purple accent border.
//   • Suggested Tool Prompts as clickable pills above the composer
//     ("Who is free right now?", "Can Shelter B handle 500 evacuees?",
//     "What if the bridge floods?").
//   • Mock response flow — picking a prompt (or sending free text) posts
//     the user message and an AI bubble that first shows a small
//     "Querying Database…" badge, then resolves to the text answer ~1.7s
//     later. One query is in flight at a time.
//   • Sticky composer at the bottom with a mic button (voice input
//     placeholder) and a glowing purple send button.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { Database, FileText, Mic, Scale, Send, Sparkles, Terminal } from "lucide-react";
import RAGSourcesPanel, {
  DEFAULT_SOURCES,
  NDMA_SOURCE,
  type RAGSource,
} from "./RAGSourcesPanel";

type ChatMsg = {
  id: string;
  role: "user" | "ai";
  content: string;
  /** True while the mock tool call is still resolving. */
  querying?: boolean;
  /** RAG citations rendered under the bubble (Step 7). */
  sources?: RAGSource[];
};

type ToolPrompt = { label: string; answer: string; sources?: RAGSource[] };

const WELCOME: ChatMsg = {
  id: "welcome",
  role: "ai",
  content:
    "Commander, the swarm is online. Ask about responder availability, shelter capacity or flood scenarios — or tap a suggested query below.",
  sources: DEFAULT_SOURCES,
};

const NDMA = NDMA_SOURCE;
const DMP: RAGSource = {
  title: "District DMP 2024 (Section: Shelter Management)",
  icon: FileText,
};
const SOP: RAGSource = {
  title: "State SOP (Section: Route Diversion)",
  icon: Scale,
};

const TOOL_PROMPTS: ToolPrompt[] = [
  {
    label: "Who is free right now?",
    answer:
      "12 responders are free. 45 are online — 33 deployed (Zone A evacuation, NH-01 staging, Punpun ghat). 12 available for immediate tasking.",
    sources: [
      { title: "District DMP 2024 (Section: Personnel)", icon: FileText },
      NDMA,
      { title: "State SOP", icon: Scale },
    ],
  },
  {
    label: "Can Shelter B handle 500 evacuees?",
    answer:
      "No — Shelter B (Zilla School) has 380 of 620 berths occupied, leaving 240 free. Recommend routing 260 evacuees to Shelter D (Community Hall, 348 free).",
    sources: [DMP, NDMA, SOP],
  },
  {
    label: "What if the bridge floods?",
    answer:
      "Daulatpur bridge approach floods at 3.4 m (projected +18 h). Reroute via NH-01 staging point: +14 min travel, 6 km detour. 60 transports can absorb the shift.",
    sources: [SOP, NDMA, DMP],
  },
];

const GENERIC_ANSWER =
  "Acknowledged — the swarm is processing your request. Current picture: Punpun gauge 3.1 m and rising; Zone A evacuation window open until 13:00 IST. Review the action plan in the right pane for next steps.";

const RESOLVE_MS = 1700;

export function PlannerChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Refs guard against same-frame double submits (pills + Enter) and
  // keep pending resolve timers cleanable on unmount.
  const queryingRef = useRef(false);
  const resolveTimers = useRef<number[]>([]);

  const querying = messages.some((msg) => msg.querying);

  // Clear any in-flight resolve timers if the chat unmounts.
  useEffect(() => {
    const timers = resolveTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, querying]);

  // Auto-grow the composer (cap at 5 lines).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 108)}px`;
  }, [draft]);

  const submit = (raw: string) => {
    const text = raw.trim();
    if (!text || queryingRef.current) return;
    queryingRef.current = true;

    const prompt = TOOL_PROMPTS.find((p) => p.label === text);
    const answer = prompt?.answer ?? GENERIC_ANSWER;
    const sources = prompt?.sources ?? DEFAULT_SOURCES;
    const aiId = `ai-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: text },
      { id: aiId, role: "ai", content: "", querying: true, sources },
    ]);
    setDraft("");

    // Mock tool call: resolve the AI bubble after a short delay.
    const timer = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiId ? { ...msg, content: answer, querying: false } : msg,
        ),
      );
      queryingRef.current = false;
    }, RESOLVE_MS);
    resolveTimers.current.push(timer);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(draft);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-primary">
      {/* Thread header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-purple/15 text-accent-purple shadow-[0_0_12px_rgba(139,92,246,0.3)]">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">AI Commander</p>
            <p className="text-[10px] uppercase tracking-wider text-muted">
              Gov planner · tool-calling
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-purple/40 bg-accent-purple/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-purple">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-purple"
            aria-hidden
          />
          Live
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        aria-live="polite"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {messages.map((msg) =>
          msg.role === "user" ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-xl rounded-br-md bg-accent-primary px-3.5 py-2.5 text-sm leading-relaxed text-white">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex flex-col items-start">
              <div className="max-w-[92%] rounded-xl rounded-bl-md border-l-4 border-accent-purple bg-secondary px-3.5 py-2.5">
                {msg.querying ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-accent-purple/40 bg-accent-purple/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-purple">
                    <Database className="h-3 w-3 animate-pulse" aria-hidden />
                    Querying Database…
                  </span>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
                    {msg.content}
                  </p>
                )}
              </div>
              {/* Step 7 — RAG grounding accordion under every answer. */}
              {!msg.querying && <RAGSourcesPanel sources={msg.sources} />}
            </div>
          ),
        )}
      </div>

      {/* Suggested tool prompts */}
      <div className="shrink-0 px-3 pb-1">
        <p className="eoc-label mb-1 px-1">Suggested tool prompts</p>
        <div className="flex flex-wrap gap-1.5">
          {TOOL_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => submit(prompt.label)}
              disabled={querying}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-accent-purple/30 bg-accent-purple/10 px-2.5 py-1.5 text-[11px] font-semibold text-accent-purple transition hover:bg-accent-purple/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Terminal className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{prompt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Composer — pinned below the scrollable thread by the flex column */}
      <div className="shrink-0 border-t border-white/10 bg-primary/95 px-3 py-2.5 backdrop-blur">
        <div className="flex items-end gap-2">
          <div className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-secondary px-3 py-2 focus-within:border-accent-purple/60 focus-within:ring-1 focus-within:ring-accent-purple/40">
            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI commander…"
              className="max-h-[108px] flex-1 resize-none bg-transparent text-sm text-slate-50 outline-none placeholder:text-muted"
            />
            <button
              type="button"
              aria-label="Voice input"
              title="Voice input"
              className="rounded-md p-1.5 text-muted transition hover:bg-tertiary hover:text-accent-purple"
            >
              <Mic className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={() => submit(draft)}
            disabled={!draft.trim() || querying}
            aria-label="Send message"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-accent-purple text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] transition hover:bg-accent-purple/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlannerChat;
