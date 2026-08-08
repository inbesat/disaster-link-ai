"use client";

// ---------------------------------------------------------------------
// app/(app)/settings/ai/page.tsx — AI Assistant & LLM Preferences (Phase 4 · Step 10).
//
// Client page that integrates useAiSettings directly: it wires the
// central store (provider + hook) around the settings wrapper, so the
// wrapper reads live values from localStorage-backed context. Route
// metadata lives in the sibling layout (server components only).
// ---------------------------------------------------------------------

import { AiSettingsProvider, useAiSettings } from "@/lib/ai-settings-mock";
import AiSettingsWrapper from "@/components/settings/ai/AiSettingsWrapper";

export default function AiSettingsPage() {
  return (
    <AiSettingsProvider>
      <AiPageContent />
    </AiSettingsProvider>
  );
}

function AiPageContent() {
  // Integrated hook — reads/writes the same snapshot all child cards use.
  const { settings } = useAiSettings();

  return (
    <div>
      <AiSettingsWrapper />
      <p
        data-live-sync-check
        className="sr-only"
        aria-live="polite"
      >
        Live AI preferences: {settings.responseVerbosity} ·{" "}
        {settings.planExecutionMode} ·{" "}
        {settings.toolAccess.modifyUserProfiles ? "profile-access granted" : "profile-access locked"}
      </p>
    </div>
  );
}