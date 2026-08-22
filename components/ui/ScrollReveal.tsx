"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------
// components/ui/ScrollReveal.tsx — UI/UX Phase 16 · Step 4.
//
// Scroll-triggered fade-up animation using IntersectionObserver +
// Framer Motion whileInView. Supports:
//   • Configurable delay for stagger children (0.1s increments)
//   • Custom distance, duration, and easing
//   • StaggerContainer for parent-level stagger
//   • Respects prefers-reduced-motion
// ---------------------------------------------------------------------

const EASE = [0.2, 0.7, 0.2, 1] as const;

type ScrollRevealProps = {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  className?: string;
};

export function ScrollReveal({
  children,
  delay = 0,
  distance = 28,
  duration = 0.4,
  className,
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// StaggerContainer — wraps a grid/list so children animate in sequence.
// Each child should use <StaggerItem> for automatic stagger.
// ---------------------------------------------------------------------

type StaggerContainerProps = {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
};

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
}: StaggerContainerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.3,
        staggerChildren: staggerDelay,
      }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// StaggerItem — child of StaggerContainer. Each item fades up in sequence.
// ---------------------------------------------------------------------

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
};

export function StaggerItem({ children, className }: StaggerItemProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export default ScrollReveal;
