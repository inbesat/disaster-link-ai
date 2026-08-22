"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { clearViewAsPublic, setViewAsPublic } from "@/app/actions/auth";

// ---------------------------------------------------------------------
// ViewAsPublicToggle — Phase 1 · Step 10. Gov officials can preview the
// citizen app exactly as citizens see it. Flipping the switch ON calls
// setViewAsPublic (writes the view_as_public=true cookie, 24h) and routes
// to /public/dashboard; the sticky PreviewModeBanner (rendered by the
// /public layout) then sits on top of every public page so the previewer
// always has a way back. Flipping OFF (only reachable if the parent page
// renders it while the cookie is somehow still set) clears the cookie.
// ---------------------------------------------------------------------
export default function ViewAsPublicToggle({
  initialActive = false,
}: {
  initialActive?: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  const router = useRouter();

  async function handleToggle(next: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      setActive(next);
      if (next) {
        // Sets the view_as_public cookie server-side, then navigate client-side.
        await setViewAsPublic();
        router.push("/public/dashboard");
      } else {
        await clearViewAsPublic();
        router.push("/gov/dashboard");
      }
    } catch {
      // Server-action failure — reset the switch state.
      setActive(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full items-center justify-between gap-4 rounded-[var(--dl-radius)] border border-[var(--dl-blue)]/25 bg-[var(--dl-navy-2)] p-4 ring-1 ring-transparent transition focus-within:ring-[var(--dl-blue)]/50">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blue)]/20 text-[var(--dl-blue-light)]"
        >
          <Eye className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-white">View as Public</p>
          <p className="text-xs text-[var(--dl-text-muted)]">
            Preview the citizen app exactly as citizens see it
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label="Preview the citizen app as a public user"
        disabled={busy}
        onClick={() => handleToggle(!active)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-blue)] disabled:cursor-wait disabled:opacity-60 ${
          active ? "bg-[var(--dl-blue)]" : "bg-white/15"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
            active ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
