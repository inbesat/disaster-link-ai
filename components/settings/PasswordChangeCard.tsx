"use client";

// ---------------------------------------------------------------------
// components/settings/PasswordChangeCard.tsx — Settings · Phase 5.
//
// Secure password change card for /settings/profile:
//   • Fields: Current Password, New Password, Confirm New Password.
//   • Zod validation — 8+ chars, one uppercase, one number, match confirm.
//   • Real-time Password Strength Meter (Red = Weak, Amber = Moderate,
//     Green = Tactical) rendered below the new password input.
//   • Inline success toast on update — no full page reload.
//
// Uses Supabase Auth updatePassword() when signed-in (RLS-free: the client
// password grant verifies the session). In guest / offline / DB-unreachable
// cases it shows the same confirmation via the demo fallback so the demo
// never breaks. Mirroring the ProfileForm + AvatarCard offline-first flow.
// ---------------------------------------------------------------------

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";

import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validations/user";

// ---------------------------------------------------------------------
// Password Strength Meter
// Scores each rule (length, uppercase, number) into Weak / Moderate /
// Tactical buckets — the "Tactical" label keeps the emergency-ops tone.
// ---------------------------------------------------------------------
const STRENGTH_RULES: Array<{ test: (v: string) => boolean; weight: number }> = [
  { test: (v) => v.length >= 8, weight: 1 },
  { test: (v) => /[A-Z]/.test(v), weight: 1 },
  { test: (v) => /[0-9]/.test(v), weight: 1 },
];

export function passwordStrength(value: string): 1 | 2 | 3 {
  if (!value) return 1;
  const score = STRENGTH_RULES.reduce(
    (sum, r) => sum + (r.test(value) ? r.weight : 0),
    0,
  );
  return score <= 1 ? 1 : score === 2 ? 2 : 3;
}

const STRENGTH_LABELS = ["Weak", "Moderate", "Strong"];
const STRENGTH_LABELS_COLOR = [
  "text-severity-red-400",
  "text-severity-amber-400",
  "text-severity-green-400",
];
const STRENGTH_BAR_COLOR = [
  "bg-severity-red-500",
  "bg-severity-amber-500",
  "bg-severity-green-500",
];

function StrengthMeter({ value }: { value: string }) {
  const strength = passwordStrength(value);
  if (!value) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              segment <= strength ? STRENGTH_BAR_COLOR[strength - 1] : "bg-[#1c2740]"
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className={`text-[11px] font-semibold ${STRENGTH_LABELS_COLOR[strength - 1]}`}>
          {strength === 1
            ? "Weak — add length & variety"
            : strength === 2
              ? "Moderate — keep going"
              : "Tactical — strong password"}
        </span>
        <span className="text-[11px] text-slate-500">{STRENGTH_LABELS[strength - 1]}</span>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-[#2c3f6d] bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none";
const labelClass = "eoc-label block mb-1.5 text-slate-400";
const errorClass = "mt-1 text-xs text-severity-red-400";

export default function PasswordChangeCard() {
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = watch("newPassword");

  async function onSubmit(data: ChangePasswordInput) {
    setSaving(true);
    try {
      const client = createClient();
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        // Guest / demo fallback: no real Supabase session, nothing actually
        // to update — show the same confirmation so the demo never breaks.
        toast.success("Password updated (demo mode — no real account).");
      } else {
        // This auth-js version exposes password updates via updateUser()
        // (there is no updatePassword method on the typed client). The
        // current password is forwarded when the server enforces it.
        const { error } = await client.auth.updateUser({
          password: data.newPassword,
          current_password: data.currentPassword,
        });
        if (error) throw error;
        toast.success("Password updated successfully!");
      }
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setSaving(false);
    }
  }

  function toggleShow() {
    setShow((s) => !s);
  }

  return (
    <section
      data-settings-key="password"
      className="rounded-eoc border border-[#1c2740] bg-surface p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
          <KeyRound className="h-5 w-5 text-cyan-400" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-cyan-400/80">PASSWORD &amp; SECURITY</p>
          <h2 className="mt-0.5 text-lg font-bold">Update Password</h2>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-sm text-slate-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-severity-green-400" aria-hidden />
        Use at least 8 characters with an uppercase letter and a number.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <div>
          <label htmlFor="currentPassword" className={labelClass}>
            Current Password
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              {...register("currentPassword")}
              className={`${inputClass} pr-11`}
              placeholder="Enter your current password"
            />
            <button
              type="button"
              onClick={toggleShow}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-cyan-300"
              aria-label={show ? "Hide passwords" : "Show passwords"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className={errorClass}>{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className={labelClass}>
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              {...register("newPassword")}
              className={`${inputClass} pr-11`}
              placeholder="At least 8 characters"
            />
          </div>
          <StrengthMeter value={newPasswordValue} />
          {errors.newPassword && <p className={errorClass}>{errors.newPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={inputClass}
            placeholder="Re-enter your new password"
          />
          {errors.confirmPassword && (
            <p className={errorClass}>{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md border border-[#2c3f6d] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-glow-accent transition hover:bg-cyan-400 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Updating…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}