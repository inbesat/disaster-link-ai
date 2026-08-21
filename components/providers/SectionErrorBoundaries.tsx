"use client";

import type { ReactNode } from "react";
import SectionErrorBoundary from "@/components/providers/SectionErrorBoundary";

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary
      sectionName="Dashboard"
      fallbackMessage="Dashboard widgets hit an error. Click retry to reload status counters."
    >
      {children}
    </SectionErrorBoundary>
  );
}

export function MapErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary
      sectionName="Map"
      fallbackMessage="Map view encountered a rendering issue. Other features remain active."
    >
      {children}
    </SectionErrorBoundary>
  );
}

export function AIChatErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary
      sectionName="AI Chat"
      fallbackMessage="AI assistant interface crashed. Resetting chat UI will restore emergency guidance."
    >
      {children}
    </SectionErrorBoundary>
  );
}

export function SettingsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <SectionErrorBoundary
      sectionName="Settings"
      fallbackMessage="Settings configuration failed to render. Click retry to restore panel."
    >
      {children}
    </SectionErrorBoundary>
  );
}
