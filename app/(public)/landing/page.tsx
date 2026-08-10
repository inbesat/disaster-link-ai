import { redirect } from "next/navigation";

// The marketing landing now lives at the root `/` — this route is kept as a
// redirect so any existing deep links/bookmarks still work.
export default function LandingRedirect() {
  redirect("/");
}