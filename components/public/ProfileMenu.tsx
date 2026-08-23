"use client";

// ---------------------------------------------------------------------
// components/public/ProfileMenu.tsx — identity-aware profile avatar +
// dropdown for the citizen navbar.
//
// Guest  → grey silhouette; dropdown reads "You are browsing as a Guest"
//          with a bold "Create Account / Sign In" CTA.
// User   → coloured circle with initials (or their avatar image);
//          dropdown shows name, email and a Sign Out action.
//
// The identity is resolved server-side by PublicNavbar and passed in as
// a plain, serialisable prop (no session logic leaks into the client).
// ---------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { initialsFor } from "@/lib/settings/avatar";

export type PublicIdentity =
  | { mode: "guest" }
  | { mode: "user"; name: string; email: string; avatarUrl: string | null };

const AVATAR_COLORS = [
  "bg-[var(--brand-orange)]",
  "bg-[var(--brand-blue)]",
  "bg-severity-green-500",
  "bg-[#8B5CF6]",
  "bg-severity-red-500",
];

/** Deterministic colour from the name so each user keeps one avatar hue. */
function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function ProfileMenu({
  identity,
}: {
  identity: PublicIdentity;
}) {
  const [open, setOpen] = useState(false);
  const isUser = identity.mode === "user";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          isUser ? `Account menu for ${identity.name}` : "Guest session menu"
        }
        className="shrink-0 rounded-full transition hover:brightness-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
      >
        {isUser ? (
          identity.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={identity.avatarUrl}
              alt={identity.name}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white/10 ${colorFor(
                identity.name,
              )}`}
            >
              {initialsFor(identity.name)}
            </span>
          )
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600/60 text-slate-300 ring-2 ring-white/10">
            <UserRound aria-hidden className="h-5 w-5" />
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Invisible backdrop — closes the menu on any outside click */}
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0f2a4f]/95 p-1 shadow-2xl backdrop-blur"
          >
            {isUser ? (
              <>
                <div className="px-3 py-3">
                  <p className="truncate text-sm font-bold text-white">
                    {identity.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[var(--dl-text-muted)]">
                    {identity.email}
                  </p>
                </div>
                <div className="my-1 h-px bg-white/10" />
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-white/5"
                  >
                    <LogOut aria-hidden className="h-4 w-4" />
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <div className="p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <UserRound aria-hidden className="h-4 w-4 text-slate-400" />
                  Guest Session
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--dl-text-muted)]">
                  You are browsing as a Guest
                </p>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-3 flex w-full items-center justify-center rounded-lg bg-[var(--dl-orange)] px-4 py-2.5 text-sm font-bold text-[#0a0f1a] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
                >
                  Create Account / Sign In
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}