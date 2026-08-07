"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  addResource,
  updateResource,
  deleteResource,
  type InventoryResource,
} from "@/app/actions/resources";

const CATEGORIES = [
  "boat",
  "food",
  "medical",
  "water",
  "personnel",
  "vehicle",
  "communication",
  "power",
  "other",
];
const STATUSES = ["available", "deployed", "maintenance"];

type ResourceFormModalProps = {
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
  resource?: InventoryResource | null;
};

export default function ResourceFormModal({
  onClose,
  onSaved,
  onDeleted,
  resource,
}: ResourceFormModalProps) {
  const editing = Boolean(resource);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: resource?.name ?? "",
    category: resource?.category ?? "boat",
    quantity: resource?.quantity ?? 0,
    unit: resource?.unit ?? "",
    status: resource?.status ?? "available",
    depotName: resource?.depotName ?? "",
    lat: resource?.lat ?? 25.61,
    lng: resource?.lng ?? 85.14,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Resource name is required.");
      return;
    }
    setSaving(true);
    try {
      const ok = editing
        ? await updateResource({ ...form, id: resource!.id })
        : (await addResource(form)).ok;
      if (ok) {
        toast.success(editing ? "Resource updated." : "Resource added.");
        onSaved();
        onClose();
      } else {
        toast.error("Could not save the resource. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!resource || !window.confirm(`Delete "${resource.name}"?`)) return;
    setSaving(true);
    try {
      const ok = await deleteResource(resource.id);
      if (ok) {
        toast.success("Resource deleted.");
        onDeleted?.();
        onClose();
      } else {
        toast.error("Could not delete the resource.");
      }
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-eoc border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="eoc-label text-accent">
              {editing ? "EDIT RESOURCE" : "NEW RESOURCE"}
            </p>
            <h2 className="mt-1 text-lg font-bold">
              {editing ? "Update Inventory" : "Register Inventory"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-2 py-1 text-xs text-slate-400 hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="eoc-label mb-1 block">Resource name *</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. NDRF Rescue Boats"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eoc-label mb-1 block">Category</label>
              <select
                className={inputCls}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="eoc-label mb-1 block">Status</label>
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eoc-label mb-1 block">Quantity</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.quantity}
                onChange={(e) => set("quantity", Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div>
              <label className="eoc-label mb-1 block">Unit</label>
              <input
                className={inputCls}
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                placeholder="boats, kits, pallets…"
              />
            </div>
          </div>

          <div>
            <label className="eoc-label mb-1 block">Depot / location name</label>
            <input
              className={inputCls}
              value={form.depotName}
              onChange={(e) => set("depotName", e.target.value)}
              placeholder="e.g. Patna NDRF Depot"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eoc-label mb-1 block">Latitude</label>
              <input
                type="number"
                step="0.0001"
                className={inputCls}
                value={form.lat}
                onChange={(e) => set("lat", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="eoc-label mb-1 block">Longitude</label>
              <input
                type="number"
                step="0.0001"
                className={inputCls}
                value={form.lng}
                onChange={(e) => set("lng", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          {editing && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleDelete()}
              className="rounded-md border border-severity-red-600/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-severity-red-400 transition hover:bg-severity-red-600/10 disabled:opacity-50"
            >
              Delete
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSubmit()}
              className="rounded-md bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-glow transition hover:bg-sky-300 disabled:opacity-50"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Resource"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
