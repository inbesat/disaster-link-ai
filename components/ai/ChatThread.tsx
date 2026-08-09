"use client";

// ---------------------------------------------------------------------
// components/ai/ChatThread.tsx — UI/UX Phase 6 · Step 2.
//
// Scrollable tactical conversation container. Header carries the thread
// identity + a live marker; the body is the overflow-y-auto message list
// seeded with mock briefings; a disabled composer hints at the next step.
// ---------------------------------------------------------------------

import ChatMessage from "./ChatMessage";
import ChatInputBar from "./ChatInputBar";
import SuggestedPrompts from "./SuggestedPrompts";
import { History, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ThreadMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  sources?: string[];
};

const nowTime = () =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());

const CANNED_SOURCES = [
  "NDMA Guideline 4.2",
  "Live GLOFAS Forecast",
  "District DMP 2024",
];

const CANNED_REPLY =
  "On it.\n\n### Acknowledged — Patna flood desk\n\n• Assigned incident code **PNP-6-B1**.\n• 3 shelters within 2 km of Zone A hold 1,240 free berths.\n• 60 transport + 12 ambulances staged at NH-01 staging point.\n\n| Step | ETA | Team |\n| --- | --- | --- |\n| Broadcast | 12:30 | District Control Room |\n| Evacuation | 13:00 | NDRF + 120 volunteers |\n| Boat deploy | 12:45 | Boat Unit 4 |";

const MOCK_MESSAGES: ThreadMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Assess flood risk in the Punpun block for the next 48 hours.",
    timestamp: "09:12 AM",
  },
  {
    id: "m2",
    role: "ai",
    content:
      "Analysis complete. Punpun gauge crosses the 2.5 m warning mark in ~14h and reaches 3.4 m (critical) by +18h. 12 habitations are inside the projected envelope. Recommend pre-emptive evacuation of low-lying pockets and dispatch of 6 boats to Punpun ghat.",
    timestamp: "09:12 AM",
    sources: ["NDMA Guideline 4.2", "District DMP 2024", "Live GLOFAS Forecast"],
  },
  {
    id: "m3",
    role: "user",
    content: "Good. Draft the evacuation order for Sonepur & Rampur now.",
    timestamp: "09:14 AM",
  },
  {
    id: "m4",
    role: "ai",
    content:
      "Draft ready.\n\n### Evacuation Order — Sonepur & Rampur\n\n• Evacuate by 13:00 IST (~4h lead).\n• Use NH-01; the Daulatpur bridge approach is closed.\n\n#### Allocated resources\n\n| Unit | Qty | Assigned |\n| --- | --- | --- |\n| Boats | 12 | Sonepur ghat |\n| Ambulances | 6 | Rampur school |\n| Bus | 8 | NH-01 staging |\n| Medics | 20 | To shelters |\n\nApproval will broadcast to all field units once you confirm.",
    timestamp: "09:15 AM",
    sources: ["NDMA Guideline 4.2", "District DMP 2024"],
  },
];

export function ChatThread({ onHistoryToggle }: { onHistoryToggle?: () => void }) {
  const [messages, setMessages] = useState<ThreadMessage[]>(MOCK_MESSAGES);
  const [draft, setDraft] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isProcessing]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || isProcessing) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text, timestamp: nowTime() },
    ]);
    setDraft("");
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "ai",
          content: CANNED_REPLY,
          timestamp: nowTime(),
          sources: CANNED_SOURCES,
        },
      ]);
    }, 2200);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0a0f1a]">
      {/* Thread header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-purple/15 text-accent-purple">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-sm font-semibold text-primary">AI Command Advisor</p>
        </div>
        <div className="flex items-center gap-2">
          {onHistoryToggle && (
            <button
              type="button"
              onClick={onHistoryToggle}
              aria-label="Toggle chat history"
              title="Chat history"
              className="rounded-md p-1.5 text-muted transition hover:bg-tertiary hover:text-accent-purple"
            >
              <History className="h-4 w-4" aria-hidden />
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-purple/40 bg-accent-purple/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-purple">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-purple"
              aria-hidden
            />
            Live
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            sources={message.sources}
          />
        ))}
      </div>

      {/* Prompts + composer */}
      <SuggestedPrompts onSelect={setDraft} />
      <ChatInputBar
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        isProcessing={isProcessing}
      />
    </div>
  );
}

export default ChatThread;
