import { redirect } from "next/navigation";

// ---------------------------------------------------------------------
// app/gov/login/page.tsx — backward-compatibility redirect.
//
// The unified login surface now lives at /login?mode=gov. This page
// ensures any old bookmarks or links to /gov/login still land correctly.
// ---------------------------------------------------------------------

export default function GovLoginRedirect() {
  redirect("/login?mode=gov");
}
