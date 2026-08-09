"use client";

// ---------------------------------------------------------------------
// components/settings/SettingsSection.tsx — UI/UX Phase 7 · Step 2.
//
// Reusable section wrapper used across every settings page for a single
// consistent visual grammar: icon + title + muted description header, a
// full-width divider under it, and a body padded to the roadmap spec
// (p-6). Children render inside the body.
// ---------------------------------------------------------------------

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type SettingsSectionProps = {
  /** Bold title, e.g. "Public Profile". Accepts ReactNode so pages can
   * append badges (e.g. an "Admin Only" chip) next to the text. */
  title: ReactNode;
  /** Muted one-line description under the title. */
  description: string;
  /** Lucide icon rendered in the leading tile. */
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
};

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  className = "",
}: SettingsSectionProps) {
  return (
    <section className={`rounded-xl border border-subtle bg-secondary ${className}`}>
      <header className="px-6 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight text-primary">{title}</h2>
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          </div>
        </div>
      </header>
      <div className="border-b border-white/10" />
      <div className="p-6">{children}</div>
    </section>
  );
}

export default SettingsSection;
