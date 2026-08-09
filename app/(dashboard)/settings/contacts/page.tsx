"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/contacts/page.tsx — UI/UX Phase 7 · Step 9.
//
// Emergency contacts:
//   • priority contact cards with initials avatar, name/phone/email
//   • drag-to-reorder via a gripper handle (HTML5 DnD)
//   • per-contact "Test Message" button
//   • floating action button to add a new contact (inline composer)
// ---------------------------------------------------------------------

import { useState } from "react";
import { GripVertical, MessageSquareMore, Phone, Plus, X } from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import { initialsFor } from "@/lib/settings/avatar";
import { showToast } from "@/components/ui/Toast";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
};

const INITIAL_CONTACTS: Contact[] = [
  {
    id: "c1",
    name: "Mohd. Rahim",
    phone: "+91 91234 56780",
    email: "rahim@bihar-sdma.in",
    role: "State Coordinator",
  },
  {
    id: "c2",
    name: "K. Menon",
    phone: "+91 91234 56781",
    email: "k.menon@ndrf.gov.in",
    role: "NDRF Ops — Patna",
  },
  {
    id: "c3",
    name: "S. Bhattacharya",
    phone: "+91 91234 56782",
    email: "s.b@medicalops.in",
    role: "Medical Command",
  },
  {
    id: "c4",
    name: "J. Lobo",
    phone: "+91 91234 56783",
    email: "j.lobo@shelters.gov.in",
    role: "Shelter Director",
  },
];

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [dragging, setDragging] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });

  const reorder = (targetId: string) => {
    if (!dragging || dragging === targetId) return;
    setContacts((prev) => {
      const from = prev.findIndex((c) => c.id === dragging);
      const to = prev.findIndex((c) => c.id === targetId);
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragging(null);
  };

  const addContact = () => {
    const name = newContact.name.trim();
    if (!name) {
      showToast("error", {
        title: "Name required",
        description: "Add at least a name for the contact.",
      });
      return;
    }
    const contact: Contact = {
      id: `c${Date.now()}`,
      name,
      phone: newContact.phone.trim() || "+91 00000 00000",
      email: newContact.email.trim() || `${name.split(" ")[0].toLowerCase()}@unit.gov.in`,
      role: "Field contact",
    };
    setContacts((prev) => [...prev, contact]);
    setNewContact({ name: "", phone: "", email: "" });
    setComposerOpen(false);
    showToast("success", {
      title: "Contact added",
      description: `${contact.name} is now on the priority list.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title="Emergency Contacts"
        description="Priority escalation line — drag rows to set the dial-out order."
        icon={Phone}
      >
        {composerOpen && (
          <div className="flex flex-col gap-3 border-b border-subtle bg-[var(--bg-tertiary)]/50 p-4 sm:flex-row sm:items-end">
            <input
              value={newContact.name}
              onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
              aria-label="Contact name"
              className="flex-1 rounded-md border border-border bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
            />
            <input
              value={newContact.phone}
              onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
              placeholder="Phone"
              aria-label="Contact phone"
              className="flex-1 rounded-md border border-border bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
            />
            <input
              value={newContact.email}
              onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              aria-label="Contact email"
              className="flex-1 rounded-md border border-border bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={addContact}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-accent/85"
            >
              Add Contact
            </button>
          </div>
        )}

        <ul className="flex flex-col divide-y divide-subtle">
          {contacts.map((contact, index) => (
            <li
              key={contact.id}
              draggable={dragging === contact.id}
              onDragStart={() => setDragging(contact.id)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={() => reorder(contact.id)}
              onDragEnd={() => setDragging(null)}
              className={`flex items-center gap-3 px-6 py-4 transition ${dragging === contact.id ? "opacity-40" : ""}`}
            >
              <span
                role="button"
                aria-label={`Reorder ${contact.name}`}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.effectAllowed = "move";
                  setDragging(contact.id);
                }}
                className="shrink-0 cursor-grab touch-none rounded p-1 text-muted transition hover:bg-tertiary hover:text-slate-200 active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" aria-hidden />
              </span>

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-[var(--bg-tertiary)] text-xs font-bold text-slate-300">
                {initialsFor(contact.name)}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  {contact.name}
                  <span className="rounded-full border border-border bg-tertiary px-1.5 py-px text-[9px] uppercase tracking-wider text-muted">
                    #{index + 1}
                  </span>
                </p>
                <p className="text-xs text-muted">{contact.role}</p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                  {contact.phone} · {contact.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  showToast("success", {
                    title: "Test SMS sent",
                    description: `Ping delivered to ${contact.phone}.`,
                  })
                }
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-accent hover:text-accent"
              >
                <MessageSquareMore className="h-3.5 w-3.5" aria-hidden />
                Test Message
              </button>
            </li>
          ))}
        </ul>

        {/* Prominent dashed "Add New Contact" */}
        <button
          type="button"
          onClick={() => setComposerOpen((o) => !o)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm font-semibold text-slate-300 transition hover:border-accent hover:text-accent"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add New Contact
        </button>
      </SettingsSection>

      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setComposerOpen((o) => !o)}
        aria-label={composerOpen ? "Close add contact" : "Add emergency contact"}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.35)] transition hover:bg-accent/85 active:scale-95"
      >
        {composerOpen ? (
          <X className="h-6 w-6" aria-hidden />
        ) : (
          <Plus className="h-6 w-6" aria-hidden />
        )}
      </button>
    </div>
  );
}
