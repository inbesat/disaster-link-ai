import { redirect } from "next/navigation";

// /settings → Profile & Account (first section in the sidebar).
export default function SettingsIndexPage() {
  redirect("/settings/profile");
}
