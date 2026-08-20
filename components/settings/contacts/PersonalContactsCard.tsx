"use client";

// ---------------------------------------------------------------------
// components/settings/contacts/PersonalContactsCard.tsx — Contacts (Phase 7 · Step 2).
//
// Personal Emergency Contacts manager:
//   • Mock list of 2 contacts (name, relationship, phone, email) with a
//     "Primary" badge on the first one (index 0 stays primary).
//   • "Add Contact (Max 5)" opens a small inline form with validation;
//     the cap is enforced in the UI and on submit.
//   • "Sync from Device" ghost button carries a hover tooltip explaining
//     that importing device contacts requires mobile permissions.
// ---------------------------------------------------------------------

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  ContactRound,
  Plus,
  Smartphone,
  Star,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { initialsFor } from "@/lib/settings/avatar";

const MAX_CONTACTS = 5;

type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
};

const INITIAL_CONTACTS: EmergencyContact[] = [
  {
    id: "c1",
    name: "Rohan Verma",
    relationship: "Brother",
    phone: "+91 98110 22334",
    email: "rohan.v@example.com",
  },
  {
    id: "c2",
    name: "Meera Krishnan",
    relationship: "Colleague · NDRF",
    phone: "+91 90041 55667",
    email: "meera.k@example.com",
  },
];

const EMPTY_DRAFT = { name: "", relationship: "", phone: "", email: "" };

type DraftField = keyof typeof EMPTY_DRAFT;

const PHONE_RE = /^[+\d][\d\s()-]{6,}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function PersonalContactsCard() {
  const [contacts, setContacts] =
    useState<EmergencyContact[]>(INITIAL_CONTACTS);
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });
  const [errors, setErrors] = useState<Partial<Record<DraftField, string>>>({});

  const atMax = contacts.length >= MAX_CONTACTS;

  function setField(field: DraftField, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this field as the user types.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();

    if (atMax) {
      toast("Maximum of 5 contacts reached.", { duration: 2500 });
      return;
    }

    const next: Partial<Record<DraftField, string>> = {};
    if (!draft.name.trim()) next.name = "Name is required";
    if (!draft.relationship.trim()) next.relationship = "Relationship is required";
    if (!PHONE_RE.test(draft.phone.trim())) {
      next.phone = "Enter a valid phone number";
    }
    if (draft.email.trim() && !EMAIL_RE.test(draft.email.trim())) {
      next.email = "Enter a valid email";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const contact: EmergencyContact = {
      id: `c${Date.now()}`,
      name: draft.name.trim(),
      relationship: draft.relationship.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim(),
    };
    setContacts((prev) => [...prev, contact]);
    setDraft({ ...EMPTY_DRAFT });
    setFormOpen(false);
    toast.success("Contact added to your emergency list.");
  }

  function removeContact(id: string) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast("Contact removed from your emergency list.", { duration: 2500 });
  }

  return (
    <section
      data-settings-key="contacts-personal"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
          <UsersRound className="h-5 w-5 text-cyan-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-cyan-400/80">CONTACTS · PHASE 7 · STEP 2</p>
          <h2 className="mt-0.5 text-lg font-bold">Personal Emergency Contacts</h2>
        </div>
        <span className="ml-auto rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-[10px] font-bold tabular-nums text-cyan-200">
          {contacts.length}/{MAX_CONTACTS}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Who the control room reaches first if you can&apos;t be contacted
        during an incident. The first contact is marked primary.
      </p>

      {/* Contact list */}
      <ul className="mt-5 space-y-3">
        {contacts.map((contact, index) => {
          const primary = index === 0;
          return (
            <li
              key={contact.id}
              className={`flex items-start gap-3 rounded-md border p-3.5 transition ${
                primary
                  ? "border-amber-400/40 bg-amber-500/[0.06]"
                  : "border-panel-border bg-surface-muted/40"
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c2740] text-[11px] font-bold text-cyan-300">
                {initialsFor(contact.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-100">
                  {contact.name}
                  {primary && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                      <Star className="h-2.5 w-2.5" aria-hidden />
                      Primary
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {contact.relationship}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs">
                <p className="font-mono tabular-nums text-slate-300">
                  {contact.phone}
                </p>
                <p className="mt-0.5 text-slate-500">
                  {contact.email || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeContact(contact.id)}
                aria-label={`Remove ${contact.name}`}
                className="shrink-0 rounded-md p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          );
        })}
        {contacts.length === 0 && (
          <li className="rounded-md border border-dashed border-panel-borderHover bg-surface-muted/30 px-4 py-6 text-center text-xs text-slate-500">
            No contacts yet — add one below or sync from your device.
          </li>
        )}
      </ul>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={atMax}
          onClick={() => setFormOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(8,145,178,0.3)] transition hover:bg-cyan-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {formOpen ? (
            <>
              <X className="h-4 w-4" aria-hidden />
              Close form
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" aria-hidden />
              Add Contact (Max 5)
            </>
          )}
        </button>

        {/* Sync from Device — ghost button + permission tooltip */}
        <span className="group relative inline-flex">
          <button
            type="button"
            onClick={() =>
              toast(
                "Contacts sync requires mobile permission — not available on desktop.",
                { duration: 3000 },
              )
            }
            className="inline-flex items-center gap-2 rounded-md border border-panel-borderHover bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-200 active:scale-[0.98]"
          >
            <Smartphone className="h-4 w-4" aria-hidden />
            Sync from Device
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-60 -translate-x-1/2 rounded-md border border-cyan-400/40 bg-panel-deep p-2 text-[10px] font-medium leading-snug text-cyan-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            Requires mobile contacts permission — grant access in your device
            settings to import emergency contacts.
          </span>
        </span>
      </div>

      {atMax && (
        <p className="mt-3 text-[11px] text-slate-500">
          Maximum of 5 contacts reached. Remove one to add another.
        </p>
      )}

      {/* Inline add form */}
      {formOpen && (
        <form
          onSubmit={handleAdd}
          className="mt-5 grid gap-3 rounded-md border border-panel-border bg-[#0a0f1d] p-4 sm:grid-cols-2"
        >
          <Field
            label="Full name"
            value={draft.name}
            error={errors.name}
            onChange={(v) => setField("name", v)}
            placeholder="e.g. Priya Nair"
          />
          <Field
            label="Relationship"
            value={draft.relationship}
            error={errors.relationship}
            onChange={(v) => setField("relationship", v)}
            placeholder="e.g. Sister, NDRF colleague"
          />
          <Field
            label="Phone"
            value={draft.phone}
            error={errors.phone}
            onChange={(v) => setField("phone", v)}
            placeholder="+91 …"
          />
          <Field
            label="Email (optional)"
            value={draft.email}
            error={errors.email}
            onChange={(v) => setField("email", v)}
            placeholder="name@example.com"
          />

          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-500"
            >
              <ContactRound className="h-4 w-4" aria-hidden />
              Save contact
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setDraft({ ...EMPTY_DRAFT });
                setErrors({});
              }}
              className="rounded-md border border-panel-borderHover px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-surface-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  error,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const id = `contact-${label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold text-slate-300">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={`mt-1 w-full rounded-md border bg-[#0a0f1d] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 transition focus:border-cyan-400/60 ${
          error ? "border-red-500/60" : "border-panel-border"
        }`}
      />
      {error && <p className="mt-1 text-[10px] font-semibold text-red-400">{error}</p>}
    </div>
  );
}
