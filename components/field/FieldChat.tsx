"use client";

// ---------------------------------------------------------------------
// components/field/FieldChat.tsx — Phase 14 · Step 6 · Tactical chat.
//
// Secure unit-level messaging for responders. Two channels, switchable by
// tabs: "My Unit (SDRF-4)" (squad chatter) and "Command Center" (the
// control room). The input bar carries a prominent Microphone (voice
// note) and Camera (damage photo) action, and a "Share Live Location"
// pill above the bar sends the responder's current GPS as a message.
//
// Demo-only: messages live in local state (persisted to localStorage so
// a refresh keeps the thread). A real deployment would swap the send()
// internals for an E2E-encrypted WebSocket.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Camera, MapPin, Send, Radio, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { triggerLightHaptic, triggerHeavyHaptic } from "@/hooks/useHaptics";
import { PATNA_CENTER } from "@/lib/field-offline";

type Channel = "unit" | "command";
type Message = {
  id: string;
  channel: Channel;
  from: string;
  text: string;
  at: string;
  mine: boolean;
  kind: "text" | "voice" | "photo" | "location";
};

const UNIT_NAME = "My Unit (SDRF-4)";
const COMMAND_NAME = "Command Center";
const ME = "You";

const SEED: Message[] = [
  {
    id: "m1",
    channel: "unit",
    from: "Ravi (Boat Ops)",
    text: "Boat 2 launched from Kankarbagh, ETA 10 min to Route Y crossing.",
    at: "09:14",
    mine: false,
    kind: "text",
  },
  {
    id: "m2",
    channel: "unit",
    from: ME,
    text: "Copy. I'm at Central Community Hall checking shelter capacity.",
    at: "09:16",
    mine: true,
    kind: "text",
  },
  {
    id: "m3",
    channel: "command",
    from: "Command Center",
    text: "Water level rising 8 cm/hr near Bypass Road. Keep Route Y patrol posted.",
    at: "09:20",
    mine: false,
    kind: "text",
  },
  {
    id: "m4",
    channel: "command",
    from: "Command Center",
    text: "Requesting photo of culvert condition when you reach the bridge.",
    at: "09:21",
    mine: false,
    kind: "text",
  },
];

const CHAT_KEY = "drip_field_chat_v1";

function readChat(): Message[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(CHAT_KEY);
    return raw ? (JSON.parse(raw) as Message[]) : SEED;
  } catch {
    return SEED;
  }
}

export default function FieldChat() {
  const [channel, setChannel] = useState<Channel>("unit");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(readChat());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // Auto-scroll to the newest message on channel switch / new message.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, channel]);

  const thread = useMemo(
    () =>
      messages
        .filter((m) => m.channel === channel)
        .sort((a, b) => a.at.localeCompare(b.at)),
    [messages, channel],
  );

  function push(msg: Omit<Message, "id" | "at" | "channel" | "mine" | "from"> & { from?: string }) {
    const entry: Message = {
      ...msg,
      id: `m${Date.now()}`,
      channel,
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mine: true,
      from: msg.from ?? ME,
    };
    setMessages((prev) => [...prev, entry]);
  }

  function sendText() {
    const text = draft.trim();
    if (!text) return;
    triggerLightHaptic();
    push({ text, kind: "text" });
    setDraft("");
  }

  // Voice note: simulates a 2s recording → transcribed note (the real
  // Web Speech API path lives in VoiceInputButton; this keeps the chat
  // self-contained for the demo).
  function recordVoiceNote() {
    if (recording) return;
    setRecording(true);
    triggerHeavyHaptic();
    toast("Recording voice note…", { icon: "🎙️" });
    setTimeout(() => {
      setRecording(false);
      push({
        text: "🎙️ (voice note) \"Water level rising at the culvert, requesting backup at Bypass.\"",
        kind: "voice",
      });
      toast.success("Voice note sent to channel");
    }, 1800);
  }

  function sharePhoto() {
    triggerLightHaptic();
    push({
      text: "📷 Damage photo attached — flooded culvert, Bypass Road.",
      kind: "photo",
    });
    toast.success("Photo shared to channel");
  }

  function shareLocation() {
    triggerHeavyHaptic();
    const coords = PATNA_CENTER; // real path: navigator.geolocation
    push({
      text: `📍 Live location shared — ${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E`,
      kind: "location",
    });
    toast.success("Live location shared");
  }

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] flex-col">
      {/* Channel tabs */}
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Chat channel">
        {(
          [
            { key: "unit", label: UNIT_NAME, icon: Radio },
            { key: "command", label: COMMAND_NAME, icon: ShieldCheck },
          ] as const
        ).map(({ key, label, icon: Icon }) => {
          const active = channel === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                triggerLightHaptic();
                setChannel(key);
              }}
              className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 px-2 text-[0.9375rem] font-bold transition active:scale-95 ${
                active
                  ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-200"
                  : "border-[#1c2740] bg-[#0d1526] text-slate-400"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Thread */}
      <div className="mt-3 flex-1 space-y-3 overflow-y-auto rounded-2xl border-2 border-[#1c2740] bg-[#0d1526] p-4">
        {thread.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl border-2 px-4 py-2.5 ${
                m.mine
                  ? "border-cyan-400/40 bg-cyan-500/15"
                  : "border-[#2a3a5a] bg-[#0b1120]"
              }`}
            >
              {!m.mine && (
                <p className="mb-1 text-[0.6875rem] font-bold uppercase tracking-wider text-cyan-300">
                  {m.from}
                </p>
              )}
              <p className="text-base leading-snug text-gray-100">{m.text}</p>
              <p className="mt-1 text-right font-mono text-[0.6875rem] text-slate-500">
                {m.at}
              </p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Share live location pill */}
      <button
        type="button"
        onClick={shareLocation}
        className="mt-2 flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/10 text-sm font-bold text-emerald-300 transition active:scale-95"
      >
        <MapPin className="h-4 w-4" aria-hidden /> Share Live Location
      </button>

      {/* Input bar */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={recordVoiceNote}
          disabled={recording}
          aria-label="Record voice note"
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-95 disabled:opacity-60 ${
            recording
              ? "border-red-400 bg-red-500/25 text-red-300"
              : "border-[#2a3a5a] bg-[#0d1526] text-slate-300"
          }`}
        >
          <Mic className={`h-6 w-6 ${recording ? "animate-pulse" : ""}`} />
        </button>

        <button
          type="button"
          onClick={sharePhoto}
          aria-label="Share damage photo"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#2a3a5a] bg-[#0d1526] text-slate-300 transition active:scale-95"
        >
          <Camera className="h-6 w-6" />
        </button>

        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendText()}
          placeholder="Secure message…"
          aria-label="Message"
          className="h-12 min-w-0 flex-1 rounded-full border-2 border-[#2a3a5a] bg-[#0d1526] px-4 text-base text-gray-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
        />

        <button
          type="button"
          onClick={sendText}
          aria-label="Send message"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-cyan-400/70 bg-cyan-500/20 text-cyan-300 transition active:scale-95"
        >
          <Send className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
