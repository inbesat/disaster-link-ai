// ---------------------------------------------------------------------
// components/navigation/SidebarHeader.tsx
// UI/UX Phase 2 · Step 1 — sidebar brand header.
//
// Top of the Sidebar shell:
//   • logo tile       — Activity wave in an accent-tinted, glowing square
//   • live StatusDot  — pulsing online dot (Phase 1) badge on the logo
//   • brand           — "DRIP" + caption, only visible when expanded
//                       (width/opacity transition, so collapse animates)
// ---------------------------------------------------------------------

import StatusDot from "@/components/ui/StatusDot";
import Logo from "@/components/ui/Logo";

type SidebarHeaderProps = {
  /** Sidebar expansion state — hides the brand text when false. */
  expanded: boolean;
  className?: string;
};

export function SidebarHeader({ expanded, className = "" }: SidebarHeaderProps) {
  return (
    <div
      className={`flex h-16 shrink-0 items-center gap-3 border-b border-subtle px-3 ${className}`}
    >
      {/* Brand mark + pulsing live-status dot */}
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        <Logo className="h-9 w-9" />
        <span
          className="absolute -right-0.5 -top-0.5 rounded-full bg-secondary p-[2px]"
          aria-hidden
        >
          <StatusDot status="online" name="Live" />
        </span>
      </span>

      {/* Brand — kept mounted so collapse animates instead of popping */}
      <div
        className={`overflow-hidden transition-all duration-300 motion-reduce:transition-none ${
          expanded ? "w-auto opacity-100" : "w-0 opacity-0"
        }`}
      >
        <p className="whitespace-nowrap text-sm font-bold tracking-widest text-primary">
          SafeSphere
        </p>
        <p className="whitespace-nowrap text-[0.625rem] font-medium uppercase tracking-widest text-muted">
          Command Center
        </p>
      </div>
    </div>
  );
}

export default SidebarHeader;
