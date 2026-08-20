"use client";

// ---------------------------------------------------------------------
// components/settings/contacts/ChannelPriorityCard.tsx — Contacts (Phase 7 · Step 7).
//
// Signal Failover Priority:
//   • Ranked list of the 4 delivery channels — SMS, WhatsApp, Automated
//     Voice Call, Email — shown in the order the system attempts them.
//   • Each row carries a grip-vertical drag handle; rows reorder via
//     native HTML5 drag & drop so the demo is fully interactive.
//   • Up/down buttons on each row give keyboard/screen-reader users the
//     same reorder control.
//   • Helper text explains the automatic fallback behaviour.
//   • "Reset Order" restores the shipped default sequence.
//
// Order lives in the shared useContactSettings() store (Step 10), so the
// priority survives refresh.
// ---------------------------------------------------------------------

import { useState, type DragEvent } from "react";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  ListOrdered,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { useContactSettings } from "@/lib/contacts-settings-mock";
import {
  DEFAULT_CHANNEL_PRIORITY,
  type ChannelId,
} from "@/lib/settings/contacts-settings";

const CHANNEL_ICONS: Record<ChannelId, LucideIcon> = {
  sms: MessageSquare,
  whatsapp: MessageCircle,
  voice: Phone,
  email: Mail,
};

function isDefaultOrder(channels: { id: ChannelId }[]): boolean {
  return channels.every((c, i) => c.id === DEFAULT_CHANNEL_PRIORITY[i].id);
}

export default function ChannelPriorityCard() {
  const { settings, update } = useContactSettings();
  const channels = settings.channelPriority;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function reorder(from: number, to: number) {
    if (from === to) return;
    const movedName = channels[from].name;
    const next = [...channels];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update({ channelPriority: next });
    toast(
      `${movedName} moved to position ${to + 1} in the failover chain.`,
      { duration: 2500 },
    );
  }

  function moveBy(index: number, direction: -1 | 1) {
    reorder(index, index + direction);
  }

  function handleDrop(event: DragEvent<HTMLLIElement>, targetIndex: number) {
    event.preventDefault();
    setOverIndex(null);
    if (dragIndex !== null) reorder(dragIndex, targetIndex);
    setDragIndex(null);
  }

  function resetOrder() {
    if (isDefaultOrder(channels)) return; // nothing to do — no no-op toast
    update({ channelPriority: DEFAULT_CHANNEL_PRIORITY.map((c) => ({ ...c })) });
    setDragIndex(null);
    setOverIndex(null);
    toast.success("Failover priority reset to default order.");
  }

  return (
    <section
      data-settings-key="contacts-channel-priority"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <ListOrdered className="h-5 w-5 text-violet-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-violet-300/80">FAILOVER ROUTING</p>
          <h2 className="mt-0.5 text-lg font-bold">Signal Failover Priority</h2>
        </div>
        <span className="ml-auto rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-violet-200">
          {channels.length} channels
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        If internet connectivity is lost, the system will automatically
        fallback to the next available channel in this exact order.
      </p>

      {/* Ranked failover list */}
      <ol className="mt-5 space-y-2.5">
        {channels.map((channel, index) => {
          const Icon = CHANNEL_ICONS[channel.id];
          const dragging = dragIndex === index;
          const dropTarget =
            dragIndex !== null && dragIndex !== index && overIndex === index;
          return (
            <li
              key={channel.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(index);
              }}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`group flex items-center gap-3 rounded-md border p-3 transition ${
                dragging
                  ? "border-violet-400/60 bg-violet-500/10 opacity-40"
                  : dropTarget
                    ? "border-t-2 border-t-violet-400 bg-violet-500/[0.06]"
                    : "border-panel-border bg-surface-muted/40 hover:border-violet-400/40"
              }`}
            >
              {/* Rank */}
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1c2740] font-mono text-[11px] font-bold tabular-nums text-slate-300">
                {index + 1}
              </span>

              {/* Grip handle */}
              <span
                className="shrink-0 cursor-grab text-slate-500 transition group-hover:text-violet-300 active:cursor-grabbing"
                aria-hidden
              >
                <GripVertical className="h-[18px] w-[18px]" />
              </span>

              {/* Channel */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
                <Icon className="h-4 w-4 text-violet-300" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-slate-100">
                  {channel.name}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {channel.hint}
                </span>
              </span>

              {/* Position chip */}
              <span
                className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider sm:inline-block ${
                  index === 0
                    ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                    : "border-panel-borderHover bg-[#0a0f1d] text-slate-400"
                }`}
              >
                {index === 0 ? "Primary" : `Fallback ${index}`}
              </span>

              {/* Keyboard reorder controls */}
              <span className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveBy(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${channel.name} up in failover priority`}
                  className="rounded p-1 text-slate-500 transition hover:bg-violet-500/10 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => moveBy(index, 1)}
                  disabled={index === channels.length - 1}
                  aria-label={`Move ${channel.name} down in failover priority`}
                  className="rounded p-1 text-slate-500 transition hover:bg-violet-500/10 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] leading-relaxed text-slate-500">
          Failed deliveries skip ahead down the chain until one channel
          succeeds. Drag the rows or use the arrows to change the order.
        </p>
        <button
          type="button"
          onClick={resetOrder}
          className="inline-flex items-center gap-2 rounded-md border border-panel-borderHover px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-violet-400/50 hover:bg-violet-500/10 hover:text-violet-200 active:scale-[0.98]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Reset Order
        </button>
      </div>
    </section>
  );
}
