"use client";

// ---------------------------------------------------------------------
// components/gov/ai/PlannerChat.tsx — Chat Interface (left pane).
//
// The commander's conversational surface:
//   • User bubbles: right-aligned, bg-blue-600, white text
//   • AI bubbles: left-aligned, bg-[#111827], white text, purple left border 3px
//   • Timestamps on each message (text-xs text-slate-500)
//   • Suggested tool prompts as clickable pills
//   • RAG Sources expandable section below AI messages
//   • Composer with voice input placeholder + purple send button
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
  querying?: boolean;
  sources?: RAGSource[];
  timestamp: string;
};

type ToolPrompt = { label: string; answer: string; sources?: RAGSource[] };

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/** Simple markdown-like rendering: **bold**, - bullets, 1. numbered, newlines */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Bold: **text**
    const boldParsed = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // Bullet: - item
    if (trimmed.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-purple-400 mt-0.5">•</span>
          <span
            className="text-sm leading-relaxed text-slate-100"
            dangerouslySetInnerHTML={{ __html: boldParsed.slice(2) }}
          />
        </div>,
      );
      return;
    }

    // Numbered: 1. item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-purple-400 font-mono text-xs mt-0.5">{numMatch[1]}.</span>
          <span
            className="text-sm leading-relaxed text-slate-100"
            dangerouslySetInnerHTML={{ __html: boldParsed.replace(/^\d+\.\s+/, "") }}
          />
        </div>,
      );
      return;
    }

    // Empty line = spacer
    if (!trimmed) {
      elements.push(<div key={i} className="h-1.5" />);
      return;
    }

    // Regular text with bold
    elements.push(
      <p
        key={i}
        className="text-sm leading-relaxed text-slate-100"
        dangerouslySetInnerHTML={{ __html: boldParsed }}
      />,
    );
  });

  return elements;
}

const WELCOME: ChatMsg = {
  id: "welcome",
  role: "ai",
  content:
    "Commander, the swarm is online. Ask about responder availability, shelter capacity or flood scenarios — or tap a suggested query below.",
  sources: DEFAULT_SOURCES,
  timestamp: formatTime(new Date()),
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
    label: "Plan evacuation for Patna",
    answer:
      "**Evacuation Plan — Patna District:**\n\n1. **Trigger:** Punpun gauge crossing 3.0 m warning level\n2. **Zones at Risk:** A (1,240 residents), B (860 residents), C (partial)\n3. **Shelter Allocation:**\n   - Shelter A (Rampur School): 400 berths\n   - Shelter B (Zilla School): 350 berths\n   - Shelter C (Community Hall): 310 berths\n   - Overflow → NH-01 Staging (mobile tents)\n4. **Transport:** 60 buses + 12 ambulances staged at NH-01\n5. **Timeline:** Zone A evacuation begins 13:00 IST\n\n**Status:** Plan drafted — pending commander approval.",
    sources: [
      { title: "District DMP 2024 (Section: Evacuation)", icon: FileText },
      NDMA,
      SOP,
    ],
  },
  {
    label: "Check shelter capacity",
    answer:
      "**Shelter Capacity Summary:**\n\n- **Shelter A (Rampur School):** 400/620 occupied · 220 free\n- **Shelter B (Zilla School):** 350/620 occupied · 270 free\n- **Shelter C (Community Hall):** 310/450 occupied · 140 free\n- **Shelter D (NH-01 Staging):** 0/200 occupied · 200 free\n\n**Total Available:** 830 berths\n**Total Required:** 2,100 residents\n\n**⚠️ Shortfall:** 1,270 berths — activate overflow protocol.",
    sources: [
      { title: "District DMP 2024 (Section: Shelter Management)", icon: FileText },
      NDMA,
    ],
  },
  {
    label: "Allocate boats to Village X",
    answer:
      "**Boat Allocation — Village X:**\n\n- **8 boats dispatched** from Punpun ghat staging\n- **Route:** NH-01 → Punpun bridge → Village X canal\n- **ETA:** 45 minutes\n- **Capacity:** 120 evacuees per round-trip\n- **Assigned:** Team Delta (12 responders)\n\n**Status:** Deployment confirmed — en route.",
    sources: [
      { title: "District DMP 2024 (Section: Water Rescue)", icon: FileText },
      SOP,
    ],
  },
  {
    label: "Show flood prediction",
    answer:
      "**Flood Prediction — 48h Outlook:**\n\n- **Current Gauge:** Punpun at 3.1 m (rising)\n- **Projected Peak:** 3.8 m at +18h (above danger level 3.4 m)\n- **GLOFAS Alert:** RED — Major flooding expected\n- **Affected Area:** Zones A, B, C downstream\n- **Confidence:** 87%\n\n**Recommendation:** Initiate pre-emptive evacuation before 13:00 IST window closes.",
    sources: [
      { title: "GLOFAS Gauge Telemetry", icon: Database },
      NDMA,
    ],
  },
  {
    label: "What if rainfall increases 50%?",
    answer:
      "**Scenario: +50% Rainfall Intensity:**\n\n- **Gauge Rise:** Punpun reaches 4.2 m (severe flood) at +14h\n- **New Risk Zones:** D and E now at risk (previously safe)\n- **Additional Residents:** 680 more require evacuation\n- **Shelter Demand:** +400 berths needed\n- **Bridge Impact:** Daulatpur Bridge floods at +10h (8h earlier)\n\n**⚠️ Critical:** Emergency escalation to State HQ recommended.",
    sources: [SOP, NDMA, { title: "IMD Forecast Data", icon: Database }],
  },
];

