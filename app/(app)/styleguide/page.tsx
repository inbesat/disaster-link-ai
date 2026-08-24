// ---------------------------------------------------------------------
// app/(app)/styleguide/page.tsx
// UI/UX Phase 1 · Step 8 — Design Tokens Preview (internal Storybook).
//
// HIDDEN reference page — no nav links, reachable at /styleguide. Renders
// every roadmap token + the Phase 1 components on one screen so the team
// can eyeball the design system. The swatches resolve their CSS variables
// at runtime (and re-read when the theme flips dark ⇄ day-ops), so the
// page doubles as a live token inspector.
// ---------------------------------------------------------------------

"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  Building2,
  Check,
  MapPin,
  Plus,
  Settings,
  ShieldCheck,
  Ship,
  Tent,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";
import DataRow from "@/components/ui/DataRow";
import Icon from "@/components/ui/Icon";
import IconButton from "@/components/ui/IconButton";
import Panel from "@/components/ui/Panel";
import SeverityBadge from "@/components/ui/SeverityBadge";
import DashboardSidebar from "@/components/navigation/DashboardSidebar";
import Sidebar from "@/components/navigation/Sidebar";
import SidebarNavItem from "@/components/navigation/SidebarNavItem";
import SidebarSection from "@/components/navigation/SidebarSection";
import { ROLES, type Role } from "@/lib/validations/user";
import {
  SkeletonCard,
  SkeletonLoader,
  SkeletonRow,
} from "@/components/ui/SkeletonLoader";
import StatCard from "@/components/ui/StatCard";
import StatusDot from "@/components/ui/StatusDot";

/* ------------------------------------------------------------------ */
/*  Token data — mirrors the variables declared in app/globals.css     */
/* ------------------------------------------------------------------ */

type ColorToken = {
  name: string;
  variable: string;
  usage: string;
};

const BG_TOKENS: ColorToken[] = [
  { name: "bg-primary", variable: "--bg-primary", usage: "Page background" },
  { name: "bg-secondary", variable: "--bg-secondary", usage: "Cards · panels · toasts" },
  { name: "bg-tertiary", variable: "--bg-tertiary", usage: "Icon tiles · hover tints" },
];

const ACCENT_TOKENS: ColorToken[] = [
  {
    name: "accent-primary",
    variable: "--accent-primary",
    usage: "Primary action · info",
  },
  {
    name: "accent-success",
    variable: "--accent-success",
    usage: "Safe · online · success",
  },
  { name: "accent-warning", variable: "--accent-warning", usage: "Watch · busy" },
  {
    name: "accent-danger",
    variable: "--accent-danger",
    usage: "Warning · critical · error",
  },
  { name: "accent-purple", variable: "--accent-purple", usage: "AI · special emphasis" },
  // Legacy EOC accents — also match the --accent-* glob; kept for old surfaces.
  { name: "accent", variable: "--accent", usage: "Legacy EOC accent (kept)" },
  {
    name: "accent-soft",
    variable: "--accent-soft",
    usage: "Legacy EOC soft tint (kept)",
  },
];

const SEVERITY_TOKENS: ColorToken[] = [
  { name: "severity-safe", variable: "--severity-safe", usage: "Safe chip background" },
  {
    name: "severity-watch",
    variable: "--severity-watch",
    usage: "Watch chip background",
  },
  {
    name: "severity-warning",
    variable: "--severity-warning",
    usage: "Warning chip background",
  },
  {
    name: "severity-critical",
    variable: "--severity-critical",
    usage: "Critical chip background",
  },
];

const LEGACY_SEVERITY_TOKENS: ColorToken[] = [
  {
    name: "severity-green-300",
    variable: "--severity-green-300",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-green-400",
    variable: "--severity-green-400",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-green-500",
    variable: "--severity-green-500",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-green-600",
    variable: "--severity-green-600",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-amber-300",
    variable: "--severity-amber-300",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-amber-400",
    variable: "--severity-amber-400",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-amber-500",
    variable: "--severity-amber-500",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-amber-600",
    variable: "--severity-amber-600",
    usage: "Legacy EOC scale",
  },
  { name: "severity-red-300", variable: "--severity-red-300", usage: "Legacy EOC scale" },
  { name: "severity-red-400", variable: "--severity-red-400", usage: "Legacy EOC scale" },
  { name: "severity-red-500", variable: "--severity-red-500", usage: "Legacy EOC scale" },
  { name: "severity-red-600", variable: "--severity-red-600", usage: "Legacy EOC scale" },
  {
    name: "severity-purple-300",
    variable: "--severity-purple-300",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-purple-400",
    variable: "--severity-purple-400",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-purple-500",
    variable: "--severity-purple-500",
    usage: "Legacy EOC scale",
  },
  {
    name: "severity-purple-600",
    variable: "--severity-purple-600",
    usage: "Legacy EOC scale",
  },
];

