"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------
// app/template.tsx — UI/UX Phase 8 · Step 1 (Global Page Transitions).
//
// Next.js templates remount on every route navigation, so wrapping the
// page content in a fade-in transform makes each navigation feel like a
// native-app page push. Subtle entrance: 200ms rise + fade. Keep it fast
// and unobtrusive — it runs on top of the dashboard's own stagger.
// ---------------------------------------------------------------------

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
