import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------
// components/settings/SettingsPlaceholder.tsx
//
// Used by the 8 settings section pages until their dedicated phases are
// built. Renders a consistent "coming in a later phase" panel so the
// shell + sidebar navigation can be demonstrated end-to-end.
// ---------------------------------------------------------------------

export default function SettingsPlaceholder({
  icon: Icon,
  title,
  description,
  phase,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <section className="rounded-eoc border border-[#1c2740] bg-surface p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="min-w-0">
          <p className="eoc-label text-amber-400/80">{phase}</p>
          <h2 className="mt-0.5 text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-md border border-dashed border-[#2c3f6d] bg-surface-muted/40 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <p className="text-xs text-slate-500">
          This section is part of the Settings roadmap and will be built in a
          later phase. The navigation shell is live.
        </p>
      </div>
    </section>
  );
}