/** Swatch that resolves its variable at runtime + follows theme changes. */
function ColorSwatch({ token }: { token: ColorToken }) {
  const [resolved, setResolved] = useState("");

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const hex = getComputedStyle(root).getPropertyValue(token.variable).trim();
      const rgb = getComputedStyle(root).getPropertyValue(`${token.variable}-rgb`).trim();
      setResolved(rgb ? `${hex} · rgb(${rgb})` : hex);
    };
    read();
    // next-themes toggles the `dark` class — re-resolve when it flips.
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [token.variable]);

  return (
    <div className="min-w-0">
      <div
        className="h-16 rounded-md border border-subtle"
        style={{ backgroundColor: `var(${token.variable})` }}
      />
      <p className="mt-2 truncate font-mono text-xs font-semibold text-primary">
        {token.name}
      </p>
      <p className="truncate font-mono text-eoc-tiny text-muted">{token.variable}</p>
      <p className="mt-0.5 truncate text-[11px] text-muted" title={resolved}>
        {resolved || "…"}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-secondary">{token.usage}</p>
    </div>
  );
}

function TokenGrid({ tokens }: { tokens: ColorToken[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {tokens.map((token) => (
        <ColorSwatch key={token.variable} token={token} />
      ))}
    </div>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
      {children}
    </h3>
  );
}

/** Well that stages component examples on a slightly raised surface. */
function DemoWell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-subtle bg-tertiary p-4">
      {children}
    </div>
  );
}

/**
 * Accordion demo (Phase 2 · Step 4) — parents with `subRoutes` render a
 * chevron, toggle their nested menu on click, highlight when a child
 * route is active, and force the sidebar to expand when opened from the
 * collapsed 64px rail.
 */
function SidebarAccordionDemo() {
  return (
    <>
      <div className="relative h-[440px] overflow-hidden rounded-lg border border-subtle bg-tertiary">
        <Sidebar variant="inline">
          <SidebarSection label="System">
            <SidebarNavItem
              icon={Settings}
              label="Settings"
              href="/settings/profile"
              subRoutes={[
                { label: "Profile", href: "/settings/profile" },
                { label: "Notifications", href: "/settings/notifications" },
                { label: "Map", href: "/settings/map" },
                { label: "AI", href: "/settings/ai" },
              ]}
            />
            <SidebarNavItem
              icon={ShieldCheck}
              label="Admin"
              href="/admin-dashboard"
              badgeCount={3}
              subRoutes={[
                { label: "Users", href: "/users", badgeCount: 3 },
                { label: "Districts", href: "/districts" },
                { label: "Audit Logs", href: "/audit-logs" },
              ]}
            />
          </SidebarSection>
        </Sidebar>
      </div>
      <p className="mt-2 text-xs text-muted">
        Parents with <code className="font-mono">subRoutes</code> render a ChevronDown
        (rotates when open) and toggle their sub-menu on click —&nbsp;&quot;Settings&quot;
        and &quot;Admin&quot; show the pattern. Click a parent while the sidebar is
        collapsed to the 64px rail and it automatically expands so the children fit.
        Active state derives from the parent href or any child.
      </p>
    </>
  );
}

/**
 * Interactive sidebar demo — lets you switch the mock role so the
 * config-driven nav visibly grows/shrinks per the allowedRoles matrix
 * (field_responder ⊂ district_admin ⊂ super_admin).
 */
