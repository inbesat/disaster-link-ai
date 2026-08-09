import { redirect } from "next/navigation";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/page.tsx
//
// Canonical identity view now lives at /settings/profile; keep the bare
// /settings URL resolving so deep links and the old sidebar entry never
// hit a dead route.
// ---------------------------------------------------------------------

export default function SettingsIndexPage() {
  redirect("/settings/profile");
}
