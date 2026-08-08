"use client";

// ---------------------------------------------------------------------
// components/ui/LanguageSelector.tsx — Phase 25 · Step 4.
//
// Globe-triggered dropdown that switches the UI language (en / hi / ml).
// Persistence is handled by LanguageContext (localStorage "preferred_lang").
// Selecting a language also fires a mock server sync for
// users.preferred_language — swap in a real server action later.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useTranslation, type Locale } from "@/lib/i18n/LanguageContext";

const LANGUAGE_OPTIONS: { code: Locale; nativeLabel: string }[] = [
  { code: "en", nativeLabel: "English" },
  { code: "hi", nativeLabel: "हिन्दी" },
  { code: "ml", nativeLabel: "മലയാളം" },
];

/**
 * Mock server sync for users.preferred_language.
 * TODO(Phase 25): replace with a real server action, e.g.
 *   import { updatePreferredLanguage } from "@/app/actions/preferences";
 *   await updatePreferredLanguage(lang);
 */
async function syncPreferredLanguage(lang: Locale): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150)); // simulated latency
  console.log(`[preferences] preferred_language → ${lang} (mock persisted)`);
}

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleSelect(code: Locale) {
    setOpen(false);
    if (code === language) return;
    setLanguage(code); // state + localStorage("preferred_lang")

    try {
      await syncPreferredLanguage(code);
    } catch (error) {
      // Never break the UI over a preferences save — log and continue.
      console.error("Failed to persist preferred language:", error);
    }
  }

  const activeLabel =
    LANGUAGE_OPTIONS.find((option) => option.code === language)?.nativeLabel ??
    "English";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-glow-accent backdrop-blur transition hover:border-accent hover:text-accent"
      >
        <Globe className="h-4 w-4" aria-hidden />
        <span className="whitespace-nowrap">{activeLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Language"
          className="lang-dropdown absolute right-0 top-full z-50 mt-2 w-44 rounded-eoc border border-border bg-surface-elevated p-1.5 shadow-2xl backdrop-blur"
        >
          {LANGUAGE_OPTIONS.map((option) => {
            const active = option.code === language;
            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => void handleSelect(option.code)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-accent/10 font-semibold text-accent"
                    : "text-slate-300 hover:bg-accent/5 hover:text-foreground"
                }`}
              >
                <span>{option.nativeLabel}</span>
                {active && <Check className="h-4 w-4" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes langFade {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .lang-dropdown { animation: langFade 0.12s ease-out; }
      `}</style>
    </div>
  );
}
