"use client";

// ---------------------------------------------------------------------
// components/public/ai/SahayakChat.tsx — Phase 6 · Steps 1–2 · the
// Public AI Safety Assistant shell.
//
// Sahayak ("helper") is the citizen's calm safety companion — it must
// feel like a friend in the same room, not a tool in a dashboard. So:
//
//   • A friendly pill FAB floats bottom-right on every /public page and
//     opens a framer-motion BOTTOM SHEET instead of a full page.
//   • The sheet has two snap points — 60% (default) and 100% (expanded)
//     — and is physically draggable: grab the handle and fling it to a
//     snap, or drag it down past the 60% point to dismiss it entirely.
//   • The surface is a dark, calm navy; the welcome bubble is the
//     WhatsApp-green greeting from ChatMessage.
//
// The sheet mechanics mirror components/map/MapBottomSheet.tsx (motion
// value `y` + Framer's `animate()` spring settle), minus the mobile-only
// gate: the companion lives on every screen size.
//
// The composer below is a MOCK: it appends the user's words and replies
// with a calm canned answer (t("sahayak_reply")) after a short typing
// pause so the demo never dead-ends. Later Phase 6 steps swap this for
// real guidance. Above the input sits the Step 3 panic-proof QuickPrompts
// row (each intent gets its own canned reply), and the Step 4 VoiceInput
// mic lets scared, wet-handed or low-literacy users speak instead of type.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { Bot, ChevronDown, ChevronUp, MessageCircle, ScanLine, Send, WifiOff, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { showToast } from "@/components/ui/Toast";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { matchOfflineFaq } from "@/lib/mock-data/offline-faq";
import { writeSafeStatus } from "@/lib/mock-data/public-alerts";
import ChatMessage from "./ChatMessage";
import DocumentScanner from "./DocumentScanner";
import QuickPrompts from "./QuickPrompts";
import ResponseCard, { type ResponseCardData } from "./ResponseCards";
import VoiceInput, { speechLocaleFor } from "./VoiceInput";

/** Snap points as a fraction of the viewport height that stays visible. */
const SNAP_COLLAPSED = 0.6;
const SNAP_EXPANDED = 1.0;
/** Extra drag distance past 60% that counts as "dismiss". */
const CLOSED_MARGIN = 0.1;
/** How long the panel takes to fly off-screen before unmounting. */
const CLOSE_ANIM_MS = 420;
/** Canned reply delay — lets the typing dots breathe like a real chat. */
const TYPING_MS = 1800;

const spring = { type: "spring", stiffness: 320, damping: 34, mass: 0.9 } as const;
const none = { duration: 0 } as const;

const nowTime = () =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());

type ChatEntry = {
  id: string;
  role: "user" | "ai";
  /** Plain bubble text — omitted when the entry carries a `card` instead. */
  content?: string;
  /** Structured UI response (Step 5) — checklist / route / action card. */
  card?: ResponseCardData;
  timestamp: string;
};

