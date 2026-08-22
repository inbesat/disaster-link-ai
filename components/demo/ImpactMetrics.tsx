"use client";

// ---------------------------------------------------------------------
// components/demo/ImpactMetrics.tsx — Phase 15 · Step 5.
//
// Cinematic live-impact overlay for the final seconds of the pitch. A
// transparent, floating glass panel pinned top-right of the presentation
// screen; framer-motion counts each metric up dramatically on entry.
//
// Visibility is toggled by the invisible demo hotkeys (Shift+9 →
// dispatches the global "demo:toggle-impact" event from
// hooks/useDemoHotkeys.ts). The component renders nothing until told,
// so it is safe to mount once at the app root (app/layout.tsx).
//
//   • 12,450 Citizens Alerted
//   • 8 Rescue Boats Deployed
//   • 3 Villages Evacuating
//   • 0 Casualties
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

type Metric = {
  value: number;
  format: (n: number) => string;
  label: string;
};

const METRICS: Metric[] = [
  { value: 12450, format: (n) => n.toLocaleString("en-IN"), label: "Citizens Alerted" },
  { value: 8, format: (n) => n.toFixed(0), label: "Rescue Boats Deployed" },
  { value: 3, format: (n) => n.toFixed(0), label: "Villages Evacuating" },
  { value: 0, format: (n) => n.toFixed(0), label: "Casualties" },
];

function AnimatedMetric({ metric, delay }: { metric: Metric; delay: number }) {
  const count = useMotionValue(0);
  const display = useTransform(count, (v) => metric.format(Math.floor(v)));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      count.set(metric.value);
      return;
    }
    const controls = animate(count, metric.value, {
      duration: 2.2,
      delay,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [count, metric.value, delay, reduceMotion]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.15, duration: 0.4 }}
        className="font-mono text-[28px] font-bold leading-none tabular-nums text-emerald-300"
      >
        {display}
      </motion.div>
      <div className="mt-1.5 text-eoc-tiny font-semibold uppercase tracking-[0.18em] text-white/55">
        {metric.label}
      </div>
    </div>
  );
}

export default function ImpactMetrics() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onToggle = () => setVisible((v) => !v);
    window.addEventListener("demo:toggle-impact", onToggle);
    return () => window.removeEventListener("demo:toggle-impact", onToggle);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          initial={{ opacity: 0, y: -18, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.95 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="pointer-events-none fixed right-5 top-5 z-[9998] w-[300px] rounded-2xl border border-white/10 bg-black/55 p-4 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md"
          aria-hidden
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-eoc-tiny font-bold uppercase tracking-[0.28em] text-white/50">
              Live Impact
            </span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {METRICS.map((metric, i) => (
              <AnimatedMetric key={metric.label} metric={metric} delay={i * 0.22} />
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}