"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------
// app/template.tsx — UI/UX Phase 16 · Step 1 (Page Transitions).
//
// Next.js templates remount on every route navigation. This wrapper
// applies route-aware entrance animations:
//   • Map pages: slide in from right
//   • Settings on mobile: slide up from bottom
//   • Dashboard widgets: stagger fade-in
//   • Default: subtle 200ms rise + fade
// ---------------------------------------------------------------------

type TransitionConfig = {
  initial: { opacity: number; x?: number; y?: number };
  animate: { opacity: number; x?: number; y?: number };
  transition: Transition;
}

function getRouteTransition(pathname: string): TransitionConfig {
  // Map pages slide in from right
  if (pathname.startsWith("/gov/map") || pathname.startsWith("/public/map")) {
    return {
      initial: { opacity: 0, x: 24 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.25, ease: "easeOut" },
    };
  }

  // Settings slide up from bottom on mobile
  if (pathname.startsWith("/settings")) {
    return {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2, ease: "easeOut" },
    };
  }

  // Default: subtle rise + fade
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, ease: "easeOut" },
  };
}

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const routeTransition = getRouteTransition(pathname);

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={routeTransition.initial}
      animate={routeTransition.animate}
      transition={routeTransition.transition}
    >
      {children}
    </motion.div>
  );
}
