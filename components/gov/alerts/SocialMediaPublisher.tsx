"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/SocialMediaPublisher.tsx — Phase 11 · Step 7 ·
// Social Media Cross-Posting & Image Generation.
//
// Broadcasts the finalized alert message to the district's official
// Twitter/X, Facebook and Telegram accounts simultaneously.
//
// The core value here is the generated "Social Media Image Card": a square
// graphic of the district logo + a mock map snippet of the target zone +
// large text summarising the alert. In production this card is rendered to
// PNG server-side and attached to every social post; here it's previewed
// live and the styles are reused as the published asset.
//
// NOTE: For a tidy demo this panel keeps its own editable "finalized alert"
// field (pre-filled with a realistic flood message). In a full build it
// would be driven by the composer's Step 1 message via shared state.
// ---------------------------------------------------------------------

import { useState } from "react";
import { AtSign, MapPin, RadioTower, Share2, Send, ThumbsUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { formatCompact, GOV_DISTRICTS } from "@/lib/mock-data/gov-alert-targets";

type Platform = "twitter" | "facebook" | "telegram";

const PLATFORMS: Array<{
  id: Platform;
  label: string;
  handle: string;
  active: string;
  inactive: string;
  Icon: LucideIcon;
}> = [
  {
    id: "twitter",
    label: "Twitter / X",
    handle: "@biharmandofficial",
    active: "border-sky-400/60 bg-sky-400/15 text-sky-300",
    inactive: "border-white/10 bg-white/5 text-slate-400",
    Icon: AtSign,
  },
  {
    id: "facebook",
    label: "Facebook",
    handle: "fb.com/BDMC.bihar",
    active: "border-blue-500/60 bg-blue-500/15 text-blue-300",
    inactive: "border-white/10 bg-white/5 text-slate-400",
    Icon: ThumbsUp,
  },
  {
    id: "telegram",
    label: "Telegram",
    handle: "@bihar_disaster",
    active: "border-sky-500/60 bg-sky-500/15 text-sky-300",
    inactive: "border-white/10 bg-white/5 text-slate-400",
    Icon: Send,
  },
];

const DEFAULT_MESSAGE =
  "Heavy rainfall has pushed River Ganga above the danger mark near Danapur. Move to higher ground now. Shelter opened at Danapur High School.";

export function SocialMediaPublisher() {
  const toast = useToast();
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [district, setDistrict] = useState<string>("Patna");
  const [selected, setSelected] = useState<ReadonlySet<Platform>>(
    new Set<Platform>(["twitter", "facebook"]),
  );

  const togglePlatform = (id: Platform) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const headline = message.split(/\s+/).slice(0, 7).join(" ");

  const postToSocials = () => {
    const chosen = PLATFORMS.filter((p) => selected.has(p.id));
    if (chosen.length === 0) {
      toast.warning({
        title: "No platforms selected",
        description: "Switch on at least one social channel.",
      });
      return;
    }
    const population = formatCompact(
      // approximate target reach for the card footer
      462_000,
    );
    toast.success({
      title: "Posted to socials",
      description: `${chosen.map((p) => p.label).join(", ")} · image card generated for ${district} · reach ≈ ${population}`,
      duration: 6000,
    });
  };

  return (
    <section
      className="rounded-xl border border-white/10 bg-secondary p-5"
      aria-label="Social media cross-posting"
    >
      <header className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-purple/30 bg-accent-purple/10 text-accent-purple">
          <Share2 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Social Media Cross-Post
          </h2>
          <p className="text-xs text-muted">
            Broadcast the finalized alert to official handles simultaneously
          </p>
        </div>
      </header>

      {/* Finalized alert message (Step 1 output). */}
      <label
        htmlFor="social-message"
        className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400"
      >
        Finalized alert message
      </label>
      <textarea
        id="social-message"
        value={message}
        onChange={(e) => setMessage(e.target.value.slice(0, 280))}
        rows={3}
        maxLength={280}
        placeholder="Enter the finalized alert to broadcast…"
        className="w-full resize-y rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-white placeholder:text-muted focus:border-accent-purple/60 focus:outline-none"
      />

      {/* Platform toggles. */}
      <div className="mt-4">
        <p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400">
          Destination accounts
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PLATFORMS.map((p) => {
            const Icon = p.Icon;
            const active = selected.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => togglePlatform(p.id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition ${
                  active ? p.active : p.inactive
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-white">
                    {p.label}
                  </span>
                  <span className="block truncate text-[0.625rem] text-slate-400">
                    {p.handle}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
                    active
                      ? "border-accent-purple bg-accent-purple shadow-[0_0_8px_rgba(139,92,246,0.8)]"
                      : "border-white/20"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Mock Social Media Image Card preview. */}
      <p className="mb-2 mt-4 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400">
        Generated image card · preview
      </p>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
        {/* Square narration the card is built from. */}
        <div className="flex aspect-square w-full max-w-[380px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1526] shadow-lg">
          {/* Logo bar. */}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-purple/20 text-accent-purple">
                <RadioTower className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-white">
                Bihar · Disaster Mgmt
              </span>
            </span>
            <span className="rounded bg-severity-red-600 px-1.5 py-0.5 text-[0.5625rem] font-black uppercase tracking-wider text-white">
              Evacuate
            </span>
          </div>

          {/* Mock map snippet of the target area. */}
          <div
            aria-hidden
            className="relative mx-4 flex-1 overflow-hidden rounded-lg border border-white/10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.25),transparent_60%)] bg-[length:100%_100%]" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]" />
            {/* Fake hazard contour + river line. */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 200 120"
              preserveAspectRatio="none"
            >
              <path
                d="M0,80 C40,60 70,90 110,70 S170,50 200,65"
                stroke="rgba(59,130,246,0.8)"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M30,95 C60,80 90,98 130,84 S180,72 200,84"
                stroke="rgba(239,68,68,0.8)"
                strokeWidth="2"
                strokeDasharray="5 5"
                fill="none"
              />
            </svg>
            <span className="absolute left-2 top-2 flex items-center gap-1 text-[0.625rem] font-bold text-sky-300">
              <MapPin className="h-3 w-3" aria-hidden />
              {district} · target zone
            </span>
            <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[0.5625rem] font-bold text-white">
              HIGH RISK
            </span>
          </div>

          {/* Large alert summary text. */}
          <div className="px-4 py-3">
            <p className="text-[0.8125rem] font-black leading-snug text-white md:text-base">
              {headline}
              {message.trim().split(/\s+/).length > 7 ? "…" : ""}
            </p>
            <p className="mt-1 text-[0.625rem] font-bold uppercase tracking-wider text-accent-purple">
              Stay safe · Move to higher ground
            </p>
          </div>
        </div>

        {/* Side meta (what gets posted). */}
        <div className="flex flex-col justify-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Card: {selected.size}/{PLATFORMS.length} platforms
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            District: {district}
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {message.length} / 280 chars
          </div>
          <label
            htmlFor="social-district"
            className="mt-2 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400"
          >
            Target district
          </label>
          <select
            id="social-district"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-sm text-white focus:border-accent-purple/60 focus:outline-none"
          >
            {GOV_DISTRICTS.map((d) => (
              <option key={d} value={d} className="bg-secondary">
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Post to Socials. */}
      <button
        type="button"
        onClick={postToSocials}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent-primary text-sm font-bold uppercase tracking-wider text-white shadow-[0_4px_18px_rgba(59,130,246,0.4)] transition hover:brightness-110 active:scale-[0.99]"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        Post to Socials
      </button>
      <p className="mt-2 text-[0.625rem] leading-snug text-slate-500">
        One click publishes the image card + message to every selected official account.
      </p>
    </section>
  );
}

export default SocialMediaPublisher;
