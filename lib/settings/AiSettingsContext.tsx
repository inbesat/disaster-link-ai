"use client";

// ---------------------------------------------------------------------
// lib/settings/AiSettingsContext.tsx — compatibility shim.
//
// The AI preferences store moved to lib/ai-settings-mock.ts (Phase 4 ·
// Step 9). This module re-exports it so existing imports keep working;
// prefer the canonical entry point for new code.
// ---------------------------------------------------------------------

export {
  AiSettingsProvider,
  useAiSettings,
  type AiSettingsContextValue,
} from "@/lib/ai-settings-mock";