"use client";

// ---------------------------------------------------------------------
// components/public/AlertCard.tsx — Phase 3 · Step 2 · touch-friendly
// citizen alert card.
//
// Big, scannable card for the /public/alerts feed:
//   • 4px left bar in the severity colour (green / amber / red) — drawn
//     as an absolutely positioned strip instead of `border-l-4` +
//     `border-{color}` so the two border-color utilities can never fight
//     (Tailwind applies border-color to ALL sides; gotcha #3).
//   • Lucide icon per alert type (flood / rain / road) in a tinted tile.
//   • Plain-language typography — large bold title, muted body.
//   • SeverityBadge chip + relative timestamp (reused design system).
//
// Swipe-right-to-mark-read: framer-motion `drag="x"` with rubber-band
// elasticity, `info.offset.x` (raw gesture distance) driving the > 100px
// threshold. On trigger the card fades + tints muted, shows a "Marked
// read" chip, fires a light haptic and a success toast. Tapping the card
// (or the title button) opens the AlertDetailModal via `onOpen` — a real
// drag suppresses the tap (framer), and onTap ignores taps that land on
// the inner Mark-read button (closest("button")).
// `MotionConfig reducedMotion="user"` keeps the animated bits respectful.
//
// Timestamps are hydration-safe: they render "…" until mount, then the
// relative label — server and first client paint agree (same pattern as
// LiveClock's `--:--:--` placeholder).
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  CloudRain,
  Construction,
  Megaphone,
  ThumbsDown,
  ThumbsUp,
  Waves,
  type LucideIcon,
} from "lucide-react";
import SeverityBadge, {
  type SeverityLevel,
} from "@/components/ui/SeverityBadge";
import { showToast } from "@/components/ui/Toast";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import {
  relativeTime,
  type PublicAlert,
  type PublicAlertSeverity,
  type PublicAlertType,
} from "@/lib/mock-data/public-alerts";

/** Swipe distance (px) that triggers "mark read". */
const SWIPE_THRESHOLD = 100;

/** Type → icon + tinted tile. */
const TYPE_META: Record<PublicAlertType, { icon: LucideIcon; tile: string }> = {
  flood: { icon: Waves, tile: "bg-cyan-500/10 text-cyan-300" },
  rain: { icon: CloudRain, tile: "bg-sky-500/10 text-sky-300" },
  road: { icon: Construction, tile: "bg-amber-500/10 text-amber-300" },
};

/** Severity → 4px bar colour + SeverityBadge variant/label (green/amber/red). */
const SEVERITY_META: Record<
  PublicAlertSeverity,
  { bar: string; variant: SeverityLevel; label: string }
> = {
  safe: { bar: "bg-severity-green-500", variant: "safe", label: "Advisory" },
  warning: { bar: "bg-severity-amber-500", variant: "warning", label: "Warning" },
  critical: { bar: "bg-severity-red-500", variant: "critical", label: "Critical" },
};

