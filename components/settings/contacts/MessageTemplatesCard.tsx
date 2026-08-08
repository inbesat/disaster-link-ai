"use client";

// ---------------------------------------------------------------------
// components/settings/contacts/MessageTemplatesCard.tsx — Contacts (Phase 7 · Step 5).
//
// SOS Message Templates — pre-written emergency messages with variables:
//   • 3 editable text areas pre-filled with demo templates (Flash Flood,
//     Medical Emergency, Route Blocked).
//   • {location} / {count} / {shelter} / {road} variable pills that users
//     can CLICK to insert at the active template's cursor, or DRAG & drop
//     into any text area.
//   • "Save Templates" fires a green success toast.
//
// Template texts live in the shared useContactSettings() store (Step 10),
// so edits persist across refresh.
// ---------------------------------------------------------------------

import { useRef, useState, type DragEvent } from "react";
import toast from "react-hot-toast";
import {
  Braces,
  FileText,
  MessageSquareText,
  MousePointerClick,
  Save,
} from "lucide-react";
import { useContactSettings } from "@/lib/contacts-settings-mock";
import type { MessageTemplate } from "@/lib/settings/contacts-settings";

const VARIABLES: { value: string; pillClass: string }[] = [
  { value: "{location}", pillClass: "border-cyan-400/50 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/25" },
  { value: "{count}", pillClass: "border-amber-400/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/25" },
  { value: "{shelter}", pillClass: "border-emerald-400/50 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/25" },
  { value: "{road}", pillClass: "border-violet-400/50 bg-violet-500/10 text-violet-200 hover:bg-violet-500/25" },
];

export default function MessageTemplatesCard() {
  const { settings, update } = useContactSettings();
  const templates: MessageTemplate[] = settings.messageTemplates;
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);

  function setTemplateText(index: number, text: string) {
    update({
      messageTemplates: templates.map((t, i) =>
        i === index ? { ...t, text } : t,
      ),
    });
  }

  function insertAt(index: number, variable: string) {
    const el = refs.current[index];
    const current = templates[index]?.text ?? "";
    const pos = el?.selectionStart ?? current.length;
    const next = current.slice(0, pos) + variable + current.slice(pos);
    setTemplateText(index, next);
    // Restore focus + cursor just past the inserted variable.
    requestAnimationFrame(() => {
      const target = refs.current[index];
      if (target) {
        target.focus();
        target.selectionStart = target.selectionEnd = pos + variable.length;
      }
    });
  }

  function handleDrop(event: DragEvent<HTMLTextAreaElement>, index: number) {
    event.preventDefault();
    const variable = event.dataTransfer.getData("text/plain");
    if (!/^\{[a-z]+\}$/.test(variable)) return;
    setActive(index);
    insertAt(index, variable);
  }

  function handleSave() {
    toast.success("SOS message templates saved.");
  }

  return (
    <section
      data-settings-key="contacts-templates"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
          <MessageSquareText className="h-5 w-5 text-blue-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-blue-300/80">PRE-WRITTEN COMMS</p>
          <h2 className="mt-0.5 text-lg font-bold">SOS Message Templates</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Reusable emergency messages. Fill the{" "}
        <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-[11px] text-cyan-300">
          {"{variables}"}
        </code>{" "}
        at send time — or inline them below and save.
      </p>

      {/* Variable pills — click or drag to insert */}
      <div className="mt-4 rounded-md border border-[#1c2740] bg-[#0a0f1d] p-3">
        <p className="eoc-label flex items-center gap-1.5 text-slate-400">
          <Braces className="h-3 w-3" aria-hidden />
          INSERT VARIABLES
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {VARIABLES.map(({ value, pillClass }) => (
            <button
              key={value}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", value);
                e.dataTransfer.effectAllowed = "copy";
              }}
              onClick={() => insertAt(active, value)}
              title={`Click to insert ${value} at the cursor`}
              className={`cursor-grab rounded-full border px-3 py-1 font-mono text-[11px] font-bold transition active:cursor-grabbing ${pillClass}`}
            >
              {value}
            </button>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-slate-500">
            <MousePointerClick className="h-3 w-3" aria-hidden />
            Click or drag into a template
          </span>
        </div>
      </div>

      {/* Editable templates */}
      <div className="mt-4 space-y-3">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className="rounded-md border border-[#1c2740] bg-surface-muted/40 p-3"
          >
            <p className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <span aria-hidden>{template.emoji}</span>
              {template.name}
              {index === active && (
                <span className="ml-auto rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-300">
                  Active
                </span>
              )}
            </p>
            <textarea
              ref={(el) => {
                refs.current[index] = el;
              }}
              value={template.text}
              onChange={(e) => setTemplateText(index, e.target.value)}
              onFocus={() => setActive(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, index)}
              rows={2}
              aria-label={`${template.name} template text`}
              className="mt-2 w-full resize-y rounded-md border border-[#1c2740] bg-[#0a0f1d] px-3 py-2.5 text-[13px] leading-relaxed text-slate-100 outline-none transition focus:border-blue-400/60"
            />
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          Saved templates are used by the field SOS menu and alert broadcasts.
        </p>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(37,99,235,0.35)] transition hover:bg-blue-500 active:scale-[0.98]"
        >
          <Save className="h-4 w-4" aria-hidden />
          Save Templates
        </button>
      </div>

      <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
        <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Demo fixtures — every {`{variable}`} is resolved from live district
        data at dispatch time.
      </p>
    </section>
  );
}
