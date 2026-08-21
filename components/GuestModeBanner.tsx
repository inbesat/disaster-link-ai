import Link from "next/link";
import { AlertTriangle, LogOut, UserPlus } from "lucide-react";
import { exitGuestMode } from "@/app/actions/auth";

// ---------------------------------------------------------------------
// GuestModeBanner — Phase 1 · Step 9. Persistent banner shown at the top
// of the citizen dashboard whenever the visitor is in guest mode
// (guest_mode=true cookie, set by enableGuestMode for rapid browse-only
// access). Nudges the guest to sign up for personalized alerts and family
// contacts; the Exit action clears the guest session and returns home.
// The guest_mode flag is read from the cookie by the parent server
// component (app/public/layout.tsx) and passed in, since this component
// ships interactive elements and therefore must stay a Client Component.
// ---------------------------------------------------------------------
export default function GuestModeBanner({ isGuest }: { isGuest: boolean }) {
  if (!isGuest) return null;

  return (
    <div
      role="status"
      aria-label="Guest mode active"
      className="sticky top-0 z-40 w-full border-b border-amber-500/30 bg-amber-500/10 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:px-6">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300"
        >
          <AlertTriangle className="h-4 w-4" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-medium text-amber-100">
          <span className="font-bold">Guest Mode:</span> Sign up to receive personalized
          alerts and save family contacts.
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/login?mode=citizen"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-[var(--dl-navy)] transition hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <UserPlus aria-hidden="true" className="h-3.5 w-3.5" />
            Sign up
          </Link>
          <form action={exitGuestMode}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 px-3.5 py-1.5 text-xs font-semibold text-amber-200 transition hover:border-amber-400 hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
              Exit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
