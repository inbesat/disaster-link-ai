"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, Plus, Search, X } from "lucide-react";
import {
  QUICK_ALERT_TEMPLATES,
  splitByVariables,
  type AlertTemplate,
} from "@/lib/mock-data/gov-alert-templates";
import type { GovAlertSeverity } from "@/lib/mock-data/gov-alert-targets";

const SEVERITY_CHIP: Record<GovAlertSeverity, string> = {
  watch: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  warning: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  critical: "border-red-400/40 bg-red-400/10 text-red-400",
};

const CATEGORIES = ["All", "Flood", "Evacuation", "All Clear", "Custom"] as const;
type Category = (typeof CATEGORIES)[number];

const BUILT_IN_CATEGORY: Record<string, Category> = {
  flood: "Flood",
  evac: "Evacuation",
  all_clear: "All Clear",
};

type CustomTemplate = AlertTemplate & { category: Category };

export function HighlightedTemplateBody({ body }: { body: string }) {
  return (
    <p className="text-sm leading-relaxed text-slate-200">
      {splitByVariables(body).map((segment, i) =>
        /^\{[a-z_]+\}$/.test(segment) ? (
          <mark
            key={i}
            className="mx-0.5 rounded bg-amber-400/20 px-1 py-0.5 font-mono text-[0.75rem] font-bold text-amber-400"
          >
            {segment}
          </mark>
        ) : (
          <span key={i}>{segment}</span>
        ),
      )}
    </p>
  );
}

export type TemplateLibraryProps = {
  open: boolean;
  onClose: () => void;
  onUse: (template: AlertTemplate) => void;
};

export function TemplateLibrary({ open, onClose, onUse }: TemplateLibraryProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newSeverity, setNewSeverity] = useState<GovAlertSeverity>("warning");

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousActive?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const allTemplates: Array<AlertTemplate & { category: Category }> = [
    ...QUICK_ALERT_TEMPLATES.map((t) => ({
      ...t,
      category: (BUILT_IN_CATEGORY[t.id] ?? "All Clear") as Category,
    })),
    ...customTemplates,
  ];

  const filtered = allTemplates.filter((t) => {
    if (activeCategory !== "All" && t.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.label.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddCustom = () => {
    if (!newLabel.trim() || !newBody.trim()) return;
    const newTemplate: CustomTemplate = {
      id: "flood",
      label: newLabel.trim(),
      severity: newSeverity,
      body: newBody.trim(),
      category: "Custom" as Category,
    };
    setCustomTemplates((prev) => [...prev, newTemplate]);
    setNewLabel("");
    setNewBody("");
    setNewSeverity("warning");
    setShowAddCustom(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="presentation">
      <button type="button" aria-label="Close template library" onClick={onClose} className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm" />
      <div role="dialog" aria-modal="true" aria-label="Alert template library" className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-400/30 bg-purple-400/10 text-purple-400">
              <BookOpen className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">Template Library</h2>
              <p className="text-xs text-slate-500">Legal &amp; SOP approved</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowAddCustom(!showAddCustom)} className="inline-flex items-center gap-1.5 rounded-lg border border-purple-400/40 bg-purple-400/10 px-3 py-2.5 text-xs font-bold text-purple-400 transition hover:bg-purple-400/20 active:scale-[0.97]">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add Custom
            </button>
            <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white active:scale-[0.97]">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <div className="border-b border-white/10 px-5 py-3 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates..." className="h-10 w-full rounded-lg border border-white/10 bg-[#0a0f1a] pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:outline-none" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setActiveCategory(cat)} className={`rounded-full border px-3 py-1 text-[0.625rem] font-bold uppercase tracking-wider transition ${activeCategory === cat ? "border-purple-400/40 bg-purple-400/10 text-purple-400" : "border-white/10 text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {showAddCustom && (
          <div className="border-b border-white/10 bg-purple-400/5 px-5 py-4">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-purple-400">Create Custom Template</h3>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Template name" className="rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:outline-none" />
                <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value as GovAlertSeverity)} className="rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-purple-400/60 focus:outline-none [&>option]:bg-[#111827]">
                  <option value="watch">Watch</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <textarea rows={3} value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Template body. Use {variable} for placeholders." className="w-full resize-none rounded-lg border border-white/10 bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:outline-none" />
              <div className="flex gap-2">
                <button type="button" onClick={handleAddCustom} disabled={!newLabel.trim() || !newBody.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50">
                  <Plus className="h-3 w-3" aria-hidden />
                  Add Template
                </button>
                <button type="button" onClick={() => { setShowAddCustom(false); setNewLabel(""); setNewBody(""); }} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-white/5">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-600" aria-hidden />
              <p className="text-sm text-slate-500">No templates match your search.</p>
            </div>
          ) : (
            filtered.map((template) => (
              <div key={template.id} className="rounded-xl border border-white/10 bg-[#0a0f1a] p-4 transition hover:border-purple-400/40">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${SEVERITY_CHIP[template.severity]}`}>
                      {template.severity}
                    </span>
                    <span className="text-[0.625rem] font-bold uppercase tracking-wider text-slate-600">{template.category}</span>
                  </div>
                  <span className="text-[0.6875rem] font-semibold text-slate-400">{template.label}</span>
                </div>
                <HighlightedTemplateBody body={template.body} />
                <button type="button" onClick={() => onUse(template)} className="mt-3 flex h-9 w-full items-center justify-center rounded-lg border border-purple-400/40 bg-purple-400/10 text-xs font-bold uppercase tracking-wider text-purple-400 transition hover:bg-purple-400/20">
                  Use Template
                </button>
              </div>
            ))
          )}
        </div>

        <footer className="border-t border-white/10 px-5 py-3">
          <p className="text-[0.6875rem] text-slate-500">
            <mark className="mr-1 rounded bg-amber-400/20 px-1 py-0.5 font-mono text-[0.625rem] font-bold text-amber-400">
              {"{variable}"}
            </mark>
            tokens are highlighted in the composer.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default TemplateLibrary;
