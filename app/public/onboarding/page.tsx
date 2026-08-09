"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { MotionConfig, motion, type Variants } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------
// app/public/onboarding/page.tsx — Phase 1 · Step 5 · Public Onboarding
// Carousel. Full-screen, swipeable 4-slide value pitch (Framer Motion):
//   1. Get real-time flood alerts
//   2. See safe evacuation routes
//   3. Find nearest shelter
//   4. Stay connected with family
// Dot indicators, Skip (top), and "Continue to Setup" on the last slide.
// ---------------------------------------------------------------------

/** Where citizens land after onboarding (next phase of the plan). */
const SETUP_URL = "/public/setup";

type Slide = {
  icon: string;
  title: string;
  description: string;
  illustration: ReactNode;
};

function AlertIllustration() {
  return (
    <div className="relative w-64 rounded-2xl border border-white/10 bg-[var(--dl-navy-2)]/80 p-4 text-left shadow-[var(--dl-shadow-soft)]">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse-ring rounded-full bg-severity-red-500" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-severity-red-400">
          Critical · Flood
        </p>
      </div>
      <p className="mt-3 text-sm font-bold text-white">Water rising in Kankarbagh</p>
      <p className="mt-1 text-xs text-[var(--dl-text-on-navy)]">
        Evacuate now · Safe routes below
      </p>
      <div className="mt-3 flex gap-1.5">
        <span className="rounded-md bg-severity-red-500/20 px-2 py-1 font-mono text-[10px] text-severity-red-300">
          ALERT
        </span>
        <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[10px] text-[var(--dl-text-on-navy)]">
          09:41 IST
        </span>
      </div>
    </div>
  );
}

function RouteIllustration() {
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl ring-1 ring-white/10"
      >
        🏠
      </span>
      <div className="relative mx-1 w-28">
        <div className="h-0.5 w-full border-t-2 border-dashed border-[var(--dl-blue-light)]" />
        <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--dl-blue-light)]" />
      </div>
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--dl-blue)]/25 text-2xl ring-1 ring-[var(--dl-blue)]/50"
      >
        ⛑️
      </span>
    </div>
  );
}

function ShelterIllustration() {
  return (
    <div className="w-64 rounded-2xl border border-white/10 bg-[var(--dl-navy-2)]/80 p-4 text-left shadow-[var(--dl-shadow-soft)]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--dl-orange)]/20 text-xl ring-1 ring-[var(--dl-orange)]/40">
          🏕️
        </span>
        <div>
          <p className="text-sm font-bold text-white">Kankarbagh School</p>
          <p className="text-xs text-[var(--dl-text-on-navy)]">400 m away · Beds open</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <span className="h-2 w-2 animate-pulse-ring rounded-full bg-severity-green-500" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-severity-green-400">
          Shelter open
        </span>
      </div>
    </div>
  );
}

