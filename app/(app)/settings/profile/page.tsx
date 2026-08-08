import type { Metadata } from "next";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import ProfileForm, {
  type ProfileSettingsInitial,
} from "@/components/settings/ProfileForm";
import AvatarCard from "@/components/settings/AvatarCard";
import ProfessionalDetailsCard from "@/components/settings/ProfessionalDetailsCard";
import PasswordChangeCard from "@/components/settings/PasswordChangeCard";
import ActiveSessionsCard from "@/components/settings/ActiveSessionsCard";
import LocalizationSettingsCard from "@/components/settings/LocalizationSettingsCard";
import ProfileVisibilityCard from "@/components/settings/ProfileVisibilityCard";

export const metadata: Metadata = {
  title: "Profile & Account | Settings | DRIP",
};

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------
// app/(app)/settings/profile/page.tsx — Settings · Phase 2.
//
// Server component: resolves the signed-in user's email + profile row and
// hands them to ProfileForm. Guests and unreachable-DB states fall back to
// the component's demo defaults so the page always renders.
// ---------------------------------------------------------------------

const DEMO_INITIAL: ProfileSettingsInitial = {
  email: "asha.verma@ndrf.gov.in",
  emailVerified: true,
  fullName: "Asha Verma",
  displayName: "asha.v",
  phone: "+91 98765 43210",
  bio: "Field coordinator supporting flood relief operations in Patna.",
  designation: "NDRF",
  role: "district_admin",
  assignedDistrict: "Patna",
};

export default async function ProfileSettingsPage() {
  const guest = cookies().get("guest_mode")?.value === "true";

  let initial: ProfileSettingsInitial = DEMO_INITIAL;
  let userId: string | null = null;
  let avatarUrl: string | null = null;

  if (!guest) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        const { data: profile } = await supabase
          .from("users")
          .select("name, phone, role, assigned_district, organization, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        avatarUrl = profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | null) ?? null;

        const meta = user.user_metadata ?? {};
        initial = {
          email: user.email ?? null,
          emailVerified: Boolean(user.email_confirmed_at),
          fullName: profile?.name ?? (meta.name as string | undefined) ?? null,
          displayName:
            (meta.display_name as string | undefined) ??
            (meta.name as string | undefined) ??
            null,
          phone: profile?.phone ?? null,
          bio: (meta.bio as string | undefined) ?? null,
          designation: profile?.organization ?? null,
          role: profile?.role ?? null,
          assignedDistrict: profile?.assigned_district ?? null,
        };
      }
    } catch (error) {
      // DB/auth unreachable → render with demo data; ProfileForm will save
      // to localStorage as a mock fallback.
      console.warn("[settings/profile] Profile fetch failed — using demo data.", error);
    }
  }

  return (
    <div className="space-y-6">
      <AvatarCard
        serverAvatarUrl={avatarUrl}
        displayName={initial.fullName}
        userId={userId}
      />
      <ProfileForm initial={initial} />
      <ProfessionalDetailsCard />
      <PasswordChangeCard />
      <ActiveSessionsCard />
      <LocalizationSettingsCard />
      <ProfileVisibilityCard />
    </div>
  );
}
