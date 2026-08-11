"use client";

// ---------------------------------------------------------------------
// components/public/ai/ResponseCards.tsx — Phase 6 · Step 5 · structured
// AI response cards.
//
// Text walls are useless in a disaster — the AI must hand back UI. These
// are the three card types Sahayak can return instead of a plain bubble:
//
//   • ChecklistCard — a tappable kit/packing checklist (Medicines, ID,
//     Water…). Users tap items to cross them off; when everything is
//     checked a calm "ready" chip appears.
//   • RouteCard — a small map-snippet placeholder with a pin and dashed
//     path, plus the bold line "Walk 1.2 km to Shelter X".
//   • ActionCard — a one-tap action (e.g. "Tap to send 'I am safe' to
//     your family"). The handler is supplied by SahayakChat.
//
// Every card renders as a left-aligned row with Sahayak's robot avatar,
// matching the ChatMessage layout, so cards read as part of the thread.
// ---------------------------------------------------------------------

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Circle,
  MapPin,
  PhoneCall,
  Route,
  ShieldCheck,
} from "lucide-react";

export type ChecklistCardData = {
  kind: "checklist";
  title: string;
  items: string[];
  /** Shown once every item is ticked. */
  readyLabel: string;
};

export type RouteCardData = {
  kind: "route";
  title: string;
  /** e.g. "Walk 1.2 km" */
  walkDistance: string;
  /** e.g. "Kankarbagh High School" */
  shelterName: string;
  /** Joins the distance and name, e.g. "to". */
  to: string;
};

export type ActionCardData = {
  kind: "action";
  title: string;
  description: string;
  actionLabel: string;
};

/** Phase 6 · Step 7 — AI confidence below threshold → human escalation. */
export type EscalationCardData = {
  kind: "escalation";
  title: string;
  message: string;
  actionLabel: string;
  /** Dial target, e.g. "1070". */
  phoneNumber: string;
  /** Small reassurance line under the button. */
  note: string;
};

export type ResponseCardData =
  | ChecklistCardData
  | RouteCardData
  | ActionCardData
  | EscalationCardData;

type ResponseCardProps = {
  data: ResponseCardData;
  /** Required for kind "action" — fired when the action button is tapped. */
  onAction?: () => void;
};

export function ResponseCard({ data, onAction }: ResponseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.8 }}
      className="flex w-full items-start gap-2"
    >
      {/* Sahayak's avatar — same chip as ChatMessage so cards sit in-thread. */}
      <span
        aria-hidden
        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a4d3c] ring-1 ring-[#dcf8c6]/30 shadow-[0_2px_10px_rgba(16,185,129,0.25)]"
      >
        <Bot className="h-[18px] w-[18px] text-[#dcf8c6]" strokeWidth={2.2} />
      </span>

      <div className="w-full max-w-[85%]">
        {data.kind === "checklist" && <ChecklistCard data={data} />}
        {data.kind === "route" && <RouteCard data={data} />}
        {data.kind === "action" && <ActionCard data={data} onAction={onAction} />}
        {data.kind === "escalation" && <EscalationCard data={data} />}
      </div>
    </motion.div>
  );
}

/* ----------------------------- Checklist ----------------------------- */

function ChecklistCard({ data }: { data: ChecklistCardData }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const allDone = checked.size === data.items.length;

  const toggle = (index: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-white">{data.title}</p>
        {allDone && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1 rounded-full bg-[#34d399]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6ee7b7]"
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            {data.readyLabel}
          </motion.span>
        )}
      </div>

      <ul className="mt-3 space-y-1.5">
        {data.items.map((item, i) => {
          const done = checked.has(i);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={done}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                  done
                    ? "border-[#34d399]/30 bg-[#34d399]/10"
                    : "border-white/10 bg-white/5 hover:border-[#34d399]/40"
                }`}
              >
                {done ? (
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-[#34d399]"
                    aria-hidden
                  />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-[#5b6b84]" aria-hidden />
                )}
                <span
                  className={`text-sm transition-colors ${
                    done
                      ? "text-[#6ee7b7] line-through decoration-[#34d399]/60"
                      : "text-[#d7e6f5]"
                  }`}
                >
                  {item}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------- Route ------------------------------- */

function RouteCard({ data }: { data: RouteCardData }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      {/* Map snippet placeholder — grid streets + pin + dashed path. */}
      <div
        aria-hidden
        className="relative flex h-28 items-center justify-center bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:22px_22px]"
      >
        {/* Dashed route down from the pin. */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 96" fill="none">
          <path
            d="M100 8 C 120 30, 60 44, 92 60 S 130 74, 110 88"
            stroke="#34d399"
            strokeWidth="2.5"
            strokeDasharray="1 7"
            strokeLinecap="round"
          />
          <circle cx="110" cy="88" r="4" fill="#34d399" />
        </svg>
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#1e4a39] ring-1 ring-[#dcf8c6]/30 shadow-[0_2px_14px_rgba(16,185,129,0.45)]">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-[#34d399]/30 motion-reduce:animate-none"
          />
          <MapPin className="relative h-5 w-5 text-[#6ee7b7]" strokeWidth={2.2} />
        </span>
      </div>

      <div className="px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--dl-text-muted)]">
          {data.title}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[15px] font-black leading-snug text-white">
          <Route className="h-4 w-4 shrink-0 text-[#34d399]" aria-hidden />
          <span>
            {data.walkDistance} {data.to}{" "}
            <span className="text-[#6ee7b7]">{data.shelterName}</span>
          </span>
        </p>
      </div>
    </div>
  );
}

/* ---------------------------- Escalation ----------------------------- */

function EscalationCard({ data }: { data: EscalationCardData }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#fbbf24]/35 bg-gradient-to-br from-[#7c2d12]/50 to-[#431407]/60 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#fdba74]">
        <PhoneCall className="h-3 w-3" aria-hidden />
        {data.title}
      </p>

      <p className="mt-2 text-[15px] font-semibold leading-relaxed text-white">
        {data.message}
      </p>

      {/* Massive call button — a real tel: link so it dials on phones. */}
      <motion.a
        href={`tel:${data.phoneNumber}`}
        whileTap={{ scale: 0.97 }}
        className="mt-3 flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-br from-[#f97316] to-[#dc2626] text-base font-black text-white shadow-[0_8px_24px_rgba(239,68,68,0.45)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fdba74]"
      >
        <PhoneCall className="h-5 w-5 animate-pulse motion-reduce:animate-none" aria-hidden />
        {data.actionLabel}
      </motion.a>

      <p className="mt-2 text-center text-[11px] text-[#fdba74]/80">{data.note}</p>
    </div>
  );
}

/* ------------------------------- Action ------------------------------ */

function ActionCard({ data, onAction }: { data: ActionCardData; onAction?: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#34d399]/15 ring-1 ring-[#34d399]/30">
          <ShieldCheck className="h-4 w-4 text-[#6ee7b7]" strokeWidth={2.2} aria-hidden />
        </span>
        <p className="text-sm font-bold text-white">{data.title}</p>
      </div>

      <p className="mt-2 text-[13px] leading-relaxed text-[#a9bccf]">{data.description}</p>

      <motion.button
        type="button"
        onClick={onAction}
        whileTap={{ scale: 0.97 }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#0d9488] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34d399]"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden />
        {data.actionLabel}
      </motion.button>
    </div>
  );
}

export default ResponseCard;
