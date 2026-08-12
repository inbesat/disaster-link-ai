"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { sendFeedback } from "@/app/actions/alerts";
import type { ReactElement } from "react";

/**
 * Copy raw markdown to the clipboard. Always resolves; surfaces errors via
 * toast so the UI never crashes.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

type Rating = "up" | "down" | null;

const ICON_CLASS = "h-3.5 w-3.5";

function ActionButton({
  title,
  active,
  activeClass,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  activeClass?: string;
  onClick: () => void;
  children: ReactElement;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-slate-500 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200 ${
        active ? (activeClass ?? "") : ""
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Small action row pinned to the bottom-right of an AI message bubble:
 *   • copy raw markdown to clipboard
 *   • share (Web Share API, clipboard fallback)
 *   • 👍 / 👎 RLHF feedback (mock — wired to Supabase later)
 */
export default function MessageActions({
  markdown,
  messageId,
}: {
  markdown: string;
  messageId: string;
}) {
  const [rating, setRating] = useState<Rating>(null);

  const handleCopy = async () => {
    const ok = await copyToClipboard(markdown);
    if (ok) toast.success("Plan copied to clipboard");
    else toast.error("Failed to copy plan.");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SafeSphere Emergency Plan",
          text: markdown,
        });
        return;
      } catch {
        // User dismissed the native share sheet — do nothing.
      }
    }
    // Fallback: copy so it can be pasted into WhatsApp / Teams.
    const ok = await copyToClipboard(markdown);
    if (ok) toast.success("Plan copied — paste it in WhatsApp or Teams");
    else toast.error("Unable to share plan.");
  };

  const handleFeedback = (choice: "up" | "down") => {
    const next = rating === choice ? null : choice;
    setRating(next);
    if (next) {
      void sendFeedback({ messageId, rating: next }).then(() => {
        toast.success("Feedback recorded.");
      });
    } else {
      toast.success("Feedback removed.");
    }
  };

  return (
    <div className="mt-2 flex items-center justify-end gap-0.5 border-t border-slate-800/70 pt-2">
      {/* Copy */}
      <ActionButton title="Copy plan" onClick={() => void handleCopy()}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={ICON_CLASS}
        >
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
      </ActionButton>

      {/* Share */}
      <ActionButton title="Share plan" onClick={() => void handleShare()}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={ICON_CLASS}
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="m16 6-4-4-4 4" />
          <path d="M12 2v13" />
        </svg>
      </ActionButton>

      <span className="mx-1 h-4 w-px bg-slate-800" />

      {/* Feedback */}
      <ActionButton
        title="Good plan"
        active={rating === "up"}
        activeClass="border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
        onClick={() => handleFeedback("up")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={ICON_CLASS}
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      </ActionButton>
      <ActionButton
        title="Poor plan"
        active={rating === "down"}
        activeClass="border-red-500/50 bg-red-500/10 text-red-400"
        onClick={() => handleFeedback("down")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={ICON_CLASS}
        >
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
        </svg>
      </ActionButton>
    </div>
  );
}
