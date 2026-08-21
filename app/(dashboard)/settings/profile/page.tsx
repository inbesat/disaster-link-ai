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
  "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30";

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
              className="group relative h-28 w-28 rounded-full border-2 border-white/20 bg-white/5 shadow-lg transition hover:border-purple-400 hover:shadow-[0_0_16px_rgba(139,92,246,0.4)]"
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
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-purple-900/60 opacity-0 transition group-hover:opacity-100 backdrop-blur-sm">
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
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                <Shield className="h-4 w-4 text-purple-400" aria-hidden />
                <span className="text-sm font-semibold text-slate-200">
                  {ROLE_LABELS[fields.role] ?? fields.role}
                </span>
                <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-eoc-tiny uppercase tracking-wider text-slate-400">
                  Read-only · assigned by admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Language Selector */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400/90">Language</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {["English", "Hindi", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia", "Assamese"].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => showToast("success", { title: "Language updated", description: `${lang} selected.` })}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                lang === "English"
                  ? "border-purple-400/60 bg-purple-400/10 text-purple-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-purple-400/40 hover:text-purple-300"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Family Members */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-400/90">Family Members</p>
          <button
            type="button"
            onClick={() => showToast("info", { title: "Add family member", description: "Form coming soon." })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-purple-300 transition hover:border-purple-400/40 hover:bg-purple-400/10"
          >
            + Add Member
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {[
            { name: "Sunita Verma", relation: "Mother", phone: "+91 98765 12345" },
            { name: "Raj Verma", relation: "Father", phone: "+91 98765 67890" },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-400/10 text-xs font-bold text-purple-300">
                {m.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">{m.name}</p>
                <p className="text-[11px] text-slate-500">{m.relation} · {m.phone}</p>
              </div>
              <button type="button" className="text-xs text-slate-500 transition hover:text-red-400">Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* Home Location */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400/90">Home Location</p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              id="home-location"
              defaultValue="Patna, Bihar (25.6093° N, 85.1376° E)"
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={() => showToast("info", { title: "Location picker", description: "Map picker opening..." })}
            className="shrink-0 rounded-lg border border-purple-400/40 bg-purple-400/10 px-3 py-2 text-xs font-medium text-purple-300 transition hover:bg-purple-400/20"
          >
            📍 Use GPS
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">Used to show nearby alerts and shelters on your map.</p>
      </div>

      {/* 2FA & Security (Gov) */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400/90">Two-Factor Authentication</p>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-200">Authenticator App (TOTP)</p>
            <p className="text-[11px] text-slate-500">Use Google Authenticator or similar app for login verification.</p>
          </div>
          <button
            type="button"
            onClick={() => showToast("success", { title: "2FA enabled", description: "Authenticator app configured." })}
            className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/20"
          >
            ✓ Enabled
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400/90">Active Sessions</p>
        <div className="space-y-2">
          {[
            { device: "Chrome · Windows 11", ip: "103.21.x.x", time: "Now", current: true },
            { device: "Safari · iPhone 15", ip: "49.36.x.x", time: "2h ago", current: false },
          ].map((s) => (
            <div key={s.device} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <span className={`h-2 w-2 rounded-full ${s.current ? "bg-green-400" : "bg-slate-600"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">{s.device}</p>
                <p className="text-[11px] text-slate-500">{s.ip} · {s.time}</p>
              </div>
              {!s.current && (
                <button type="button" className="text-xs text-red-400 transition hover:text-red-300">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Save footer — only appears once inputs are modified */}
      {isDirty && (
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 rounded-xl border border-white/10 bg-[#0a0f1a]/90 px-6 py-4 backdrop-blur-md shadow-lg">
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