function SidebarRoleDemo() {
  const [role, setRole] = useState<Role>("district_admin");

  return (
    <>
      <div
        role="group"
        aria-label="Mock role"
        className="mb-3 flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          Mock role:
        </span>
        {ROLES.filter((r) => r !== "viewer").map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRole(option)}
            aria-pressed={role === option}
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
              role === option
                ? "border-accent-primary bg-accent-primary/15 text-accent-primary"
                : "border-subtle text-muted hover:bg-white/5 hover:text-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="relative h-[440px] overflow-hidden rounded-lg border border-subtle bg-tertiary">
        <DashboardSidebar variant="inline" alertsBadgeCount={12} userRole={role} />
      </div>
      <p className="mt-2 text-xs text-muted">
        The composed DashboardSidebar maps over{" "}
        <code className="font-mono">lib/config/navigation.ts</code> and renders only the
        routes the selected role may see —&nbsp;&quot;Settings&quot; is super_admin-only,
        &quot;Shelters / Resources / Satellite&quot; appear for district_admin and up, and
        a field responder keeps the read-only operational set. Inline is used here for
        preview; the fixed variant pins to the viewport. Click the chevron — width
        animates 260px ⇄ 64px, section labels hide, and icons reveal hover tooltips. The
        Active Alerts pill shows the live unacknowledged count.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function StyleguidePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Design System — Styleguide
          </h1>
          <p className="mt-1 text-sm text-muted">
            Internal reference (hidden from nav) ·{" "}
            <code className="font-mono">/styleguide</code> · swatches resolve live. Dark
            mode is locked for demo day (ThemeProvider{" "}
            <code className="font-mono">{'forcedTheme="dark"'}</code>) — the day-ops
            palette is unreachable until re-enabled.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------ Colors ---- */}
      <Panel title="Colors" as="h2">
        <div className="space-y-8">
          <div>
            <SubHeading>Backgrounds</SubHeading>
            <TokenGrid tokens={BG_TOKENS} />
          </div>
          <div>
            <SubHeading>Accents</SubHeading>
            <TokenGrid tokens={ACCENT_TOKENS} />
          </div>
          <div>
            <SubHeading>Severity tints</SubHeading>
            <TokenGrid tokens={SEVERITY_TOKENS} />
          </div>
          <div>
            <SubHeading>Legacy EOC severity scales (kept)</SubHeading>
            <TokenGrid tokens={LEGACY_SEVERITY_TOKENS} />
          </div>
        </div>
      </Panel>

      {/* -------------------------------------------- Typography ---- */}
      <Panel title="Typography" as="h2">
        <div className="space-y-6">
          {/* Demos render as <p> (not semantic headings) so the examples
              don't pollute the page's own heading outline. */}
          <div>
            <p className="eoc-label">H1 — text-4xl font-bold tracking-tight</p>
            <p className="text-4xl font-bold tracking-tight text-primary">
              Flood Risk Assessment
            </p>
          </div>
          <div>
            <p className="eoc-label">H2 — text-2xl font-bold</p>
            <p className="text-2xl font-bold text-primary">Command Center</p>
          </div>
          <div>
            <p className="eoc-label">H3 — text-lg font-semibold</p>
            <p className="text-lg font-semibold text-primary">Active Alerts</p>
          </div>
          <div>
            <p className="eoc-label">Body — text-base text-secondary</p>
            <p className="text-base text-secondary">
              River levels are receding along the Ganges. Shelters remain open in
              Sampatchak and Kankarbagh for displaced residents.
            </p>
          </div>
          <div>
            <p className="eoc-label">Body small — text-sm text-muted</p>
            <p className="text-sm text-muted">
              Secondary and muted text for captions, hints and metadata.
            </p>
          </div>
          <div>
            <p className="eoc-label">Data readout — font-mono text-xs</p>
            <p className="font-mono text-xs text-secondary">
              LAT 25.5941 · LON 85.1376 · UPD 09:42:17 IST
            </p>
          </div>
        </div>
      </Panel>

      {/* ------------------------------------------- Components ---- */}
      <Panel title="Components" as="h2">
        <div className="space-y-8">
          {/* SeverityBadge */}
          <div>
            <SubHeading>SeverityBadge</SubHeading>
            <DemoWell>
              <SeverityBadge variant="safe" />
              <SeverityBadge variant="watch" />
              <SeverityBadge variant="warning" />
              <SeverityBadge variant="critical" />
              <SeverityBadge variant="info" />
            </DemoWell>
            <DemoWell>
              <SeverityBadge variant="safe" size="sm" />
              <SeverityBadge variant="warning" size="sm" label="High" />
              <SeverityBadge variant="critical" size="sm" label="Evacuate" />
            </DemoWell>
          </div>
          {/* StatusDot */}
          <div>
            <SubHeading>StatusDot</SubHeading>
            <DemoWell>
              <span className="flex items-center gap-2 text-sm text-secondary">
                <StatusDot status="online" name="Sunita Das" /> Online
              </span>
              <span className="flex items-center gap-2 text-sm text-secondary">
                <StatusDot status="busy" name="A. Kumar" /> Busy
              </span>
              <span className="flex items-center gap-2 text-sm text-secondary">
                <StatusDot status="offline" name="R. Sharma" /> Offline
              </span>
            </DemoWell>
          </div>
          {/* StatCard */}
          <div>
            <SubHeading>StatCard</SubHeading>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="People at Risk"
                value={47230}
                trend="+12%"
                trendDirection="up"
                trendClassName="text-accent-danger"
                icon={Users}
              />
              <StatCard label="Evacuated" value={12847} trend="+8%" icon={Tent} />
              <StatCard
                label="Boats Deployed"
                value={142}
                trend="Flat"
                trendDirection="flat"
                icon={Ship}
              />
            </div>
          </div>
          {/* DataRow */}
          <div>
            <SubHeading>DataRow</SubHeading>
            <div className="space-y-1">
              <DataRow
                icon={Building2}
                title="Patna High School"
                subtitle="Sampatchak · 92% full"
                trailingElement={<SeverityBadge variant="warning" size="sm" />}
              />
              <DataRow
                icon={User}
                title="Sunita Das"
                subtitle="Team Alpha · last ping 2m ago"
                trailingElement={<StatusDot status="online" name="Sunita Das" />}
              />
              <DataRow
                icon={MapPin}
                title="Bypass Road"
                subtitle="NH-31 · closed — under water"
                trailingElement={<SeverityBadge variant="critical" size="sm" />}
              />
            </div>
          </div>
          {/* IconButton */}
          <div>
            <SubHeading>IconButton — variants</SubHeading>
            <DemoWell>
              <IconButton label="Ghost" variant="ghost" size="md">
                <Bell className="h-4 w-4" />
              </IconButton>
              <IconButton label="Filled" variant="filled" size="md">
                <Plus className="h-4 w-4" />
              </IconButton>
              <IconButton label="Danger" variant="danger" size="md">
                <Trash2 className="h-4 w-4" />
              </IconButton>
              <IconButton label="Floating" variant="floating" size="md">
                <X className="h-4 w-4" />
              </IconButton>
              <IconButton label="Success" variant="filled" size="md">
                <Check className="h-4 w-4" />
              </IconButton>
            </DemoWell>
          </div>
          <div>
            <SubHeading>IconButton — sizes</SubHeading>
            <DemoWell>
              <IconButton label="Small" size="sm">
                <Bell className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton label="Medium" size="md">
                <Bell className="h-4 w-4" />
              </IconButton>
              <IconButton label="Large" size="lg">
                <Bell className="h-5 w-5" />
              </IconButton>
            </DemoWell>
          </div>
          {/* SkeletonLoader */}
          <div>
            <SubHeading>SkeletonLoader (Step 6)</SubHeading>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-subtle bg-secondary p-4">
                <SkeletonLoader height={14} width="45%" />
                <SkeletonLoader height={30} width="55%" className="mt-2" />
                <SkeletonLoader height={12} width="20%" className="mt-2" />
              </div>
              <SkeletonCard icon trend={false} />
              <SkeletonRow trailing={false} />
            </div>
          </div>{" "}
          {/* Icon wrapper (Demo-day hardening · Step 7) */}
          <div>
            <SubHeading>Icon — standardized wrapper (Step 7)</SubHeading>
            <DemoWell>
              <span className="flex flex-col items-center gap-1 text-[11px] text-muted">
                <Icon name="Bell" size="nav" />
                nav · 20px
              </span>
              <span className="flex flex-col items-center gap-1 text-[11px] text-muted">
                <Icon name="Bell" size="action" />
                action · 24px
              </span>
              <span className="flex flex-col items-center gap-1 text-[11px] text-muted">
                <Icon name="Bell" size="inline" />
                inline · 16px
              </span>
              <span className="flex flex-col items-center gap-1 text-[11px] text-muted">
                <Icon name="Siren" className="text-accent-danger" />
                Siren · default
              </span>
              <span className="flex flex-col items-center gap-1 text-[11px] text-muted">
                <Icon name="MapPin" className="text-accent-primary" />
                MapPin
              </span>
            </DemoWell>
            <p className="mt-2 text-xs text-muted">
              <code className="font-mono">Icon</code> renders any registry name at{" "}
              <code className="font-mono">strokeWidth 1.5</code> (lucide&apos;s default is
              2) — every icon in the app shares one stroke weight and the{" "}
              <code className="font-mono">nav / action / inline</code> size scale. The
              name is type-checked against the registry in{" "}
              <code className="font-mono">components/ui/Icon.tsx</code>.
            </p>
          </div>
          {/* Sidebar shell + nav (Phase 2 · Steps 1–3) */}
          <div>
            <SubHeading>
              Sidebar — composed nav + role filtering (Phase 2 · Step 3)
            </SubHeading>
            <SidebarRoleDemo />
          </div>
          {/* Sidebar accordion sub-menus (Phase 2 · Step 4) */}
          <div>
            <SubHeading>Sidebar — accordion sub-menus (Phase 2 · Step 4)</SubHeading>
            <SidebarAccordionDemo />
          </div>
        </div>
      </Panel>

      <p className="pb-4 text-center text-xs text-muted">
        DRIP Design System · UI/UX Phase 1 · dark-first — locked for demo day (Step 6)
      </p>
    </div>
  );
}
