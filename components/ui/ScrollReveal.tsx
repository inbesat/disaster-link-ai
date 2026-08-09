"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------
// components/ui/ScrollReveal.tsx — UI/UX Phase 8 · Step 7.
//
// Lightweight wrapper that reveals its children as they scroll into the
// viewport. Used to give long pages (settings, admin, …) a sense of life
// without janky per-item logic at every call site.
//
//   <ScrollReveal>…section…</ScrollReveal>
//   <ScrollReveal delay={0.1}>…</ScrollReveal>
//
// Default viewport margin "-50px" means the reveal starts a little before
// the element fully enters the frame. `prefers-reduced-motion` renders the
// children untouched.
// ---------------------------------------------------------------------

type ScrollRevealProps = {
  children: ReactNode;
  /** Extra stagger delay (s) before the element animates in. Default 0. */
  delay?: number;
  /** Optional distance (px) the element travels up while fading in. */
  distance?: number;
  /** Passed straight through to the <motion.div> — e.g. grid col spans. */
  className?: string;
};

export function ScrollReveal({
  children,
  delay = 0,
  distance = 20,
  className,
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: distance }}
      whileInView={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.3, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
