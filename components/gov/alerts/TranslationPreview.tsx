"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/TranslationPreview.tsx — Multi-Lingual
// Broadcasting preview.
//
// Renders AI translations as:
//   • Side-by-side comparison (English + selected language)
//   • "Translated by AI — Review recommended" badge
//   • Editable per-language tabs
// ---------------------------------------------------------------------

import { Pencil, X } from "lucide-react";
import { TRANSLATE_LANGS, type TranslateLang } from "@/lib/mock-data/gov-alert-templates";

export type TranslationPreviewProps = {
  translations: Record<TranslateLang, string>;
  activeLang: TranslateLang;
  onActiveLangChange: (lang: TranslateLang) => void;
  editingLang: TranslateLang | null;
  onStartEdit: (lang: TranslateLang) => void;
  onSaveEdit: (lang: TranslateLang, text: string) => void;
  onCancelEdit: (lang: TranslateLang) => void;
  originalText?: string;
};

export function TranslationPreview({
  translations,
  activeLang,
  onActiveLangChange,
  editingLang,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  originalText,
}: TranslationPreviewProps) {
  const isEditing = editingLang !== null;

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
      {/* AI Badge */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-purple-400/5 px-4 py-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-400/10 px-2.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider text-purple-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" aria-hidden />
          AI Translated
        </span>
        <span className="text-[0.625rem] text-slate-500">
          Translated by AI — Review recommended
        </span>
      </div>

      {/* Language tabs */}
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
                  ? "bg-purple-400/25 text-purple-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {editing && (
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-amber-400"
                />
              )}
              {lang.native}
              <span className="font-normal text-slate-500">{lang.label}</span>
            </button>
          );
        })}
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
        {/* Original English */}
        {originalText && (
          <div className="px-4 py-3">
            <p className="mb-1.5 text-[0.5625rem] font-bold uppercase tracking-wider text-slate-500">
              English (Original)
            </p>
            <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
              {originalText}
            </p>
          </div>
        )}

        {/* Translated language */}
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
              <p className="mb-1.5 text-[0.5625rem] font-bold uppercase tracking-wider text-slate-500">
                {TRANSLATE_LANGS.find((l) => l.code === activeLang)?.native}{" "}
                ({TRANSLATE_LANGS.find((l) => l.code === activeLang)?.label})
              </p>
              <p className="text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">
                {translations[activeLang]}
              </p>
              <button
                type="button"
                onClick={() => onStartEdit(activeLang)}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-[0.6875rem] font-bold text-slate-300 transition hover:border-purple-400/40 hover:text-purple-400"
              >
                <Pencil className="h-3 w-3" aria-hidden />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Language info footer */}
      <div className="border-t border-white/10 px-4 py-2">
        <p className="text-[0.625rem] uppercase tracking-wider text-slate-500">
          {activeLang === "hi"
            ? "Hindi — 22+ crore speakers · Official language of Bihar"
            : activeLang === "bn"
              ? "Bengali — West Bengal & Bihar border communities"
              : activeLang === "ta"
                ? "Tamil — Tamil Nadu disaster response networks"
                : "Malayalam — Kerala flood management systems"}
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
        className="w-full resize-y rounded-lg border border-purple-400/50 bg-white/5 p-3 text-sm leading-relaxed text-white focus:border-purple-400 focus:outline-none"
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
        <span className="text-[0.6875rem] text-slate-500">
          Manual override — this exact text will be sent for {lang}.
        </span>
      </div>
    </div>
  );
}

export default TranslationPreview;
