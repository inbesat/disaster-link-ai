"use client";

// ---------------------------------------------------------------------
// components/public/ai/SafetyTipsFeed.tsx — Phase 6 · Step 8 · Dashboard
// Safety Tips Carousel.
//
// Proactive advice even when the citizen isn't actively chatting. A
// small, visually distinct card for the Public Dashboard that features
// the Sahayak avatar and rotates through bite-sized safety tips every
// 5 seconds:
//
//   • The tip text cross-fades through Framer's AnimatePresence while a
//     row of dots tracks the active slide.
//   • Hovering/focusing the card pauses the rotation (mouse users can
//     read a tip at their own pace); reduced-motion turns the rotation
//     into a plain fade.
//   • The whole card announces changes via aria-live so screen-reader
//     users hear each tip as it appears.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, Lightbulb } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/lib/i18n/LanguageContext";
import { useBatterySaver } from "@/hooks/useBatterySaver";

/** Rotating tip keys — the display strings live in the locale files. */
const TIP_KEYS: TranslationKey[] = ["tip_1", "tip_2", "tip_3", "tip_4", "tip_5"];

/** Rotation cadence — one tip every 5 seconds. */
const ROTATE_MS = 5000;

export function SafetyTipsFeed() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Phase 13 · Step 8 — under 20% battery the rotation pauses entirely
  // (the current tip stays visible); the banner tells the citizen to pull
  // down to refresh. A dead phone is deadly, so no timer churn.
  const { isBatteryLow } = useBatterySaver();

  // Rotate every 5s; pause on hover/focus so the current tip can be read.
  // The interval no-ops while the tab is hidden so a backgrounded dashboard
  // doesn't keep churning slides.
  useEffect(() => {
    if (paused || isBatteryLow) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((i) => (i + 1) % TIP_KEYS.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused, isBatteryLow]);

  const tipKey = TIP_KEYS[index];

  return (
    <div
      role="group"
      aria-label={t("tips_label")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative overflow-hidden rounded-[var(--dl-radius-sm)] border border-[#34d399]/25 bg-gradient-to-br from-[#12314a]/90 to-[#0a1d30]/90 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)]"
    >
      {/* Soft green ambient glow — Sahayak's calm signature. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#16a34a]/15 blur-2xl"
      />

      <div className="relative flex items-center gap-3">
        {/* Sahayak avatar — the owl/robot companion. */}
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1e4a39] ring-1 ring-[#dcf8c6]/30 shadow-[0_2px_14px_rgba(16,185,129,0.35)]">
          <Bot className="h-6 w-6 text-[#dcf8c6]" strokeWidth={2.1} aria-hidden />
          <span
            aria-hidden
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#34d399] ring-2 ring-[#0e2a45]"
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-wider text-[#6ee7b7]">
            <Lightbulb className="h-3 w-3" aria-hidden />
            {t("tips_label")}
          </p>
          <div aria-live="polite" className="mt-0.5 min-h-[2.5em]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={tipKey}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="text-[0.9375rem] font-semibold leading-snug text-white"
              >
                {t(tipKey)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Slide dots — decorative indicator (the active tip is already
          announced via aria-live); clickable to jump on mouse/touch. */}
      <div className="relative mt-3 flex items-center gap-1.5" aria-hidden>
        {TIP_KEYS.map((key, i) => (
          <button
            key={key}
            type="button"
            tabIndex={-1}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? "w-6 bg-[#34d399]" : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default SafetyTipsFeed;
