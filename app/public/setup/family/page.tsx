"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ChevronLeft, Phone, Plus, User, X } from "lucide-react";
import { indianPhoneSchema } from "@/lib/validations/user";

// ---------------------------------------------------------------------
// app/public/setup/family/page.tsx — Phase 1 · Step 7 · Family Safety
// Group Setup. Citizens add up to 5 family members (name + phone) for
// quick SOS blasts. "Finish Setup" persists the group to localStorage
// (mock DB) and redirects to the citizen dashboard.
// ---------------------------------------------------------------------

const MAX_CONTACTS = 5;
const STORAGE_KEY = "citizen_family_contacts";
const DASHBOARD_URL = "/public/dashboard";

type Contact = { id: number; name: string; phone: string };

export default function FamilySetupPage() {
  const router = useRouter();
  const nextId = useRef(1);
  const [contacts, setContacts] = useState<Contact[]>([{ id: 0, name: "", phone: "" }]);
  const [error, setError] = useState<string | null>(null);

  const filledCount = contacts.filter((c) => c.name.trim() || c.phone.trim()).length;
  const canAdd = contacts.length < MAX_CONTACTS;

  function updateContact(id: number, patch: Partial<Pick<Contact, "name" | "phone">>) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addContact() {
    if (!canAdd) return;
    setContacts((prev) => [...prev, { id: nextId.current++, name: "", phone: "" }]);
    setError(null);
  }

  function removeContact(id: number) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setError(null);
  }

  function finishSetup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Any partially-filled row must be complete and valid; fully empty rows
    // are ignored (a citizen with no family can still finish).
    const filled = contacts.filter((c) => c.name.trim() || c.phone.trim());
    // Normalise first: the schema's regex does not allow spaces/dashes, so
    // "+91 98765 43210" must be checked as "+919876543210" (and saved that
    // way too).
    const normalized = filled.map((c) => ({
      name: c.name.trim(),
      phone: c.phone.replace(/[\s-]/g, ""),
    }));
    for (const contact of normalized) {
      if (contact.name.length < 2) {
        setError("Enter each family member's name.");
        return;
      }
      if (!indianPhoneSchema.safeParse(contact.phone).success) {
        setError("Enter a valid Indian phone number (e.g. +919876543210).");
        return;
      }
    }

    const payload = {
      contacts: normalized,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    router.push(DASHBOARD_URL);
  }

  const inputClass =
    "w-full rounded-[var(--dl-radius-sm)] border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-[var(--dl-text-muted)] transition focus:border-[var(--dl-orange)] focus:ring-2 focus:ring-[var(--dl-orange)]/30 focus:outline-none";

  return (
    <main className="landing-page relative flex min-h-screen flex-col overflow-hidden bg-[var(--dl-navy)]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_-10%,rgba(249,115,22,0.16),transparent),radial-gradient(ellipse_50%_40%_at_0%_110%,rgba(37,99,235,0.18),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
        {/* Progress bar — Location done, Family active, Finish pending */}
        <div className="mb-6 flex items-center gap-1.5" aria-hidden="true">
          <span className="h-1 flex-1 rounded-full bg-[var(--dl-orange)]" />
          <span className="h-1 flex-1 rounded-full bg-[var(--dl-orange)]" />
          <span className="h-1 flex-1 rounded-full bg-white/15" />
        </div>

        <Link
          href="/public/setup/location"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--dl-text-muted)] transition hover:text-white"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Back
        </Link>

        <span
          aria-hidden="true"
          className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--dl-orange)]/15 text-4xl ring-1 ring-[var(--dl-orange)]/30"
        >
          👨‍👩‍👧
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">
          Who&apos;s in your safety circle?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--dl-text-on-navy)]">
          Add family members so one SOS blast reaches everyone who matters —
          even when you can&apos;t.
        </p>

        <form onSubmit={finishSetup} className="mt-7 space-y-4">
          {/* Contact cards */}
          {contacts.map((contact, index) => (
            <div
              key={contact.id}
              className="rounded-[var(--dl-radius)] border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="eoc-label text-[var(--dl-text-muted)]">
                  FAMILY MEMBER {index + 1}
                </p>
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContact(contact.id)}
                    aria-label={`Remove family member ${index + 1}`}
                    className="rounded-full p-1 text-[var(--dl-text-muted)] transition hover:bg-white/10 hover:text-white"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dl-text-muted)]"
                  />
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Name"
                    aria-label={`Family member ${index + 1} name`}
                    value={contact.name}
                    onChange={(e) => updateContact(contact.id, { name: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
                <div className="relative">
                  <Phone
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dl-text-muted)]"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Phone number"
                    aria-label={`Family member ${index + 1} phone`}
                    value={contact.phone}
                    onChange={(e) => updateContact(contact.id, { phone: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add another contact */}
          {canAdd ? (
            <button
              type="button"
              onClick={addContact}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] border-2 border-dashed border-[var(--dl-orange)]/40 bg-transparent px-4 py-4 text-base font-semibold text-[var(--dl-orange-light)] transition hover:border-[var(--dl-orange)] hover:bg-[var(--dl-orange)]/10"
            >
              <Plus aria-hidden="true" className="h-5 w-5" />
              Add Another Contact
            </button>
          ) : (
            <p className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-[var(--dl-text-on-navy)]">
              Safety circle full — up to {MAX_CONTACTS} members.
            </p>
          )}

          <p className="text-center font-mono text-[0.6875rem] uppercase tracking-widest text-[var(--dl-text-muted)]">
            {filledCount} of {MAX_CONTACTS} slots used
          </p>

          {error && (
            <p
              role="alert"
              className="rounded-[var(--dl-radius-sm)] border border-[var(--dl-orange)]/40 bg-[var(--dl-orange)]/10 px-3 py-2.5 text-sm text-[var(--dl-orange-light)]"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius)] bg-[var(--dl-orange)] px-6 py-4 text-lg font-bold text-white transition hover:bg-[#EA5B0C]"
          >
            Finish Setup
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--dl-text-muted)]">
          Emergency? Call the District Control Room{" "}
          <a href="tel:1070" className="font-semibold text-[var(--dl-orange-light)] hover:underline">
            1070
          </a>
        </p>
      </div>
    </main>
  );
}
