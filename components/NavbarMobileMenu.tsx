"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import OnboardingTooltip from "@/components/ui/OnboardingTooltip";
import { useTranslation } from "@/lib/i18n/LanguageContext";

/**
 * Phase 22 · Step 10 — mobile hamburger menu.
 *
 * Replaces the hidden-on-phone nav links with a hamburger that opens a
 * dropdown. The backdrop is blurred (backdrop-blur-md) so the live map
 * underneath stays visible but never distracts; every navigation row is a
 * full-width 48px (py-4 / min-h-12) touch target per mobile ergonomics.
 */
export default function NavbarMobileMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Lock body scroll while the drawer is open so the blurred backdrop isn't
  // scrolling underneath, and close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated text-foreground transition hover:border-accent hover:text-accent sm:hidden"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" aria-hidden />
        )}
      </button>

      {open && (
        <div id="mobile-nav-menu" className="fixed inset-0 z-50 sm:hidden">
          {/* Blurred backdrop — the map underneath is dimmed + blurred */}
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-md"
            onClick={close}
            aria-hidden="true"
          />

          {/* Menu panel */}
          <div className="absolute inset-x-3 top-16 rounded-eoc border border-border bg-surface-elevated/95 p-3 shadow-2xl backdrop-blur-md">
            <nav className="flex flex-col gap-1.5">
              <Link
                href="/alerts"
                onClick={close}
                className="flex min-h-12 items-center rounded-md px-4 py-4 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
              >
                {t("alert_log")}
              </Link>

              {/* Same one-time onboarding callout as the desktop nav (shared
                  localStorage key → dismissed once across the whole app). */}
              <OnboardingTooltip
                title={`New: ${t("ai_commander")}`}
                description="Ask the AI Commander for an evacuation plan!"
                storageKey="drip_onboarding_ai_chat_v1"
                placement="bottom-left"
              >
                <Link
                  href="/ai-planner"
                  onClick={close}
                  className="flex min-h-12 w-full items-center gap-1.5 rounded-md px-4 py-4 text-sm font-bold uppercase tracking-wider text-accent transition hover:bg-surface-muted"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  {t("ai_commander")}
                </Link>
              </OnboardingTooltip>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
