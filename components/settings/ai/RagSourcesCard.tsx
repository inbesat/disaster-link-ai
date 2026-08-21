"use client";

// ---------------------------------------------------------------------
// components/settings/ai/RagSourcesCard.tsx — AI Assistant (Phase 4 · Step 7).
//
// "Retrieval-Augmented Generation (RAG) Sources" — which knowledge-base
// documents the assistant is allowed to search when grounding answers:
//   • NDMA National Guidelines
//   • State SOPs
//   • District Disaster Management Plans (DDMP) — badged "High Priority
//     Context"
//   • International Protocols
//
// Checkboxes per source; persisted via useAiSettings.
// ---------------------------------------------------------------------

import {
  BookOpenCheck,
  FileText,
  Globe,
  Landmark,
  Search,
} from "lucide-react";
import { useAiSettings } from "@/lib/settings/AiSettingsContext";
import type { RagSourceKey } from "@/lib/settings/ai-settings";

const SOURCES: {
  key: RagSourceKey;
  label: string;
  description: string;
  badge?: string;
  icon: typeof FileText;
}[] = [
  {
    key: "ndmaGuidelines",
    label: "NDMA National Guidelines",
    description: "National-level disaster management acts & guidelines.",
    icon: Landmark,
  },
  {
    key: "stateSops",
    label: "State SOPs",
    description: "State-driven standing operating procedures & circulars.",
    icon: FileText,
  },
  {
    key: "ddmp",
    label: "District Disaster Management Plans (DDMP)",
    description: "District-specific hazard, shelter & route plans.",
    badge: "High Priority Context",
    icon: BookOpenCheck,
  },
  {
    key: "internationalProtocols",
    label: "International Protocols",
    description: "UNISDR / INSARAG style guidance for cross-border ops.",
    icon: Globe,
  },
];

export default function RagSourcesCard() {
  const { settings, update } = useAiSettings();
  const ragSources = settings.ragSources;

  function toggle(key: RagSourceKey) {
    update({ ragSources: { ...ragSources, [key]: !ragSources[key] } });
  }

  const enabledCount = SOURCES.filter((source) => ragSources[source.key]).length;

  return (
    <section
      data-settings-key="ai-rag-sources"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10">
          <Search className="h-5 w-5 text-teal-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-teal-300/80">KNOWLEDGE ROUTING</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Retrieval-Augmented Generation (RAG) Sources
          </h2>
        </div>
        <span className="ml-auto rounded-full border border-teal-400/30 bg-teal-500/10 px-2.5 py-1 text-eoc-tiny font-bold text-teal-200">
          {enabledCount}/{SOURCES.length} sources
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Choose which approved documents the assistant may retrieve when it
        grounds answers and drafts plans. Answers only cite the sources you
        enable.
      </p>

      {/* Source checklist */}
      <div className="mt-5 space-y-2.5">
        {SOURCES.map(({ key, label, description, badge, icon: Icon }) => {
          const on = ragSources[key];
          return (
            <label
              key={key}
              htmlFor={`rag-${key}`}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-md border p-3 transition ${
                on
                  ? "border-teal-400/40 bg-teal-500/[0.07]"
                  : "border-panel-border bg-surface-muted/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-teal-500/10">
                  <Icon className="h-4 w-4 text-teal-300" aria-hidden />
                </div>
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-200">
                    {label}
                    {badge && (
                      <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-eoc-tiny font-bold uppercase tracking-wide text-amber-300">
                        {badge}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
              <input
                id={`rag-${key}`}
                type="checkbox"
                checked={on}
                onChange={() => toggle(key)}
                aria-label={`Search ${label}`}
                className="h-4 w-4 shrink-0 cursor-pointer accent-teal-400"
              />
            </label>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
        Retrieval is grounded — answers include source citations so crews can
        verify directives against the original document before acting.
      </p>
    </section>
  );
}