"use client";

// ---------------------------------------------------------------------
// components/public/ai/QuickPrompts.tsx — Phase 6 · Step 3 + Step 5 ·
// Panic-proof quick prompts.
//
// Scared users shouldn't have to type. This is a horizontally scrollable
// row of pill buttons sitting just above the chat composer; each pill is
// a ready-made safety question. Tapping one fires it through
// `onSelect(prompt, reply)` where `reply` is either:
//
//   • a structured ResponseCard (Step 5) — the pack intent returns a
//     tappable checklist, shelter returns a route card with a map
//     snippet, family returns a one-tap "I am safe" action card, or
//   • a plain canned text reply (the road intent keeps its text answer).
//
// Labels and card content are translated (quick_*/card_* keys), so a
// Hindi-speaking citizen sees the right words. The row scrolls without a
// visible scrollbar so it reads as a calm single strip.
// ---------------------------------------------------------------------

import { Backpack, HeartPulse, MapPin, Route, Users, type LucideIcon } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import type { ResponseCardData } from "./ResponseCards";

type Intent = {
  key: "pack" | "shelter" | "road" | "family" | "medical";
  icon: LucideIcon;
};

const INTENTS: Intent[] = [
  { key: "pack", icon: Backpack },
  { key: "shelter", icon: MapPin },
  { key: "road", icon: Route },
  { key: "family", icon: Users },
  { key: "medical", icon: HeartPulse },
];

type QuickPromptsProps = {
  /** Fired with the prompt text and its reply (a ResponseCard or plain text). */
  onSelect: (prompt: string, reply: string | ResponseCardData) => void;
  /** Disable taps while a reply is being drafted. */
  disabled?: boolean;
};

export function QuickPrompts({ onSelect, disabled = false }: QuickPromptsProps) {
  const { t } = useTranslation();

  /** The structured card for an intent — null falls back to a text reply. */
  const cardFor = (key: Intent["key"]): ResponseCardData | null => {
    switch (key) {
      case "pack":
        return {
          kind: "checklist",
          title: t("card_pack_title"),
          items: [
            t("card_item_medicines"),
            t("card_item_id"),
            t("card_item_water"),
            t("card_item_torch"),
            t("card_item_powerbank"),
            t("card_item_documents"),
          ],
          readyLabel: t("card_ready"),
        };
      case "shelter":
        return {
          kind: "route",
          title: t("card_shelter_title"),
          walkDistance: t("card_shelter_walk"),
          to: t("card_shelter_to"),
          shelterName: t("card_shelter_name"),
        };
      case "family":
        return {
          kind: "action",
          title: t("card_action_title"),
          description: t("card_action_desc"),
          actionLabel: t("card_action_button"),
        };
      case "medical":
        // Step 7 — simulated AI confidence threshold: complex medical needs
        // sit below it (confidence < 0.4), so the assistant instantly
        // escalates to a human instead of guessing.
        return {
          kind: "escalation",
          title: t("escalation_title"),
          message: t("escalation_message"),
          actionLabel: t("escalation_button"),
          phoneNumber: "1070",
          note: t("escalation_note"),
        };
      default:
        return null;
    }
  };

  /** Plain canned text for intents that have no structured card. */
  const textReplyFor = (key: Intent["key"]): string | null => {
    switch (key) {
      case "road":
        return t("quick_road_reply");
      default:
        return null;
    }
  };

  return (
    <div
      role="group"
      aria-label={t("quick_prompts_label")}
      className="flex shrink-0 gap-2 overflow-x-auto pb-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {INTENTS.map(({ key, icon: Icon }) => {
        const label = t(`quick_${key}`);
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              triggerLightHaptic();
              onSelect(label, cardFor(key) ?? textReplyFor(key) ?? t("sahayak_reply"));
            }}
            disabled={disabled}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 py-2 pl-3 pr-4 text-[0.8125rem] font-semibold text-[#cfe0f2] transition hover:border-[#34d399]/60 hover:bg-[#34d399]/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34d399] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon aria-hidden className="h-4 w-4 text-[#34d399]" strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default QuickPrompts;