export function AlertCard({
  alert,
  onOpen,
}: {
  alert: PublicAlert;
  /** Open the alert detail modal (Phase 3 · Step 4). */
  onOpen?: () => void;
}) {
  const [read, setRead] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [mounted, setMounted] = useState(false);

  // Live tallies — the citizen's own vote adjusts the count until they
  // toggle it off (Phase 3 · Step 8 crowd-verification).
  const upCount = alert.upvotes + (vote === "up" ? 1 : 0);
  const downCount = alert.downvotes + (vote === "down" ? 1 : 0);

  const castVote = (kind: "up" | "down") => {
    setVote((current) => (current === kind ? null : kind));
    triggerLightHaptic();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const meta = SEVERITY_META[alert.severity];
  const { icon: Icon, tile } = TYPE_META[alert.type];

  const markRead = () => {
    if (read) return;
    setRead(true);
    triggerLightHaptic();
    showToast("success", {
      title: "Marked as read",
      description: alert.title,
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <motion.article
        drag="x"
        dragElastic={{ left: 0, right: 0.35 }}
        dragMomentum={false}
        whileDrag={{ scale: 1.015 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > SWIPE_THRESHOLD) markRead();
        }}
        onTap={(event) => {
          // Ignore taps that land on the inner Mark-read button.
          if ((event.target as HTMLElement).closest("button")) return;
          onOpen?.();
        }}
        animate={{ x: 0, opacity: read ? 0.55 : 1 }}
        transition={{ duration: 0.25 }}
        aria-label={`${meta.label.toLowerCase()} alert: ${alert.title}${
          read ? " (read)" : ""
        }`}
        className={`relative flex gap-3 overflow-hidden rounded-[var(--dl-radius-sm)] border border-white/10 p-4 backdrop-blur transition-colors duration-300 ${
          read ? "bg-white/[0.03]" : "bg-white/5"
        }`}
      >
        {/* 4px severity bar — absolute strip so border-color never clashes */}
        <span
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 w-1 ${meta.bar}`}
        />

        {/* Type icon tile */}
        <span
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tile}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>

        {/* Copy */}
        <div className="min-w-0 flex-1">
          {/* Title doubles as the keyboard-reachable way to open details
              (tap-to-open is pointer/gesture-only otherwise); renders as a
              plain heading when no detail view is wired up. */}
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className="text-left text-base font-bold leading-snug text-white transition hover:text-[var(--dl-orange-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
            >
              {alert.title}
            </button>
          ) : (
            <h2 className="text-base font-bold leading-snug text-white">
              {alert.title}
            </h2>
          )}
          <p className="mt-1 text-sm leading-relaxed text-[var(--dl-text-muted)]">
            {alert.body}
          </p>

          {/* Provenance badge — official government order vs community
              rumour (Phase 3 · Step 8) */}
          <div className="mt-2.5">
            {alert.isOfficial ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/15 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-sky-300">
                <BadgeCheck aria-hidden="true" className="h-3 w-3" />
                Verified by District Authority
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-[var(--dl-text-muted)]">
                <Megaphone aria-hidden="true" className="h-3 w-3" />
                Community Report
              </span>
            )}
          </div>

          {/* Meta row — severity + time + votes (community) + read control */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <SeverityBadge
              variant={meta.variant}
              label={meta.label}
              size="sm"
            />
            <span className="text-[0.6875rem] tabular-nums text-[var(--dl-text-muted)]">
              {mounted ? relativeTime(alert.timestamp) : "\u2026"}
            </span>

            {/* Crowd-verification — community reports only (Step 8) */}
            {!alert.isOfficial && (
              <span className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => castVote("up")}
                  aria-pressed={vote === "up"}
                  aria-label="Upvote this community report"
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] ${
                    vote === "up"
                      ? "border-severity-green-500/50 bg-severity-green-500/15 text-severity-green-300"
                      : "border-white/10 bg-white/5 text-[var(--dl-text-muted)] hover:border-white/25 hover:text-[var(--dl-text-on-navy)]"
                  }`}
                >
                  <ThumbsUp aria-hidden="true" className="h-3 w-3" />
                  {upCount}
                </button>
                <button
                  type="button"
                  onClick={() => castVote("down")}
                  aria-pressed={vote === "down"}
                  aria-label="Downvote this community report"
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] ${
                    vote === "down"
                      ? "border-severity-red-500/50 bg-severity-red-500/15 text-severity-red-300"
                      : "border-white/10 bg-white/5 text-[var(--dl-text-muted)] hover:border-white/25 hover:text-[var(--dl-text-on-navy)]"
                  }`}
                >
                  <ThumbsDown aria-hidden="true" className="h-3 w-3" />
                  {downCount}
                </button>
              </span>
            )}

            {/* Mark-read is not gesture-only — keyboard/AT users get the
                same affordance (project precedent: one-handed mode's
                Restore chip). Swipe right also triggers it. */}
            <span className="ml-auto">
              {read ? (
                <span
                  role="status"
                  className="inline-flex items-center gap-1 rounded-full border border-severity-green-500/40 bg-severity-green-500/15 px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-severity-green-300"
                >
                  <CheckCircle2 aria-hidden="true" className="h-3 w-3" />
                  Read
                </span>
              ) : (
                <button
                  type="button"
                  onClick={markRead}
                  aria-label={`Mark "${alert.title}" as read`}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.6875rem] font-semibold text-[var(--dl-text-muted)] transition hover:border-severity-green-500/50 hover:text-severity-green-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
                >
                  <Check aria-hidden="true" className="h-3 w-3" />
                  Mark read
                </button>
              )}
            </span>
          </div>
        </div>
      </motion.article>
    </MotionConfig>
  );
}

export default AlertCard;
