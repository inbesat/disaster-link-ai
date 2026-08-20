"use client";

import { useEffect, useState } from "react";
import {
  Stethoscope,
  Plus,
  MapPin,
  Clock,
  AlertTriangle,
  Activity,
  Filter,
  Search,
} from "lucide-react";

// ---------------------------------------------------------------------
// app/(dashboard)/casualties/page.tsx — Casualty / Medical Tracking
// Medical responders log injuries, track severity, and update status.
// ---------------------------------------------------------------------

interface CasualtyRecord {
  id: string;
  name: string | null;
  age: number | null;
  gender: string | null;
  injuryType: string;
  severity: string;
  description: string | null;
  locationName: string | null;
  district: string | null;
  status: string;
  createdAt: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  moderate: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  severe: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  critical: "bg-red-500/15 text-red-400 border-red-500/20",
};

const INJURY_ICONS: Record<string, React.ReactNode> = {
  injury: <Activity size={14} />,
  illness: <Stethoscope size={14} />,
  fatality: <AlertTriangle size={14} />,
  missing: <AlertTriangle size={14} />,
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  treated: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  discharged: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  deceased: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

export default function CasualtiesPage() {
  const [records, setRecords] = useState<CasualtyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    injuryType: "injury",
    severity: "minor",
    description: "",
    locationName: "",
    district: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch("/api/casualties");
      const data = (await res.json()) as { ok?: boolean; records: CasualtyRecord[] };
      if (data.ok) setRecords(data.records);
    } catch {
      // Use empty list
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/casualties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || null,
          age: formData.age ? Number(formData.age) : null,
          gender: formData.gender || null,
          injuryType: formData.injuryType,
          severity: formData.severity,
          description: formData.description || null,
          locationName: formData.locationName || null,
          district: formData.district || null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; record: CasualtyRecord };
      if (data.ok) {
        setRecords((prev) => [data.record, ...prev]);
        setShowForm(false);
        setFormData({ name: "", age: "", gender: "", injuryType: "injury", severity: "minor", description: "", locationName: "", district: "" });
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch("/api/casualties", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok) {
        setRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch {
      // silently fail
    }
  }

  const filtered = records.filter((r) => {
    if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.locationName && r.locationName.toLowerCase().includes(q)) ||
        r.injuryType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = {
    total: records.length,
    critical: records.filter((r) => r.severity === "critical").length,
    severe: records.filter((r) => r.severity === "severe").length,
    active: records.filter((r) => r.status === "active").length,
    treated: records.filter((r) => r.status === "treated" || r.status === "discharged").length,
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="text-accent" size={24} />
            Casualty & Medical Tracking
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Log injuries, track severity, and manage patient status
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-accent/80 transition"
        >
          <Plus size={16} />
          Log Casualty
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-slate-300" },
          { label: "Critical", value: stats.critical, color: "text-red-400" },
          { label: "Severe", value: stats.severe, color: "text-orange-400" },
          { label: "Active", value: stats.active, color: "text-amber-400" },
          { label: "Treated", value: stats.treated, color: "text-emerald-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-4 text-center"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Report Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-surface p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-foreground">
            Log Casualty Record
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Patient Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                placeholder="Name if known"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                min={0}
                max={120}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Injury Type *</label>
              <select
                value={formData.injuryType}
                onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                required
              >
                <option value="injury">Injury</option>
                <option value="illness">Illness</option>
                <option value="fatality">Fatality</option>
                <option value="missing">Missing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Severity *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                required
              >
                <option value="minor">Minor</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Location</label>
              <input
                type="text"
                value={formData.locationName}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                placeholder="e.g. Bailey Road, Patna"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                placeholder="e.g. Patna"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none resize-none"
              rows={2}
              placeholder="Injury details, symptoms, treatment given..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-accent/80 transition disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Record"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-full border border-border px-6 py-2 text-sm text-slate-400 hover:bg-surface-muted transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location, or type..."
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-slate-500 focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          {["all", "critical", "severe", "moderate", "minor"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                filterSeverity === s
                  ? "bg-accent/15 text-accent border border-accent/20"
                  : "text-slate-400 border border-border hover:bg-surface-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Stethoscope size={32} className="mx-auto mb-3 opacity-50" />
          <p>No casualty records found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((record) => (
            <div
              key={record.id}
              className={`rounded-2xl border bg-surface p-5 space-y-3 transition hover:shadow-lg ${
                record.severity === "critical"
                  ? "border-red-500/30"
                  : record.severity === "severe"
                  ? "border-orange-500/30"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {record.name || "Unnamed Patient"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {[record.age, record.gender].filter(Boolean).join(" · ") || "Unknown"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[record.severity] || SEVERITY_COLORS.minor}`}
                  >
                    {record.severity}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                {INJURY_ICONS[record.injuryType]}
                <span className="capitalize">{record.injuryType}</span>
                <span className="text-slate-600">·</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[record.status] || STATUS_STYLES.active}`}
                >
                  {record.status}
                </span>
              </div>

              {record.description && (
                <p className="text-sm text-slate-300 line-clamp-2">{record.description}</p>
              )}

              <div className="space-y-1 text-xs text-slate-400">
                {record.locationName && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} /> {record.locationName}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock size={12} /> {new Date(record.createdAt).toLocaleDateString()}
                </div>
              </div>

              {record.status === "active" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      void updateStatus(record.id, "treated");
                    }}
                    className="flex-1 rounded-lg bg-blue-500/15 border border-blue-500/20 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-500/25 transition"
                  >
                    Mark Treated
                  </button>
                  <button
                    onClick={() => {
                      void updateStatus(record.id, "discharged");
                    }}
                    className="flex-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25 transition"
                  >
                    Discharge
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