function FamilyIllustration() {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--dl-blue)]/20 text-2xl ring-1 ring-[var(--dl-blue)]/40"
      >
        👩‍🦰
      </span>
      <span aria-hidden="true" className="text-2xl">
        💞
      </span>
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--dl-orange)]/20 text-2xl ring-1 ring-[var(--dl-orange)]/40"
      >
        👨‍🦱
      </span>
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    icon: "🌊",
    title: "Get real-time flood alerts",
    description:
      "Know the moment water levels turn dangerous. Life-safety alerts reach you and your family before the flood does.",
    illustration: <AlertIllustration />,
  },
  {
    icon: "🧭",
    title: "See safe evacuation routes",
    description:
      "Clear, verified routes out of your area — updated as roads close, so you never walk into danger.",
    illustration: <RouteIllustration />,
  },
  {
    icon: "🏕️",
    title: "Find nearest shelter",
    description:
      "Locate the closest open shelter with live capacity — school, community hall or relief camp.",
    illustration: <ShelterIllustration />,
  },
  {
    icon: "👨‍👩‍👧",
    title: "Stay connected with family",
    description:
      "Add your family contacts so they're alerted and checked on, even when you can't reach them.",
    illustration: <FamilyIllustration />,
  },
];

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const goNext = useCallback(
    () => setIndex((i) => Math.min(i + 1, SLIDES.length - 1)),
    [],
  );
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  // Arrow-key navigation (desktop).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const goToSetup = () => router.push(SETUP_URL);
  const isLast = index === SLIDES.length - 1;

  return (
    <main className="landing-page relative h-[100dvh] overflow-hidden bg-[var(--dl-navy)]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_-10%,rgba(249,115,22,0.16),transparent),radial-gradient(ellipse_50%_40%_at_0%_110%,rgba(37,99,235,0.18),transparent)]"
      />

      {/* Top bar — progress + Skip */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--dl-text-muted)]">
          {index + 1} / {SLIDES.length}
        </p>
        {!isLast ? (
          <button
            type="button"
            onClick={goToSetup}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-[var(--dl-text-on-navy)] transition hover:border-[var(--dl-orange)]/50 hover:text-white"
          >
            Skip
          </button>
        ) : (
          <span className="w-16" />
        )}
      </header>

      {/* Carousel track */}
      <div className="h-full" role="group" aria-roledescription="carousel" aria-label="What the Citizen App offers">
        {/* MotionConfig reducedMotion="user" keeps the animations respectful
            of prefers-reduced-motion while leaving full motion for everyone
            else. */}
        <MotionConfig reducedMotion="user">
          <motion.div
            className="flex h-full"
            animate={{ x: `-${index * 100}%` }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            // Snap back to the animate-set position when a swipe is aborted
            // below the threshold (drag + animate share the same motion value).
            dragSnapToOrigin
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              const { offset, velocity } = info;
              if (offset.x < -60 || velocity.x < -400) goNext();
              else if (offset.x > 60 || velocity.x > 400) goPrev();
            }}
            style={{ touchAction: "pan-y" }}
          >
          {SLIDES.map((slide, i) => {
            const isActive = i === index;
            return (
              <section
                key={slide.title}
                aria-label={`Slide ${i + 1}: ${slide.title}`}
                className="h-full w-full shrink-0 overflow-y-auto"
              >
                {/* my-auto centers when there's room and lets the page scroll
                    naturally when the slide overflows a short viewport. */}
                <div className="my-auto flex min-h-full w-full flex-col items-center px-6 py-20 text-center">
                  <motion.div
                    variants={contentVariants}
                    initial="hidden"
                    animate={isActive ? "show" : "hidden"}
                    className="flex flex-col items-center"
                  >
                    {/* Slide illustration */}
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -inset-6 rounded-full bg-white/5 blur-2xl"
                      />
                      {slide.illustration}
                    </div>

                    <span
                      aria-hidden="true"
                      className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--dl-orange)]/15 text-3xl ring-1 ring-[var(--dl-orange)]/30"
                    >
                      {slide.icon}
                    </span>
                    <h1 className="mt-5 max-w-sm text-3xl font-bold tracking-tight text-white">
                      {slide.title}
                    </h1>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--dl-text-on-navy)]">
                      {slide.description}
                    </p>

                    {i === 0 && (
                      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-[var(--dl-text-muted)]">
                        ← Swipe to explore →
                      </p>
                    )}
                  </motion.div>
                </div>
              </section>
            );
          })}
          </motion.div>
        </MotionConfig>
      </div>

      {/* Desktop arrow keys */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous slide"
        disabled={index === 0}
        className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-2.5 text-white transition hover:border-[var(--dl-orange)]/50 disabled:opacity-30 md:block"
      >
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next slide"
        disabled={isLast}
        className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-2.5 text-white transition hover:border-[var(--dl-orange)]/50 disabled:opacity-30 md:block"
      >
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      </button>

      {/* Bottom — dots + CTA */}
      <footer className="absolute inset-x-0 bottom-0 z-20 pb-8">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 px-6">
          <div className="flex items-center gap-2" role="tablist" aria-label="Onboarding slides">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setIndex(i)}
              aria-current={i === index ? "step" : undefined}
              aria-label={`Go to slide ${i + 1}: ${slide.title}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-[var(--dl-orange)]" : "w-2.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

          {isLast ? (
            <button
              type="button"
              onClick={goToSetup}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-[var(--dl-orange)] px-4 py-3.5 text-base font-bold text-white transition hover:bg-[#EA5B0C]"
            >
              Continue to Setup
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] border border-[var(--dl-orange)]/40 bg-[var(--dl-orange)]/10 px-4 py-3.5 text-base font-semibold text-[var(--dl-orange-light)] transition hover:border-[var(--dl-orange)] hover:bg-[var(--dl-orange)]/20"
            >
              Next
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}
