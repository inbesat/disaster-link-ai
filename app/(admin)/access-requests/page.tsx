"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  Check,
  FileText,
  Inbox,
  Search,
  ShieldX,
  X,
} from "lucide-react";
import {
  decideAccessRequest,
  listAccessRequests,
  type AccessRequestRecord,
  type AccessRequestStatus,
} from "@/app/actions/admin";

// ---------------------------------------------------------------------
// app/(admin)/access-requests/page.tsx — Gov access approval portal.
//
// Every "Request access" submission from /gov/signup lands here (and in
// the safesphere095@gmail.com inbox with the ID attached). Approving a
// request flips its row to status=approved, which is the exact condition
// govLogin() checks before issuing a role cookie — so approval here IS
// what lets an official through the gov portal gate.
// ---------------------------------------------------------------------

const STATUS_TABS: Array<{ key: "all" | AccessRequestStatus; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const STATUS_BADGE: Record<AccessRequestStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  approved: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  rejected: "border-red-500/30 bg-red-500/15 text-red-400",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<AccessRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | AccessRequestStatus>("pending");
  const [query, setQuery] = useState("");
  const [roleChoice, setRoleChoice] = useState<Record<string, "field_responder" | "district_admin">>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void listAccessRequests()
      .then(setRequests)
      .catch(() => toast.error("Could not load access requests."))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      all: requests.length,
    } as Record<"all" | AccessRequestStatus, number>;
  }, [requests]);

  const normalized = query.trim().toLowerCase();
  const filtered = requests.filter((r) => {
    const matchesTab = tab === "all" || r.status === tab;
    const matchesQuery =
      !normalized ||
      r.name.toLowerCase().includes(normalized) ||
      r.email.toLowerCase().includes(normalized) ||
      r.organization.toLowerCase().includes(normalized);
    return matchesTab && matchesQuery;
  });

  async function handleDecide(
    id: string,
    decision: Exclude<AccessRequestStatus, "pending">,
  ) {
    setBusyId(id);
    try {
      // Role choice only applies to approvals.
      const chosenRole =
        decision === "approved"
          ? roleChoice[id] ?? requests.find((r) => r.id === id)?.requestedRole
          : undefined;
      const next = await decideAccessRequest(id, decision, chosenRole);
      setRequests(next);
      toast.success(
        decision === "approved"
          ? `Access approved${chosenRole ? ` as ${chosenRole.replace("_", " ")}` : ""} — they can now sign in`
          : "Request rejected — email cannot sign in",
      );
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Access Requests
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Approve or reject gov portal sign-ins. Approved emails can log in immediately.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or org…"
            className="w-full rounded-md border border-border bg-surface-elevated py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-500 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/30"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 ${
              tab === key
                ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                : "border-border bg-surface-elevated text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-px font-mono text-[10px] ${
                tab === key ? "bg-amber-400/25 text-amber-100" : "bg-panel-chip text-slate-400"
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Requests */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-lg border border-panel-border bg-panel px-4 py-12 text-center text-sm text-slate-500">
            Loading requests…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-panel-border bg-panel px-4 py-14 text-center">
            <Inbox aria-hidden className="mb-3 h-10 w-10 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No {tab === "all" ? "" : tab} requests</p>
            <p className="mt-1 max-w-sm text-xs text-slate-600">
              New submissions from the gov login &ldquo;Request access&rdquo; form appear here and are
              emailed to safesphere095@gmail.com automatically.
            </p>
          </div>
        ) : (
          filtered.map((req) => (
            <article
              key={req.id}
              className="rounded-lg border border-panel-border bg-panel p-4 transition hover:border-panel-borderHover"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                {/* Identity */}
                <div className="flex min-w-[220px] flex-1 items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel-chip text-xs font-bold text-amber-300">
                    {req.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{req.name}</p>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_BADGE[req.status]}`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-500">{req.email}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {req.organization} · wants{" "}
                      <span className="font-semibold text-slate-300">
                        {req.requestedRole.replace("_", " ")}
                      </span>{" "}
                      · {timeAgo(req.createdAt)}
                    </p>
                    {req.message && (
                      <p className="mt-1.5 max-w-md rounded-md bg-surface-muted px-2.5 py-1.5 text-xs italic text-slate-300">
                        “{req.message}”
                      </p>
                    )}
                    {req.idFileName && (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-sky-300">
                        <FileText aria-hidden className="h-3 w-3" />
                        ID attached: <span className="font-mono">{req.idFileName}</span>
                        <span className="text-slate-600">(in email)</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {req.status === "pending" ? (
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <label className="text-left sm:text-right">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Grant as
                      </span>
                      <select
                        value={roleChoice[req.id] ?? req.requestedRole}
                        onChange={(e) =>
                          setRoleChoice((prev) => ({
                            ...prev,
                            [req.id]: e.target.value as "field_responder" | "district_admin",
                          }))
                        }
                        className="h-9 rounded-md border border-border bg-surface-elevated px-2 text-xs text-foreground outline-none transition focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/30 [&>option]:bg-[#111827]"
                      >
                        <option value="field_responder">Field Responder</option>
                        <option value="district_admin">District Admin</option>
                      </select>
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => void handleDecide(req.id, "approved")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
                      >
                        <Check aria-hidden className="h-3.5 w-3.5" />
                        {busyId === req.id ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === req.id}
                        onClick={() => void handleDecide(req.id, "rejected")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                      >
                        <X aria-hidden className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0 self-center">
                    {req.status === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                        <BadgeCheck aria-hidden className="h-4 w-4" /> Can sign in
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
                        <ShieldX aria-hidden className="h-4 w-4" /> Blocked at login
                      </span>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        Decisions are audit-logged. Whitelisted emails in{" "}
        <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
          GOV_ACCESS_WHITELIST
        </code>{" "}
        bypass this queue by design.
      </p>
    </div>
  );
}
