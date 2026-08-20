"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/TranslationPreview.tsx — Phase 11 · Step 4 ·
// AI Multi-Lingual Auto-Translation preview.
//
// Renders the mock-LLM translations the composer produced as a dark
// tabbed panel: Hindi / Bengali / Tamil / Malayalam. Each language has a
// "Edit Translation" pencil that flips that tab into an editable textarea
// so the official can hand-correct the AI's output before it ships.
//
// Editing state is owned by the composer (single source of truth for the
// final send payload); this component is purely presentational.
// ---------------------------------------------------------------------

import { Pencil, X } from "lucide-react";
import { TRANSLATE_LANGS, type TranslateLang } from "@/lib/mock-data/gov-alert-templates";

export type TranslationPreviewProps = {
  translations: Record<TranslateLang, string>;
  activeLang: TranslateLang;
  onActiveLangChange: (lang: TranslateLang) => void;
  /** Language currently in edit mode — null when no tab is being edited. */
  editingLang: TranslateLang | null;
  onStartEdit: (lang: TranslateLang) => void;
  onSaveEdit: (lang: TranslateLang, text: string) => void;
  onCancelEdit: (lang: TranslateLang) => void;
};

export function TranslationPreview({
  translations,
  activeLang,
  onActiveLangChange,
  editingLang,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: TranslationPreviewProps) {
  const isEditing = editingLang !== null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-panel-deep">
      {/* Language switch — segmented control (aria-pressed buttons, the
          codebase convention — avoids half-implemented ARIA tabs). */}
      <div
        role="group"
        aria-label="Translated languages"
        className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-white/5 p-1"
      >
        {TRANSLATE_LANGS.map((lang) => {
          const active = activeLang === lang.code;
          const editing = editingLang === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onActiveLangChange(lang.code);
                if (editingLang !== null) onCancelEdit(editingLang);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-accent-purple/25 text-accent-purple"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {editing && (
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-severity-amber-400"
                />
              )}
              {lang.native}
              <span className="font-normal text-slate-500">{lang.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active language body */}
      <div className="relative px-4 py-3">
        {isEditing ? (
          <EditTranslationArea
            lang={activeLang}
            value={translations[activeLang]}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-100">
              {translations[activeLang]}
            </p>
            <button
              type="button"
              onClick={() => onStartEdit(activeLang)}
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[0.6875rem] font-bold text-slate-300 transition hover:border-accent-purple/40 hover:text-accent-purple"
            >
              <Pencil className="h-3 w-3" aria-hidden />
              Edit Translation
            </button>
          </>
        )}

        <p className="mt-2 text-[0.625rem] uppercase tracking-wider text-slate-500">
          {activeLang === "hi"
            ? "Hindi · 22+ crore speakers"
            : activeLang === "bn"
              ? "Bengali · West Bengal & Bihar"
              : activeLang === "ta"
                ? "Tamil · Tamil Nadu"
                : "Malayalam · Kerala"}
        </p>
      </div>
    </div>
  );
}

function EditTranslationArea({
  lang,
  value,
  onSave,
  onCancel,
}: {
  lang: TranslateLang;
  value: string;
  onSave: (lang: TranslateLang, text: string) => void;
  onCancel: (lang: TranslateLang) => void;
}) {
  return (
    <div className="space-y-2.5">
      <textarea
        value={value}
        onChange={(e) => onSave(lang, e.target.value)}
        rows={4}
        autoFocus
        className="w-full resize-y rounded-lg border border-accent-purple/50 bg-white/5 p-3 text-sm leading-relaxed text-white focus:border-accent-purple focus:outline-none"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onCancel(lang)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-white/10"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Done
        </button>
        <span className="text-[0.6875rem] text-muted">
          Manual override — this exact text will be sent for {lang}.
        </span>
      </div>
    </div>
  );
}

export default TranslationPreview;
