import type { Metadata } from "next";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------
// app/(app)/settings/ai/layout.tsx — AI Assistant (Phase 4 · Step 10).
//
// Server layout that owns the route's metadata. The page below is a
// client component (it integrates useAiSettings), and client components
// cannot export `metadata`, so it lives here instead.
// ---------------------------------------------------------------------

export const metadata: Metadata = {
  title: "AI Assistant & LLM Preferences | Settings | DRIP",
};

export default function AiSettingsLayout({ children }: { children: ReactNode }) {
  return children;
}