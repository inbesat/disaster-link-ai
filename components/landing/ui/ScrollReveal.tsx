"use client";

import React, { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type ScrollRevealAnimation =
  "fade" | "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale";

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Stagger delay in seconds. Use 0.08s increments for sequential items. */
  delay?: number;
  className?: string;
  /** Directional fade variant. Defaults to 'fade-up'. */
  animation?: ScrollRevealAnimation;
  /** Fired once when the element first enters the viewport. */
  onReveal?: () => void;
}

const OFFSETS: Record<ScrollRevealAnimation, { x: number; y: number; scale: number }> = {
  fade: { x: 0, y: 0, scale: 1 },
  "fade-up": { x: 0, y: 28, scale: 1 },
  "fade-down": { x: 0, y: -28, scale: 1 },
  "fade-left": { x: 28, y: 0, scale: 1 },
  "fade-right": { x: -28, y: 0, scale: 1 },
  scale: { x: 0, y: 0, scale: 0.92 },
};

export default function ScrollReveal({
  children,
  delay = 0,
  className = "",
  animation = "fade-up",
  onReveal,
}: ScrollRevealProps) {
  const reduceMotion = useReducedMotion();
  const firedRef = useRef(false);

  const handleViewportEnter = () => {
    if (onReveal && !firedRef.current) {
      firedRef.current = true;
      onReveal();
    }
  };

  const offset = OFFSETS[animation];

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: offset.x, y: offset.y, scale: offset.scale }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.14 }}
      onViewportEnter={onReveal ? handleViewportEnter : undefined}
      transition={{
        duration: 0.7,
        ease: [0.2, 0.7, 0.2, 1],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}