const GENERIC_ANSWER =
  "Acknowledged — the swarm is processing your request.\n\n**Current Picture:**\n- Punpun gauge: 3.1 m and rising\n- Zone A evacuation window open until 13:00 IST\n\nReview the action plan in the right pane for next steps.";

const RESOLVE_MS = 1700;

export function PlannerChat() {
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryingRef = useRef(false);
  const resolveTimers = useRef<number[]>([]);

  const querying = messages.some((msg) => msg.querying);

  useEffect(() => {
    const timers = resolveTimers.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, querying]);

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
    const now = formatTime(new Date());

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: text, timestamp: now },
      { id: aiId, role: "ai", content: "", querying: true, sources, timestamp: now },
    ]);
    setDraft("");

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
    <div className="flex min-h-0 flex-1 flex-col bg-[#0a0f1a]">
      {/* Thread header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#111827]/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 shadow-[0_0_12px_rgba(139,92,246,0.3)]">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">AI Commander</p>
            <p className="text-[0.625rem] uppercase tracking-wider text-slate-500">
              Gov planner · tool-calling
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-400/10 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-purple-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" aria-hidden />
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
            <div key={msg.id} className="flex flex-col items-end gap-1">
              <div className="max-w-[85%] rounded-xl rounded-br-md bg-blue-600 px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-[0_0_12px_rgba(37,99,235,0.2)]">
                {msg.content}
              </div>
              <span className="text-[0.625rem] text-slate-500">{msg.timestamp}</span>
            </div>
          ) : (
            <div key={msg.id} className="flex flex-col items-start gap-1">
              <div className="max-w-[92%] rounded-xl rounded-bl-md border-l-[3px] border-purple-400 bg-[#111827] px-3.5 py-2.5">
                {msg.querying ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-400/40 bg-purple-400/10 px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-purple-400">
                    <Database className="h-3 w-3 animate-pulse" aria-hidden />
                    Querying Database…
                  </span>
                ) : (
                  <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>
                )}
              </div>
              <span className="text-[0.625rem] text-slate-500">{msg.timestamp}</span>
              {!msg.querying && <RAGSourcesPanel sources={msg.sources} />}
            </div>
          ),
        )}
      </div>

      {/* Suggested prompts — horizontal scrollable chips */}
      <div className="shrink-0 px-3 pb-1">
        <p className="mb-1 px-1 text-[0.625rem] font-bold uppercase tracking-wider text-slate-500">
          Suggested prompts
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TOOL_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              onClick={() => submit(prompt.label)}
              disabled={querying}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-[#111827] px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="truncate">{prompt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-white/10 bg-[#111827]/80 px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-end gap-2">
          <div className="flex min-h-[44px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0a0f1a] px-3 py-2 focus-within:border-purple-400/60 focus-within:ring-1 focus-within:ring-purple-400/30">
            <textarea
              ref={textareaRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI commander…"
              className="max-h-[108px] flex-1 resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              aria-label="Voice input"
              title="Voice input"
              className="rounded-md p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-purple-400"
            >
              <Mic className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={() => submit(draft)}
            disabled={!draft.trim() || querying}
            aria-label="Send message"
            className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] transition hover:bg-purple-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlannerChat;
