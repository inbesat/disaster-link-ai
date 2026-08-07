"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sparkles, X } from "lucide-react";

// ---------------------------------------------------------------------
// components/ui/OnboardingTooltip.tsx
// Phase 22 · Step 8 — one-time onboarding callout.
//
// A floating, high-z-index tooltip that wraps an anchor (e.g. the AI
// Commander button). Shows once per browser: dismissing it ("Got it!" or
// the ✕) writes a flag to localStorage, so returning users never see it
// again. Blue "call-to-action" background, title + short description.
// ---------------------------------------------------------------------

type Placement = "bottom-left" | "bottom-right" | "top-right" | "top-left";

const PLACEMENT_CLASSES: Record<Placement, { bubble: string; arrow: string }> = {
  "bottom-left": { bubble: "top-full right-0 mt-3", arrow: "-top-1 right-6 rotate-45" },
  "bottom-right": { bubble: "top-full left-0 mt-3", arrow: "-top-1 left-6 rotate-45" },
  "top-right": { bubble: "bottom-full left-0 mb-3", arrow: "-bottom-1 left-6 rotate-45" },
  "top-left": { bubble: "bottom-full right-0 mb-3", arrow: "-bottom-1 right-6 rotate-45" },
};

type OnboardingTooltipProps = {
  /** Bold callout title, e.g. "New: AI Commander". */
  title: string;
  /** One short sentence, e.g. "Ask the AI Commander for an evacuation plan!" */
  description: string;
  /** localStorage key. Change it to re-show the tooltip for new features. */
  storageKey?: string;
  /** Where the bubble sits relative to the anchor. */
  placement?: Placement;
  /** The anchor element the tooltip floats next to. */
  children: ReactNode;
};

export function OnboardingTooltip({
  title,
  description,
  storageKey = "drip_onboarding_ai_chat_v1",
  placement = "bottom-left",
  children,
}: OnboardingTooltipProps) {
  const [dismissed, setDismissed] = useState(true); // SSR-safe: hidden first
  const [visible, setVisible] = useState(false); // gates the entrance animation
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read the localStorage flag once we're on the client.
  useEffect(() => {
    let suppressed = false;
    try {
      suppressed = localStorage.getItem(storageKey) === "1";
    } catch {
      /* storage unavailable — show the tooltip anyway */
    }
    if (suppressed) {
      setDismissed(true);
    } else {
      setDismissed(false);
      // Small delay so the bubble pops in after the page settles.
      timer.current = setTimeout(() => setVisible(true), 350);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [storageKey]);

  function dismiss() {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* storage unavailable — dismiss for this session only */
    }
    setDismissed(true);
  }

  if (dismissed) return <>{children}</>;

  const pos = PLACEMENT_CLASSES[placement];

  return (
    <span className="relative inline-flex">
      {children}

      <span
        className={`pointer-events-none absolute z-50 w-64 rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 p-4 text-white shadow-[0_8px_30px_rgba(2,132,199,0.45)] transition-all duration-300 ${
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-1.5 opacity-0"
        } ${pos.bubble}`}
      >
        {/* Arrow pointing at the anchor */}
        <span className={`absolute h-3 w-3 bg-sky-600 ${pos.arrow}`} aria-hidden />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss tip"
          className="pointer-events-auto absolute right-2 top-2 rounded-md p-1 text-sky-100 transition hover:bg-white/15 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {title}
        </p>
        <p className="mt-1.5 text-sm leading-snug">{description}</p>

        <button
          type="button"
          onClick={dismiss}
          className="pointer-events-auto mt-3 w-full rounded-lg bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-700 transition hover:bg-sky-50 active:scale-[0.98]"
        >
          Got it!
        </button>
      </span>
    </span>
  );
}

export default OnboardingTooltip;
