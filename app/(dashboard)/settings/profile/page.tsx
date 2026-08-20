"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/profile/page.tsx — UI/UX Phase 7 · Step 3.
//
// Identity & profile page.
//   • SettingsSection wrapper
//   • large circular avatar with a subtle camera overlay on hover
//   • 2-column form grid (1-col mobile) for name / email / phone / org,
//     with Role rendered as a read-only badge
//   • sticky "Save Changes" footer — only appears once inputs are dirty
// ---------------------------------------------------------------------

import { useRef, useState } from "react";
import { Building2, Camera, Shield, UserRound } from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import { showToast } from "@/components/ui/Toast";
import { ROLE_LABELS, type Role } from "@/lib/validations/user";
import {
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  AVATAR_CHANGED_EVENT,
  getStoredAvatar,
  initialsFor,
  isAvatarFile,
  setStoredAvatar,
} from "@/lib/settings/avatar";

const inputClass =
  "w-full rounded-md border border-subtle bg-[var(--bg-tertiary)] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-accent";

type ProfileFields = {
  name: string;
  email: string;
  phone: string;
  org: string;
  role: Role;
};

const INITIAL: ProfileFields = {
  name: "Aarav Sharma",
  email: "aarav.sharma@drp.gov.in",
  phone: "+91 98210 44321",
  org: "Bihar State Disaster Response",
  role: "super_admin",
};

export default function ProfileIdentityPage() {
  const [fields, setFields] = useState<ProfileFields>(INITIAL);
  const [avatar, setAvatar] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getStoredAvatar(),
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const isDirty =
    (typeof window !== "undefined" && avatar !== getStoredAvatar()) ||
    fields.name !== INITIAL.name ||
    fields.email !== INITIAL.email ||
    fields.phone !== INITIAL.phone ||
    fields.org !== INITIAL.org;

  const set = (key: keyof ProfileFields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!isAvatarFile(file)) {
      showToast("error", {
        title: "Unsupported file",
        description: "Use PNG, JPEG or WebP images.",
      });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      showToast("error", {
        title: "File too large",
        description: "Keep your avatar under 8 MB.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = String(reader.result);
      setStoredAvatar(dataUri);
      setAvatar(dataUri);
      window.dispatchEvent(new Event(AVATAR_CHANGED_EVENT));
      showToast("success", {
        title: "Avatar updated",
        description: "New photo is live.",
      });
    };
    reader.readAsDataURL(file);
  };

  const label = (id: string, text: string) => (
    <label
      htmlFor={id}
      className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted"
    >
      {text}
    </label>
  );

  const textInput = (
    id: string,
    value: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  ) => <input id={id} value={value} onChange={onChange} className={inputClass} />;

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title="Identity & Profile"
        description="Details shown to field teams and stamped onto the audit log."
        icon={UserRound}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          {/* Avatar upload */}
          <div className="flex shrink-0 flex-col items-center gap-3 md:items-start">
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_ACCEPT.join(",")}
              className="hidden"
              aria-hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Upload profile photo"
              className="group relative h-28 w-28 rounded-full border-2 border-border bg-[var(--bg-tertiary)] transition hover:border-accent"
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt="Your profile photo"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-slate-400">
                  {initialsFor(fields.name)}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white/90" aria-hidden />
              </span>
            </button>
            <p className="text-[11px] text-muted">PNG · JPG · WebP · max 8 MB</p>
          </div>

          {/* Form grid */}
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              {label("profile-name", "Full name")}
              {textInput("profile-name", fields.name, set("name"))}
            </div>
            <div>
              {label("profile-email", "Email")}
              {textInput("profile-email", fields.email, set("email"))}
            </div>
            <div>
              {label("profile-phone", "Phone")}
              {textInput("profile-phone", fields.phone, set("phone"))}
            </div>
            <div>
              {label("profile-org", "Organization")}
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <input
                  id="profile-org"
                  value={fields.org}
                  onChange={set("org")}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              {label("profile-role", "Role")}
              <div className="flex items-center gap-3 rounded-md border border-border bg-[var(--bg-tertiary)] px-3 py-2.5">
                <Shield className="h-4 w-4 text-accent" aria-hidden />
                <span className="text-sm font-semibold text-slate-200">
                  {ROLE_LABELS[fields.role] ?? fields.role}
                </span>
                <span className="ml-auto rounded-full border border-border bg-tertiary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                  Read-only · assigned by admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Sticky Save footer — only appears once inputs are modified */}
      {isDirty && (
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-xl border border-subtle bg-[rgb(var(--bg-primary-rgb)/95)] px-6 py-4 backdrop-blur">
          <p className="mr-auto text-xs text-muted">You have unsaved changes.</p>
          <button
            type="button"
            onClick={() => {
              setFields(INITIAL);
              showToast("info", {
                title: "Changes reverted",
                description: "Back to the saved profile.",
              });
            }}
            className="rounded-md px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:text-slate-100"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => {
              showToast("success", {
                title: "Profile saved",
                description: "Changes are now live.",
              });
            }}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-accent/85 active:scale-[0.98]"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
