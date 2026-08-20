"use client";

// ---------------------------------------------------------------------
// components/settings/ProfileForm.tsx — Settings · Phase 2.
//
// Core personal identity form for /settings/profile.
//   • Fields: full name, display name, email (read-only + Verified),
//     phone, bio, designation (NDRF / SDRF / NGO / Govt Official /
//     Citizen Volunteer).
//   • Assigned role rendered as a styled, non-editable badge.
//   • Save → tries the Supabase users row (RLS: own row), and falls back
//     to localStorage when the profile table is unreachable. Toast always
//     confirms the save so the demo never looks broken offline.
// ---------------------------------------------------------------------

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Loader2, Save, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useProfileSettings } from "@/lib/settings-mock";
import {
  profileSettingsSchema,
  DESIGNATIONS,
  ORGANIZATIONS,
  ROLE_LABELS,
  type ProfileSettingsInput,
  type Role,
} from "@/lib/validations/user";

export type ProfileSettingsInitial = {
  email?: string | null;
  emailVerified?: boolean;
  fullName?: string | null;
  displayName?: string | null;
  phone?: string | null;
  bio?: string | null;
  designation?: string | null;
  role?: string | null;
  assignedDistrict?: string | null;
};

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) supabase = createClient();
  return supabase;
}

export default function ProfileForm({ initial }: { initial: ProfileSettingsInitial }) {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { settings: mockSettings, update } = useProfileSettings();

  // A previously-saved unified localStorage snapshot (mock fallback) wins over
  // the server props so edits persist across reloads/tabs even when DB is down.
  const localFallback: Partial<ProfileSettingsInput> = {
    fullName: mockSettings.fullName,
    displayName: mockSettings.displayName,
    phone: mockSettings.phone,
    bio: mockSettings.bio,
    designation: mockSettings.designation,
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSettingsInput>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      fullName: localFallback?.fullName ?? initial.fullName ?? "Asha Verma",
      displayName:
        localFallback?.displayName ?? initial.displayName ?? "asha.v",
      phone: localFallback?.phone ?? initial.phone ?? "+91 98765 43210",
      bio:
        localFallback?.bio ??
        initial.bio ??
        "Field coordinator supporting flood relief operations in Patna.",
      designation:
        ((DESIGNATIONS as readonly string[]).includes(
          localFallback?.designation ?? "",
        )
          ? (localFallback?.designation as ProfileSettingsInput["designation"])
          : undefined) ??
        ((DESIGNATIONS as readonly string[]).includes(initial.designation ?? "")
          ? (initial.designation as ProfileSettingsInput["designation"])
          : "NGO"),
    },
  });

  const email = initial.email ?? "asha.verma@ndrf.gov.in";
  const isVerified = initial.emailVerified ?? true;

  const role = (initial.role ?? "district_admin") as Role;
  const district = initial.assignedDistrict ?? "Patna";
  const roleLabel = ROLE_LABELS[role] ?? "Responder";

  async function onSubmit(data: ProfileSettingsInput) {
    setSaving(true);
    try {
      const client = getSupabase();
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // Core columns on the users row (RLS: id = auth.uid()). The
      // `organization` column holds the ORGANIZATIONS enum, so broader
      // designations are mapped down before writing (Citizen Volunteer is
      // preserved in full via user_metadata below).
      const organization = (ORGANIZATIONS as readonly string[]).includes(
        data.designation,
      )
        ? (data.designation as (typeof ORGANIZATIONS)[number])
        : ("Govt" as const);

      const { error: rowError } = await client
        .from("users")
        .update({
          name: data.fullName,
          phone: data.phone,
          organization,
        })
        .eq("id", user.id);
      if (rowError) throw rowError;

      // Display name, bio + full designation live in auth user_metadata
      // (no schema change), so nothing is lost for Citizen Volunteers.
      const { error: metaError } = await client.auth.updateUser({
        data: {
          display_name: data.displayName,
          bio: data.bio ?? "",
          designation: data.designation,
        },
      });
      if (metaError) throw metaError;

      // Server save succeeded → the local snapshot becomes stale.
      update({
        fullName: data.fullName,
        displayName: data.displayName,
        phone: data.phone,
        bio: data.bio ?? "",
        designation: data.designation,
      });
      router.refresh(); // Navbar name / profile reads update immediately
    } catch (error: unknown) {
      // Mock fallback: Supabase unreachable → persist through the unified
      // mock store so the demo keeps working fully offline (and stays
      // synced across tabs).
      console.warn(
        "[profile] Supabase profile save failed — falling back to mock store.",
        error,
      );
      update({
        fullName: data.fullName,
        displayName: data.displayName,
        phone: data.phone,
        bio: data.bio ?? "",
        designation: data.designation,
      });
    } finally {
      setSaving(false);
      // Required copy: single confirmation string for both the live save
      // and the offline fallback so the demo behaves consistently.
      toast.success("Profile changes saved locally!");
    }
  }

  const inputClass =
    "w-full rounded-md border border-[#2c3f6d] bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none";
  const labelClass = "eoc-label block mb-1.5 text-slate-400";
  const errorClass = "mt-1 text-xs text-severity-red-400";

  return (
    <div className="space-y-5" data-settings-key="personal-info">
      {/* Assigned role — styled, non-editable badge */}
      <section className="rounded-eoc border border-[#1c2740] bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eoc-label text-amber-400/80">ASSIGNED ROLE</p>
            <p className="mt-1 font-mono text-lg font-bold uppercase tracking-wider text-amber-300">
              {roleLabel} — {district.toUpperCase()}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Role and district are managed by your command center and cannot
              be edited here.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              Locked by Admin
            </span>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <section className="rounded-eoc border border-[#1c2740] bg-surface p-6">
          <p className="eoc-label mb-4 text-cyan-400/80">PERSONAL INFO</p>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                {...register("fullName")}
                placeholder="e.g. Asha Verma"
                className={inputClass}
              />
              {errors.fullName && (
                <p className={errorClass}>{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="displayName" className={labelClass}>
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                {...register("displayName")}
                placeholder="e.g. asha.v"
                className={inputClass}
              />
              {errors.displayName && (
                <p className={errorClass}>{errors.displayName.message}</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="email" className={labelClass}>
              Email Address
            </label>
            <div className="flex items-center gap-3">
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full rounded-md border border-[#2c3f6d] bg-surface-muted/50 px-3 py-2.5 text-sm text-slate-400 focus:outline-none"
              />
              {isVerified ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-severity-green-500/40 bg-severity-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-severity-green-400">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  Verified
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-severity-amber-500/40 bg-severity-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-severity-amber-400">
                  Unverified
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Your login email is managed by your organization&apos;s identity
              provider.
            </p>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
              {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="designation" className={labelClass}>
                Designation
              </label>
              <select id="designation" {...register("designation")} className={inputClass}>
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.designation && (
                <p className={errorClass}>{errors.designation.message}</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="bio" className={labelClass}>
              Bio / Summary
            </label>
            <textarea
              id="bio"
              rows={4}
              {...register("bio")}
              placeholder="Brief summary of your role and expertise…"
              className={`${inputClass} resize-y`}
            />
            {errors.bio && <p className={errorClass}>{errors.bio.message}</p>}
            <p className="mt-1.5 text-xs text-slate-500">
              Shown on your responder directory profile.
            </p>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-glow-accent transition hover:bg-cyan-400 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
