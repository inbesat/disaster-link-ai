import { cookies } from "next/headers";
import { Eye, ShieldCheck } from "lucide-react";
import { clearViewAsPublic } from "@/app/actions/auth";

// ---------------------------------------------------------------------
// PreviewModeBanner — Phase 1 · Step 10. Sticky red banner rendered by the
// /public layout at the top of EVERY public page while a gov official holds
// the view_as_public=true cookie (set by ViewAsPublicToggle). Clicking
// "Return to Command Center" clears the cookie and sends them back to
// /gov/dashboard. Server component: reads the cookie server-side so the
// banner appears/disappears with the page, never flashing on the client.
// ---------------------------------------------------------------------
export default function PreviewModeBanner() {
  const previewing = cookies().get("view_as_public")?.value === "true";
  if (!previewing) return null;

  return (
    <div
      role="status"
      aria-label="Preview mode active"
      className="sticky top-0 z-50 w-full border-b border-red-400/40 bg-red-600/90 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2.5 md:justify-between md:px-6">
        <div className="flex items-center gap-2.5">
          <Eye aria-hidden="true" className="h-4 w-4 shrink-0 text-white" />
          <p className="text-sm font-bold text-white">
            🔴 PREVIEW MODE —{" "}
            <span className="font-medium">
              You are viewing the citizen app as a public user.
            </span>
          </p>
        </div>
        <form action={clearViewAsPublic}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
            Return to Command Center
          </button>
        </form>
      </div>
    </div>
  );
}
