"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/supabase/storage";
import {
  profileSetupSchema,
  ROLES,
  ORGANIZATIONS,
  type ProfileSetupInput,
} from "@/lib/validations/user";
import { LOCALE_OPTIONS } from "@/lib/i18n/locales";
import DataExportButton from "@/components/security/DataExportButton";
import Toggle from "@/components/settings/Toggle";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) supabase = createClient();
  return supabase;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      role: "field_responder",
      organization: "NGO",
      preferredLanguage: "en",
      isNgo: false,
      isPwd: false,
    },
  });

  // Reveals the NGO registration fields — off by default so citizens sail
  // through onboarding; NGOs flip it to identify themselves for the
  // Verified NGO Donation track.
  const isNgo = watch("isNgo");

  // Reveals the PWD mobility details — off by default; toggled ON by
  // citizens who need priority rescue (Persons with Disabilities).
  const isPwd = watch("isPwd");

  useEffect(() => {
    async function guard() {
      const {
        data: { user },
      } = await getSupabase().auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
    }
    void guard();
  }, [router]);

  async function onSubmit(data: ProfileSetupInput) {
    setSaving(true);
    setError(null);
    const client = getSupabase();

    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    let avatarUrl: string | null = null;
    if (avatarFile) {
      try {
        avatarUrl = await uploadAvatar(avatarFile, user.id);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Avatar upload failed.");
        setSaving(false);
        return;
      }
    }

    const { error: updateError } = await client
      .from("users")
      .update({
        name: data.name,
        organization: data.organization,
        role: data.role,
        phone: data.phone,
        emergency_contact: data.emergencyContact,
        assigned_district: data.assignedDistrict,
        preferred_language: data.preferredLanguage,
        // Verified NGO Donation — persist the NGO track only when the
        // toggle is ON; otherwise keep the columns null. Verification
        // status defaults to 'pending' in the DB until an admin reviews.
        is_ngo: data.isNgo,
        ngo_reg_number: data.isNgo ? (data.ngoRegNumber ?? null) : null,
        ngo_description: data.isNgo ? (data.ngoDescription ?? null) : null,
        // PWD (Persons with Disabilities) — persist the PWD track only when
        // the toggle is ON; otherwise keep the columns null/false. This
        // ensures PWD users get priority rescue when they hit the SOS button.
        is_pwd: data.isPwd,
        pwd_details: data.isPwd ? (data.pwdDetails ?? null) : null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/command-center");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-md border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none";
  const labelClass = "eoc-label block mb-1.5";
  const errorClass = "mt-1 text-xs text-severity-red-400";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl space-y-5">
        <div className="eoc-panel p-8">
          <p className="eoc-label mb-1 text-accent">ONBOARDING</p>
        <h1 className="text-2xl font-bold">Complete Your Profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          This information is shared with your district control room.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div>
            <label htmlFor="avatar" className={labelClass}>
              Avatar / Organization Logo
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground file:mr-3 file:rounded file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950"
            />
          </div>

          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              placeholder="e.g. Asha Verma"
              className={inputClass}
            />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="organization" className={labelClass}>
                Organization
              </label>
              <select
                id="organization"
                {...register("organization")}
                className={inputClass}
              >
                {ORGANIZATIONS.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
              {errors.organization && (
                <p className={errorClass}>{errors.organization.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className={labelClass}>
                Role
              </label>
              <select id="role" {...register("role")} className={inputClass}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace("_", " ")}
                  </option>
                ))}
              </select>
              {errors.role && <p className={errorClass}>{errors.role.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              {...register("phone")}
              placeholder="+919876543210"
              className={inputClass}
            />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="emergencyContact.name" className={labelClass}>
                Emergency Contact Name
              </label>
              <input
                id="emergencyContact.name"
                type="text"
                {...register("emergencyContact.name")}
                placeholder="Next of kin"
                className={inputClass}
              />
              {errors.emergencyContact?.name && (
                <p className={errorClass}>{errors.emergencyContact.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="emergencyContact.phone" className={labelClass}>
                Emergency Contact Phone
              </label>
              <input
                id="emergencyContact.phone"
                type="tel"
                {...register("emergencyContact.phone")}
                placeholder="+919876543210"
                className={inputClass}
              />
              {errors.emergencyContact?.phone && (
                <p className={errorClass}>{errors.emergencyContact.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="assignedDistrict" className={labelClass}>
              Assigned District
            </label>
            <input
              id="assignedDistrict"
              type="text"
              {...register("assignedDistrict")}
              placeholder="e.g. Patna"
              className={inputClass}
            />
            {errors.assignedDistrict && (
              <p className={errorClass}>{errors.assignedDistrict.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="preferredLanguage" className={labelClass}>
              Preferred Language
            </label>
            <select
              id="preferredLanguage"
              {...register("preferredLanguage")}
              className={inputClass}
            >
              {LOCALE_OPTIONS.map(({ code, nativeLabel }) => (
                <option key={code} value={code}>
                  {nativeLabel}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Your interface language — emergency SMS alerts will be sent in
              this language.
            </p>
          </div>

          {/* PWD (Persons with Disabilities) — priority rescue toggle. */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Person with Disability (PWD) / Mobility Impaired
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Toggle ON if you or someone in your household requires priority
                  rescue. Your SOS requests will jump to the top of the queue.
                </p>
              </div>
              <Toggle
                checked={isPwd}
                onChange={(next) =>
                  setValue("isPwd", next, { shouldValidate: true })
                }
                label="I am a Person with Disability (PWD) / Mobility Impaired"
              />
            </div>

            {isPwd && (
              <div className="mt-5">
                <label htmlFor="pwdDetails" className={labelClass}>
                  Please specify mobility/accessibility needs
                </label>
                <input
                  id="pwdDetails"
                  type="text"
                  {...register("pwdDetails")}
                  placeholder="e.g. Wheelchair user, visually impaired, bedridden"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-500">
                  This information helps rescue teams prepare the right equipment
                  (e.g., boat with ramp, physical lifting assistance).
                </p>
                {errors.pwdDetails && (
                  <p className={errorClass}>{errors.pwdDetails.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Verified NGO Donation — onboarding identity toggle. */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Register as an NGO / Relief Organization
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Verified NGOs can later upload donation QR codes to receive
                  funds. Your registration is reviewed by an admin before
                  verification.
                </p>
              </div>
              <Toggle
                checked={isNgo}
                onChange={(next) =>
                  setValue("isNgo", next, { shouldValidate: true })
                }
                label="Register as an NGO / Relief Organization"
              />
            </div>

            {isNgo && (
              <div className="mt-5 space-y-5">
                <div>
                  <label htmlFor="ngoRegNumber" className={labelClass}>
                    NGO Registration Number
                  </label>
                  <input
                    id="ngoRegNumber"
                    type="text"
                    {...register("ngoRegNumber")}
                    placeholder="e.g. NGO/2024/DR/001142"
                    className={inputClass}
                  />
                  {errors.ngoRegNumber && (
                    <p className={errorClass}>{errors.ngoRegNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ngoDescription" className={labelClass}>
                    Brief Description of Relief Work
                  </label>
                  <textarea
                    id="ngoDescription"
                    {...register("ngoDescription")}
                    rows={3}
                    placeholder="e.g. Flood rescue, shelter operations, and distribution of relief kits across Bihar."
                    className={inputClass}
                  />
                  {errors.ngoDescription && (
                    <p className={errorClass}>{errors.ngoDescription.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-severity-red-600 bg-severity-red-600/10 px-3 py-2 text-sm text-severity-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/80 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
          </form>
        </div>

        <section className="eoc-panel p-6">
          <p className="eoc-label mb-1 text-accent">DATA PRIVACY & COMPLIANCE</p>
          <h2 className="text-lg font-bold">Data Privacy &amp; Compliance</h2>
          <p className="mt-1 text-sm text-slate-400">
            Under GDPR Art. 20 and the DPDP Act 2023, you can download a
            portable copy of your personal data — profile, login history, and
            recent platform actions — compiled securely.
          </p>
          <div className="mt-4">
            <DataExportButton />
          </div>
        </section>
      </div>
    </main>
  );
}
