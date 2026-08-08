"use client";

// ---------------------------------------------------------------------
// components/NavbarNav.tsx — Phase 25 · Step 5.
//
// The Navbar is a server component (auth/cookies), so the translated
// links live here in a small client component. All labels come from the
// active locale via useTranslation(); switching languages re-renders them
// instantly.
// ---------------------------------------------------------------------

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import OnboardingTooltip from "@/components/ui/OnboardingTooltip";

export default function NavbarNav() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-6">
      <Link href="/command-center" className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="eoc-label text-accent">
          DRIP / {t("command_center").toUpperCase()}
        </span>
      </Link>

      <nav className="hidden items-center gap-4 sm:flex">
        <Link
          href="/alerts"
          className="text-xs font-medium uppercase tracking-wider text-slate-300 transition hover:text-accent"
        >
          {t("alert_history")}
        </Link>

        {/* Phase 22 · Step 8 — one-time onboarding tooltip on the AI
            Commander entry point. Dismissed once per browser via
            localStorage. */}
        <OnboardingTooltip
          title={t("ai_commander")}
          description="Ask the AI Commander for an evacuation plan!"
          storageKey="drip_onboarding_ai_chat_v1"
          placement="bottom-left"
        >
          <Link
            href="/ai-planner"
            className="inline-flex items-center gap-1.5 rounded-md border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent transition hover:bg-accent hover:text-slate-950"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {t("ai_commander")}
          </Link>
        </OnboardingTooltip>
      </nav>
    </div>
  );
}