export function SahayakChat() {
  const { t, language } = useTranslation();
  const reduceMotion = useReducedMotion();
  // Phase 6 · Step 6 — live connectivity (hydrates safe: online on first
  // paint, corrected right after mount). While offline, the amber banner
  // shows and answers come from the local FAQ instead of the AI.
  const online = useOnlineStatus();

  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState<"collapsed" | "expanded">("collapsed");
  const [vh, setVh] = useState(0);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  // Phase 6 · Step 9 — local OCR document scanner (camera/file → mock
  // Tesseract → save the scanned ID on-device).
  const [scannerOpen, setScannerOpen] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // The sheet's translate-y — 0 = fully expanded, positive = lower.
  const y = useMotionValue(0);
  // Drag is bound to the handle strip (not the whole sheet) so scrolling
  // the message list never fights the sheet's translation.
  const dragControls = useDragControls();

  // Translate-y for a snap point, in px (shows `snap` fraction of content).
  const snapToPx = useCallback(
    (fraction: number) => (vh > 0 ? vh * (1 - fraction) : window.innerHeight * (1 - fraction)),
    [vh],
  );
  // Fully hidden translate-y — past the 60% position, off the bottom edge.
  const closedPx = useCallback(
    () => snapToPx(SNAP_COLLAPSED) + window.innerHeight * CLOSED_MARGIN,
    [snapToPx],
  );

  // Physics-perfect settle onto a pixel target (respecting reduced motion).
  const settle = useCallback(
    (px: number) => animate(y, px, reduceMotion ? none : spring),
    [y, reduceMotion],
  );

  // Seed the conversation with the welcome message on first mount.
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "ai",
        content: t("sahayak_welcome"),
        timestamp: nowTime(),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the live viewport height while the sheet is open so the drag
  // constraints and snap maths stay exact through resizes / rotation.
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const measure = () => setVh(window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  // Esc closes the sheet; focus returns to the FAB either way.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-scroll new content into view (new bubbles + the typing dots).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const openSheet = () => {
    triggerLightHaptic();
    setOpen(true);
    setSnap("collapsed");
    settle(snapToPx(SNAP_COLLAPSED));
  };

  const close = () => {
    settle(closedPx());
    // Focus returns to the launcher AFTER the sheet unmounts — the FAB only
    // exists once `open` flips false, so focusing inside the animation
    // window would hit a null ref and drop focus to <body>.
    window.setTimeout(() => {
      setOpen(false);
      fabRef.current?.focus();
    }, CLOSE_ANIM_MS);
  };

  // Called after the sheet mounts so focus lands in the composer.
  useEffect(() => {
    if (open) {
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 320);
      return () => window.clearTimeout(focusTimer);
    }
  }, [open]);

  const toggleSnap = () => {
    triggerLightHaptic();
    const next = snap === "collapsed" ? "expanded" : "collapsed";
    setSnap(next);
    settle(snapToPx(next === "expanded" ? SNAP_EXPANDED : SNAP_COLLAPSED));
  };

  const handleDragEnd = () => {
    const current = y.get();
    // Flung past the 60% position by a real margin → dismiss the sheet.
    if (current > snapToPx(SNAP_COLLAPSED) + vh * CLOSED_MARGIN) {
      close();
      return;
    }
    // Otherwise snap to whichever of 60% / 100% is nearest.
    const expandedPx = snapToPx(SNAP_EXPANDED);
    const collapsedPx = snapToPx(SNAP_COLLAPSED);
    const next = Math.abs(current - expandedPx) < Math.abs(current - collapsedPx)
      ? "expanded"
      : "collapsed";
    setSnap(next);
    settle(snapToPx(next === "expanded" ? SNAP_EXPANDED : SNAP_COLLAPSED));
  };

  // Shared send path — used by the composer, the quick prompts (which pass
  // their own intent-specific reply — text OR a structured card) and future
  // channels. While OFFLINE the AI call is intercepted: the query is run
  // against the local FAQ first, the generic offline fallback second.
  const sendPrompt = (text: string, reply?: string | ResponseCardData) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: trimmed, timestamp: nowTime() },
    ]);
    setDraft("");
    setTyping(true);

    let answer: string | ResponseCardData | undefined = reply;
    if (!online && answer === undefined) {
      const match = matchOfflineFaq(trimmed);
      if (match) {
        // Local Q&A pair — show the matched question + the local answer.
        answer = `📖 ${t(`offline_q_${match.id}`)}\n\n${t(`offline_a_${match.id}`)}`;
      } else {
        answer = t("offline_fallback");
      }
    }

    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "ai",
          // Inline the type check so TS narrows `answer` correctly.
          ...(typeof answer === "object"
            ? { card: answer }
            : { content: answer ?? t("sahayak_reply") }),
          timestamp: nowTime(),
        },
      ]);
    }, TYPING_MS);
  };

  // Phase 6 · Step 5 — the action card's one-tap "I am safe": persist the
  // safe status (same helper as the SafetyNudge) and confirm with a toast.
  const handleMarkSafe = () => {
    triggerLightHaptic();
    writeSafeStatus();
    showToast("success", {
      title: t("toast_safe_sent"),
      description: t("toast_safe_sent_desc"),
    });
  };

  const handleSend = () => sendPrompt(draft);

  // Voice result drops straight into the composer and hands it focus.
  const handleVoiceResult = (text: string) => {
    setDraft(text);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  // The Web Speech engine speaks the app's active language (en-IN, hi-IN,
  // bn-IN, …) — the LLM backend handles any translation downstream.
  // speechLocaleFor falls back to hi-IN for locales the engine doesn't cover.
  const voiceLang = speechLocaleFor(language);

  const handleComposerKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const constraintBottom = vh > 0 ? closedPx() : snapToPx(SNAP_COLLAPSED) + 1;

  return (
    <>
      {/* Floating launcher — bottom-right, clear of the mobile nav and the
          desktop EmergencyContactCard (bottom-4 right-4) by lifting to
          bottom-24 on md+. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            ref={fabRef}
            type="button"
            onClick={openSheet}
            aria-label={t("sahayak_open")}
            initial={{ opacity: 0, scale: 0.8, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-[#16a34a] to-[#0d9488] pl-4 pr-5 text-white shadow-[0_10px_28px_rgba(16,185,129,0.4)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34d399] md:bottom-24"
          >
            <span className="relative flex h-6 w-6 items-center justify-center">
              <MessageCircle className="h-6 w-6" strokeWidth={2} aria-hidden />
              {/* Calm "awake" dot — the companion is always listening. */}
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#a7f3d0] ring-2 ring-[#16a34a]/60"
              />
            </span>
            <span className="text-sm font-bold tracking-wide">Sahayak</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            {/* Dim the page behind the sheet so the conversation is the
                only thing in the room. */}
            <motion.div
              key="sahayak-backdrop"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              className="fixed inset-0 z-[55] bg-black/50"
            />

            <motion.section
              key="sahayak-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Sahayak safety assistant"
              style={{ y, touchAction: "pan-y", willChange: "transform" }}
              transition={spring}
              drag="y"
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: constraintBottom }}
              dragElastic={{ top: 0.1, bottom: 0.05 }}
              dragMomentum={false}
              onDragEnd={handleDragEnd}
              className="fixed inset-x-0 bottom-0 z-[60] flex h-screen flex-col overflow-hidden rounded-t-3xl border-t border-x border-white/10 bg-[linear-gradient(180deg,#12314a_0%,#0a1d30_100%)] shadow-[0_-16px_60px_rgba(0,0,0,0.55)] supports-[height:100dvh]:h-[100dvh]"
            >
              {/* Drag handle — the whole strip is the grab surface; the
                  gesture binds here via useDragControls so message-list
                  scrolling stays independent of the sheet's drag. */}
              <div
                aria-hidden
                onPointerDown={(e) => dragControls.start(e)}
                className="flex shrink-0 cursor-grab touch-none flex-col items-center pt-3 pb-1 active:cursor-grabbing"
              >
                <span className="h-1.5 w-12 rounded-full bg-white/25" />
              </div>

              {/* Header — avatar, name, calm status, expand + close. */}
              <div className="flex shrink-0 items-center gap-3 px-4 pb-3 pt-1">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e4a39] ring-1 ring-[#dcf8c6]/25 shadow-[0_2px_12px_rgba(16,185,129,0.3)]">
                  <Bot className="h-5 w-5 text-[#dcf8c6]" strokeWidth={2.1} aria-hidden />
                  <span
                    aria-hidden
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#34d399] ring-2 ring-[#0e2a45]"
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold leading-tight text-white">Sahayak</p>
                  <p className="truncate text-xs text-[#7dd3a8]">
                    {t("sahayak_online")} · {t("sahayak_status")}
                  </p>
                </div>

                <IconButton
                  label={snap === "collapsed" ? "Expand chat" : "Collapse chat"}
                  variant="ghost"
                  size="sm"
                  onClick={toggleSnap}
                >
                  {snap === "collapsed" ? (
                    <ChevronUp className="h-4 w-4" aria-hidden />
                  ) : (
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  )}
                </IconButton>

                <IconButton
                  label={t("sahayak_close")}
                  variant="ghost"
                  size="sm"
                  onClick={close}
                >
                  <X className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>

              {/* Phase 6 · Step 6 — sticky amber banner while offline. Sits
                  outside the scroll area so it's always visible. */}
              {!online && (
                <div
                  role="status"
                  className="flex shrink-0 items-center gap-2.5 border-y border-[#fbbf24]/30 bg-[#b45309]/25 px-4 py-2.5"
                >
                  <WifiOff className="h-4 w-4 shrink-0 text-[#fcd34d]" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#fde68a]">{t("offline_title")}</p>
                    <p className="truncate text-[11px] text-[#fbbf24]/90">
                      {t("offline_desc")}
                    </p>
                  </div>
                </div>
              )}

              {/* Messages — the welcome bubble is already seeded; card
                  entries render as structured UI instead of a bubble. */}
              <div
                ref={scrollRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4"
              >
                {messages.map((m) =>
                  m.card ? (
                    <ResponseCard
                      key={m.id}
                      data={m.card}
                      onAction={
                        m.card.kind === "action" ? handleMarkSafe : undefined
                      }
                    />
                  ) : (
                    <ChatMessage key={m.id} role={m.role} timestamp={m.timestamp}>
                      {m.content}
                    </ChatMessage>
                  ),
                )}

                {/* Calm typing indicator while the mock is "thinking". */}
                <AnimatePresence>
                  {typing && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="flex items-end gap-2"
                    >
                      <span
                        aria-hidden
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2a4d3c] ring-1 ring-[#dcf8c6]/30"
                      >
                        <Bot className="h-[18px] w-[18px] text-[#dcf8c6]" strokeWidth={2.2} />
                      </span>
                      <span className="flex items-center gap-1.5 rounded-2xl rounded-bl-[4px] bg-[#dcf8c6]/90 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.25)]">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-2 w-2 animate-bounce rounded-full bg-[#1a2e1e]/50"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Composer — quick prompts above, mic + input + send below.
                  `relative` anchors VoiceInput's floating listening strip. */}
              <div className="relative shrink-0 border-t border-white/10 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)]">
                <QuickPrompts onSelect={(prompt, reply) => sendPrompt(prompt, reply)} disabled={typing} />

                <div className="flex items-end gap-2">
                  {/* Scan-ID trigger — opens the offline OCR scanner. */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      triggerLightHaptic();
                      setScannerOpen(true);
                    }}
                    aria-label={t("scan_open")}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#34d399]/25 bg-white/5 text-[#6ee7b7] transition-colors hover:border-[#34d399]/60 hover:bg-[#34d399]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34d399]"
                  >
                    <ScanLine className="h-6 w-6" strokeWidth={2} aria-hidden />
                  </motion.button>

                  <VoiceInput onResult={handleVoiceResult} lang={voiceLang} disabled={typing} />
                  <div className="flex min-h-[48px] flex-1 items-center rounded-2xl border border-white/15 bg-white/5 px-4 focus-within:border-[#34d399]/60 focus-within:ring-1 focus-within:ring-[#34d399]/30">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleComposerKey}
                      placeholder={t("sahayak_placeholder")}
                      aria-label={t("sahayak_placeholder")}
                      className="max-h-[108px] min-h-[32px] flex-1 resize-none bg-transparent py-2.5 text-[15px] text-white outline-none placeholder:text-[#7f96ad]"
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleSend}
                    disabled={!draft.trim() || typing}
                    aria-label={t("sahayak_send")}
                    whileTap={{ scale: 0.92 }}
                    className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#16a34a] to-[#0d9488] text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34d399] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <Send className="h-5 w-5" aria-hidden />
                  </motion.button>
                </div>
              </div>
            </motion.section>

            {/* Offline OCR scanner modal (Step 9). Rendered OUTSIDE the
                sheet: the sheet carries a framer `y` transform, which would
                otherwise become the containing block for the modal's
                position:fixed backdrop and clip it. z-[65] still overlays. */}
            <DocumentScanner
              open={scannerOpen}
              onClose={() => setScannerOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default SahayakChat;
