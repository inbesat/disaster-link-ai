"use client";

// ---------------------------------------------------------------------
// components/settings/LocalizationSettingsCard.tsx — Settings · Phase 7.
//
// Language, Region & Timezone preferences for /settings/profile:
//   • Language & Region dropdown — English, Hindi (हिन्दी), Bengali (বাংলা),
//     Tamil (தமிழ்), Telugu (తెలుగు), Marathi (मराठी).
//   • Helper note under the selector explaining what the preference drives:
//     default UI language + AI-translated emergency SMS language.
//   • Timezone selector — defaults to IST (UTC+05:30) Indian Standard Time,
//     with common UTC offsets for international observers.
//
// The selected language writes straight into the shared LanguageContext
// (localStorage "preferred_lang"), so every language switcher in the app —
// navbar, field app, language selector dropdown — stays synchronized. The
// dominant region + timezone are persisted alongside on a local snapshot
// until a proper users.timezone column exists.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Check, Clock, Globe2, Languages, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation, type Locale } from "@/lib/i18n/LanguageContext";
import { useProfileSettings } from "@/lib/settings-mock";

// Required languages — English + the five most-spoken Indian languages
// relevant to the demo district (Bihar floodplain responders/citizens).
const LANGUAGE_OPTIONS: Array<{ code: Locale; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "mr", label: "Marathi", native: "मराठी" },
];

const TIMEZONE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "Asia/Kolkata", label: "IST (UTC+05:30) — Indian Standard Time" },
  { value: "UTC", label: "UTC (UTC+00:00)" },
  { value: "Asia/Dubai", label: "GST (UTC+04:00) — Gulf Standard Time" },
  { value: "Asia/Singapore", label: "SGT (UTC+08:00) — Singapore Time" },
  { value: "Europe/London", label: "BST (UTC+01:00) — UK / Ireland" },
  { value: "America/New_York", label: "EDT (UTC−04:00) — US Eastern" },
  { value: "America/Los_Angeles", label: "PDT (UTC−07:00) — US Pacific" },
  { value: "Australia/Sydney", label: "AEST (UTC+10:00) — Australia East" },
];

const labelClass = "eoc-label block mb-1.5 text-slate-400";

export default function LocalizationSettingsCard() {
  const { language, setLanguage } = useTranslation();
  const { settings: mockSettings, update } = useProfileSettings();
  const [region, setRegion] = useState("Worldwide");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [saving, setSaving] = useState(false);

  // Rehydrate the previously saved region/timezone from the unified mock
  // store; the language itself is owned by LanguageContext.
  useEffect(() => {
    setRegion((prev) => mockSettings.region ?? prev);
    setTimezone((prev) => mockSettings.timezone ?? prev);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeLanguage =
    LANGUAGE_OPTIONS.find((option) => option.code === language)?.native ??
    "English";

  function handleLanguageChange(code: Locale) {
    if (code === language) return;
    setLanguage(code); // global context ⇒ every language switcher syncs
    update({ language: code });
    toast.success(`UI language set to ${LANGUAGE_OPTIONS.find((o) => o.code === code)?.label}`);
  }

  function handleSaveRegion(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      update({ region, timezone });
      toast.success("Region & timezone preferences saved locally!");
    } catch {
      toast.error("Could not save preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      data-settings-key="localization"
      className="rounded-eoc border border-panel-border bg-surface p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
          <Languages className="h-5 w-5 text-cyan-400" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-cyan-400/80">LANGUAGE &amp; REGION</p>
          <h2 className="mt-0.5 text-lg font-bold">Localization Preferences</h2>
        </div>
      </div>

      {/* Language & Region */}
      <div className="mt-6">
        <label htmlFor="language" className={labelClass}>
          Language &amp; Region
        </label>
        <div className="relative">
          <Languages
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <select
            id="language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Locale)}
              className="w-full appearance-none rounded-md border border-panel-borderHover bg-surface-muted py-2.5 pl-10 pr-10 text-sm text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label} ({option.native})
              </option>
            ))}
          </select>
        </div>

        {/* Helper note */}
        <p className="mt-2 flex items-start gap-2 text-xs text-slate-500">
          <Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            This preference dictates your default UI language and the language
            of AI-translated emergency SMS alerts.
          </span>
        </p>

        {/* Active-language preview chip */}
        <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">
          <Check className="h-3.5 w-3.5" aria-hidden />
          Active UI language — {activeLanguage}
        </div>
      </div>

      {/* Timezone */}
      <form onSubmit={handleSaveRegion} className="mt-8 space-y-5">
        <div>
          <label htmlFor="timezone" className={labelClass}>
            Timezone &amp; Local Time
          </label>
          <div className="relative">
            <Clock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            className="w-full appearance-none rounded-md border border-panel-borderHover bg-surface-muted py-2.5 pl-10 pr-10 text-sm text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none"
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Timestamps in alerts and the command center display in your selected
            timezone.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Primary region:{" "}
            <span className="font-mono text-slate-300">{region}</span>
            {language !== "en"
              ? ` · Alerts localized to ${LANGUAGE_OPTIONS.find((o) => o.code === language)?.label ?? "English"}`
              : null}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-glow-accent transition hover:bg-cyan-400 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}