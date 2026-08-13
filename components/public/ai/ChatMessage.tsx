"use client";

// ---------------------------------------------------------------------
// components/public/ai/ChatMessage.tsx — Phase 6 · Steps 2 + 10 · the
// WhatsApp-style message bubble for the Nova safety companion.
//
// Nova must feel like a friend, not a dashboard — so messages render
// as soft, light WhatsApp-style bubbles on the sheet's calm dark surface:
//
//   • ai   → left-aligned, classic WhatsApp green (#dcf8c6), dark ink,
//            large readable text, small robot avatar chip beside it.
//   • user → right-aligned, soft WhatsApp blue, same dark ink.
//
// Both bubbles use the classic messenger shape — rounded-2xl with the
// corner nearest the sender clipped flat (rounded-bl-[4px] for AI on the
// left, rounded-br-[4px] for the user on the right), like a tail without
// needing a pseudo-element. Timestamps sit beneath in muted type.
//
// Step 10 — the RLHF feedback loop: at the bottom of every AI response
// bubble sit tiny, muted Thumbs Up / Thumbs Down buttons (the same
// pattern as the AI Commander's ChatMessage). Tapping toggles the filled
// state; Thumbs Down briefly reveals a tiny "What was wrong?" input, and
// submitting (or voting either way) thanks the citizen — the data feeds
// the government's "is the AI giving good advice?" loop.
// ---------------------------------------------------------------------

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ReactNode } from "react";

type ChatMessageProps = {
  /** Who is speaking — drives side, colour and the avatar chip. */
  role: "user" | "ai";
  /** Bubble content (plain text or rich nodes). */
  children: ReactNode;
  /** Display timestamp, e.g. "10:24 AM" — rendered under the bubble. */
  timestamp?: string;
  /** Optional pill rendered above an AI bubble (e.g. "⚡ Offline AI Mode"). */
  badge?: ReactNode;
};

type Feedback = "up" | "down" | null;

export function ChatMessage({ role, children, timestamp, badge }: ChatMessageProps) {
  const { t } = useTranslation();
  const isAI = role === "ai";

  const [feedback, setFeedback] = useState<Feedback>(null);
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  const vote = (dir: "up" | "down") => {
    triggerLightHaptic();
    const next: Feedback = feedback === dir ? null : dir;
    setFeedback(next);
    setReason("");
    // The "What was wrong?" input only follows a Thumbs Down.
    setShowReason(next === "down");
    // Only Thumbs Up thanks immediately — the down path thanks AFTER the
    // optional reason is submitted, so the loop never double-toasts.
    if (next === "up") {
      showToast("success", { title: t("feedback_thanks"), duration: 2600 });
    }
  };

  const submitReason = () => {
    triggerLightHaptic();
    setShowReason(false);
    showToast("success", { title: t("feedback_thanks"), duration: 2600 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }}
      className={`flex w-full items-end gap-2 ${isAI ? "justify-start" : "justify-end"}`}
    >
      {/* Avatar — only Nova gets one; the user needs no face here. */}
      {isAI && (
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a4d3c] ring-1 ring-[#dcf8c6]/30 shadow-[0_2px_10px_rgba(16,185,129,0.25)]"
        >
          <Bot className="h-[18px] w-[18px] text-[#dcf8c6]" strokeWidth={2.2} />
        </span>
      )}

      <div className={`flex max-w-[82%] flex-col ${isAI ? "items-start" : "items-end"}`}>
        {/* Source badge (AI only) — e.g. "⚡ Offline AI Mode" / "☁️ Live Data". */}
        {isAI && badge && <div className="mb-1">{badge}</div>}
        <div
          className={`px-3.5 py-2.5 shadow-[0_2px_12px_rgba(0,0,0,0.25)] ${
            isAI
              ? "rounded-2xl rounded-bl-[4px] bg-[#dcf8c6] text-[#1a2e1e]"
              : "rounded-2xl rounded-br-[4px] bg-[#c8e6fb] text-[#12283a]"
          }`}
        >
          <p className="text-[0.9375rem] leading-relaxed sm:text-base">{children}</p>
        </div>

        {/* Meta row — feedback (AI only) + timestamp, tiny and muted. */}
        <div className="mt-1 flex items-center gap-0.5 px-1">
          {isAI && (
            <span className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => vote("up")}
                aria-pressed={feedback === "up"}
                aria-label={t("feedback_helpful")}
                title={t("feedback_helpful")}
                className={`rounded p-1 transition hover:bg-white/10 ${
                  feedback === "up"
                    ? "text-[#16a34a]"
                    : "text-[var(--dl-text-muted)] hover:text-[#4ade80]"
                }`}
              >
                <ThumbsUp
                  className="h-3.5 w-3.5"
                  aria-hidden
                  fill={feedback === "up" ? "currentColor" : "none"}
                />
              </button>
              <button
                type="button"
                onClick={() => vote("down")}
                aria-pressed={feedback === "down"}
                aria-label={t("feedback_not_helpful")}
                title={t("feedback_not_helpful")}
                className={`rounded p-1 transition hover:bg-white/10 ${
                  feedback === "down"
                    ? "text-[#dc2626]"
                    : "text-[var(--dl-text-muted)] hover:text-[#f87171]"
                }`}
              >
                <ThumbsDown
                  className="h-3.5 w-3.5"
                  aria-hidden
                  fill={feedback === "down" ? "currentColor" : "none"}
                />
              </button>
            </span>
          )}

          {timestamp && (
            <span className="text-[0.625rem] tabular-nums text-[var(--dl-text-muted)]">
              {timestamp}
            </span>
          )}
        </div>

        {/* Step 10 — optional "What was wrong?" reason input (Thumbs Down). */}
        <AnimatePresence>
          {isAI && showReason && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="mt-1.5 flex w-full items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitReason();
                    }
                  }}
                  placeholder={t("feedback_what_wrong")}
                  aria-label={t("feedback_what_wrong")}
                  className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-[#7f96ad]"
                />
                <button
                  type="button"
                  onClick={submitReason}
                  aria-label={t("feedback_send")}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#34d399]/20 text-[#6ee7b7] transition hover:bg-[#34d399]/35"
                >
                  <Send className="h-3 w-3" aria-hidden />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default ChatMessage;
