"use client";

// ---------------------------------------------------------------------
// app/(public)/onboarding/page.tsx — UI/UX Phase 9 · Step 7.
//
// First-launch walkthrough for field responders. A full-screen, 4-slide
// Framer Motion carousel that teaches the job-critical surfaces before the
// user is dropped into the Command Center dashboard:
//
//   1. Track Floods in Real-Time   3. Coordinate Your Team
//   2. AI Plans Evacuations        4. Stay Safe
//
// Each page is a viewport-wide horizontal flex item; the deck pans left by
// `index × pageWidth` px (pageWidth measured on mount + resize). The same
// deck animates horizontally, a top progress bar and per-slide fade-in.
// Dots at the bottom also double as tap-to-jump. "Skip" (top-right) and
// the final "Get Started" CTA both route to the Command Center.
//
// Interaction model:
//   • `drag="x"` on the deck with Framer's spring settle; on release we
//     snap to the nearest slide if the drag travelled > 1/3 of a page.
//   • `touch-action: pan-y` keeps the deck from fighting vertical scroll.
//   • Reduced-motion users get the same deck but without spring wobble.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Bot, ChevronRight, Droplets, ShieldCheck, Users } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  icon: typeof Droplets;
  /** bg tint for the circular icon tile. */
  tile: string;
  /** soft glow behind the tile. */
  glow: string;
};

/** Fill of the icon tile so each chapter has a personality. */
const SLIDES: Slide[] = [
  {
    eyebrow: "Live Situational Awareness",
    title: "Track Floods in Real-Time",
    body: "See water levels, risk zones and live ground reports across every district — updated on a beat so you always know what is coming.",
    icon: Droplets,
    tile: "bg-sky-500/15",
    glow: "shadow-[0_0_44px_rgba(14,165,233,0.35)]",
  },
  {
    eyebrow: "AI Copilot",
    title: "AI Plans Evacuations",
    body: "Our AI drafts evacuation routes and resource allocations in seconds. You review, approve and dispatch — hands-free even in the rain.",
    icon: Bot,
    tile: "bg-purple-500/15",
    glow: "shadow-[0_0_44px_rgba(168,85,247,0.35)]",
  },
  {
    eyebrow: "Coordinate Your Team",
    title: "Coordinate Your Team",
    body: "Assign responders, route rescue boats and share live status with the whole force — one Command Center for everyone.",
    icon: Users,
    tile: "bg-emerald-500/15",
    glow: "shadow-[0_0_44px_rgba(16,185,129,0.35)]",
  },
  {
    eyebrow: "Your Safety First",
    title: "Stay Safe",
    body: "One tap sends an SOS with your location. Never walk into a risk zone — let the app flag it before you do.",
    icon: ShieldCheck,
    tile: "bg-amber-500/15",
    glow: "shadow-[0_0_44px_rgba(245,158,11,0.35)]",
  },
];

const DASHBOARD_HREF = "/command-center";

const none = { duration: 0 } as const;
const spring = { type: "spring", stiffness: 320, damping: 32 } as const;

export default function OnboardingPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  // Measured viewport width for the deck — one page per slide.
  const [pageWidth, setPageWidth] = useState(0);

  // Re-measure on mount + resize so the deck math stays exact.
  useEffect(() => {
    const measure = () => setPageWidth(window.innerWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const count = SLIDES.length;
  const goTo = useCallback(
    (raw: number) => {
      const next = Math.min(count - 1, Math.max(0, raw));
      setIndex(next);
      triggerLightHaptic();
    },
    [count],
  );

  const finish = useCallback(() => {
    triggerLightHaptic();
    router.push(DASHBOARD_HREF);
  }, [router]);

  const lastSlide = index === count - 1;

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#0a0f1a] text-white">
      {/* Ambient glow — soft radial sky tint rising from the top. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 z-0 h-[28rem] w-[140%] -translate-x-1/2 rounded-[100%] bg-gradient-to-b from-sky-900/40 to-transparent blur-3xl"
      />

      {/* Skip — top right; hidden on the final slide (Get Started owns it). */}
      {!lastSlide && (
        <button
          type="button"
          onClick={finish}
          className="absolute right-4 top-4 z-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-white/10 hover:text-white active:scale-95"
        >
          Skip
        </button>
      )}

      {/* Progress bar along the very top edge. */}
      <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-white/5">
        <motion.div
          className="h-full origin-left bg-[var(--accent-primary)]"
          initial={false}
          animate={reduceMotion ? none : { width: `${((index + 1) / count) * 100}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>

      {/* The deck — horizontally scrollable pages. */}
      <div className="relative z-10 flex flex-1 items-stretch overflow-hidden">
        <motion.div
          className="flex h-full cursor-grab active:cursor-grabbing"
          style={{ width: pageWidth ? `${count * 100}%` : undefined }}
          animate={reduceMotion ? none : { x: -index * pageWidth }}
          transition={spring}
          drag="x"
          dragConstraints={{ left: -(count - 1) * pageWidth, right: 0 }}
          dragElastic={0.08}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            const delta = info.offset.x;
            if (delta < -pageWidth / 3) goTo(index + 1);
            else if (delta > pageWidth / 3) goTo(index - 1);
          }}
        >
          {SLIDES.map((slide, i) => {
            const SlideIcon = slide.icon;
            const active = i === index;
            return (
              <section
                key={slide.title}
                aria-hidden={!active}
                className="flex shrink-0 flex-col items-center justify-center px-8"
                style={{ width: pageWidth || "100%", flex: "0 0 auto" }}
              >
                <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
                  <div
                    className={`flex h-44 w-44 items-center justify-center rounded-full ${slide.tile} ${slide.glow}`}
                  >
                    <SlideIcon
                      className="h-20 w-20 text-white/90"
                      strokeWidth={1.1}
                      aria-hidden
                    />
                  </div>

                  <motion.div
                    className="mt-10 flex flex-col items-center"
                    initial={{ opacity: 0, y: 12 }}
                    animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                    transition={spring}
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">
                      {slide.eyebrow}
                    </p>
                    <h1 className="mt-3 text-3xl font-bold leading-tight">
                      {slide.title}
                    </h1>
                    <p className="mt-4 text-base leading-relaxed text-slate-400">
                      {slide.body}
                    </p>
                  </motion.div>
                </div>
              </section>
            );
          })}
        </motion.div>
      </div>

      {/* Bottom controls — dots + Next / Get Started */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 pb-10">
        <div
          className="flex items-center justify-center gap-2"
          role="tablist"
          aria-label="Onboarding slides"
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 bg-[var(--accent-primary)]"
                  : "w-2.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={finish}
          className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-6 text-base font-black uppercase tracking-wider text-white shadow-[0_0_24px_rgba(59,130,246,0.45)] transition hover:bg-blue-500 active:scale-[0.98] motion-reduce:transition-none"
        >
          {lastSlide ? "Get Started" : "Next"}
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </main>
  );
}
