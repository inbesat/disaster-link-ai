"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  UserX,
  AlertCircle,
  Filter,
} from "lucide-react";

// ---------------------------------------------------------------------
// app/(dashboard)/missing-persons/page.tsx — Missing Persons Registry
// Citizens and responders report/find missing persons. Supports search,
// filter by status, and mark-as-found workflow.
// ---------------------------------------------------------------------

interface MissingPerson {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  description: string | null;
  lastKnownArea: string | null;
  lastSeenAt: string | null;
  contactName: string;
  contactPhone: string;
  contactRelation: string | null;
  status: string;
  district: string | null;
  lat: number | null;
  lng: number | null;
  notes: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  missing: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  found: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  safe: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  missing: <UserX size={14} />,
  found: <CheckCircle2 size={14} />,
  safe: <CheckCircle2 size={14} />,
};

export default function MissingPersonsPage() {
  const [persons, setPersons] = useState<MissingPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    description: "",
    lastKnownArea: "",
    contactName: "",
    contactPhone: "",
    contactRelation: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPersons();
  }, []);

  async function fetchPersons() {
    try {
      const res = await fetch("/api/missing-persons");
      const data = await res.json();
      if (data.ok) setPersons(data.persons);
    } catch {
      // Use empty list on failure
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.contactName || !formData.contactPhone) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/missing-persons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          age: formData.age ? Number(formData.age) : null,
          gender: formData.gender || null,
          description: formData.description || null,
          lastKnownArea: formData.lastKnownArea || null,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
          contactRelation: formData.contactRelation || null,
          notes: formData.notes || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPersons((prev) => [data.person, ...prev]);
        setShowForm(false);
        setFormData({ name: "", age: "", gender: "", description: "", lastKnownArea: "", contactName: "", contactPhone: "", contactRelation: "", notes: "" });
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function markFound(id: string) {
    try {
      const res = await fetch("/api/missing-persons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "found" }),
      });
      const data = await res.json();
      if (data.ok) {
        setPersons((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "found" } : p))
        );
      }
    } catch {
      // silently fail
    }
  }

  const filtered = persons.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.contactName.toLowerCase().includes(q) ||
        (p.lastKnownArea && p.lastKnownArea.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const stats = {
    total: persons.length,
    missing: persons.filter((p) => p.status === "missing").length,
    found: persons.filter((p) => p.status === "found").length,
    safe: persons.filter((p) => p.status === "safe").length,
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserX className="text-accent" size={24} />
            Missing Persons Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Report missing persons and mark them as found when located
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-accent/80 transition"
        >
          <Plus size={16} />
          Report Missing Person
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-slate-300" },
          { label: "Missing", value: stats.missing, color: "text-amber-400" },
          { label: "Found", value: stats.found, color: "text-emerald-400" },
          { label: "Safe", value: stats.safe, color: "text-blue-400" },
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
            Report Missing Person
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                required
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
              <label className="block text-xs text-slate-400 mb-1">Last Known Area</label>
              <input
                type="text"
                value={formData.lastKnownArea}
                onChange={(e) => setFormData({ ...formData, lastKnownArea: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                placeholder="e.g. Kankarbagh, Patna"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contact Name *</label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contact Phone *</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Relation</label>
              <select
                value={formData.contactRelation}
                onChange={(e) => setFormData({ ...formData, contactRelation: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
              >
                <option value="">Select</option>
                <option value="parent">Parent</option>
                <option value="spouse">Spouse</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
                placeholder="Appearance, clothing, etc."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none resize-none"
              rows={2}
              placeholder="Any other details..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-slate-950 hover:bg-accent/80 transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Report"}
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
            placeholder="Search by name, contact, or area..."
            className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-slate-500 focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          {["all", "missing", "found", "safe"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${
                filterStatus === s
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
          <AlertCircle size={32} className="mx-auto mb-3 opacity-50" />
          <p>No missing persons found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((person) => (
            <div
              key={person.id}
              className={`rounded-2xl border bg-surface p-5 space-y-3 transition hover:shadow-lg ${
                person.status === "missing"
                  ? "border-amber-500/20"
                  : person.status === "found"
                  ? "border-emerald-500/20"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {person.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {[person.age, person.gender].filter(Boolean).join(" · ") || "Age/gender unknown"}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[person.status] || STATUS_COLORS.missing}`}
                >
                  {STATUS_ICONS[person.status]}
                  {person.status}
                </span>
              </div>

              {person.description && (
                <p className="text-sm text-slate-300 line-clamp-2">{person.description}</p>
              )}

              <div className="space-y-1.5 text-xs text-slate-400">
                {person.lastKnownArea && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} /> {person.lastKnownArea}
                  </div>
                )}
                {person.lastSeenAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} /> Last seen {new Date(person.lastSeenAt).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Phone size={12} /> {person.contactName} ({person.contactRelation || "contact"})
                  <span className="text-accent">{person.contactPhone}</span>
                </div>
              </div>

              {person.status === "missing" && (
                <button
                  onClick={() => markFound(person.id)}
                  className="w-full rounded-lg bg-emerald-500/15 border border-emerald-500/20 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Mark as Found
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
