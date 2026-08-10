"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------
// components/ui/ScrollReveal.tsx — Phase 1 design-system primitive.
//
// Fades content up as it scrolls into the viewport (translateY 28px -> 0).
// Reveal triggers once 14% of the element is visible (viewport threshold
// 0.14); pass a delay (0.08s increments reads nicely for staggers).
// `prefers-reduced-motion` renders the children untouched.
//
//   <ScrollReveal>…section…</ScrollReveal>
//   <ScrollReveal delay={0.1}>…</ScrollReveal>
// ---------------------------------------------------------------------

const EASE = [0.2, 0.7, 0.2, 1] as const;

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
  distance = 28,
  className,
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
