import { redirect } from "next/navigation";

// ---------------------------------------------------------------------
// app/public/login/page.tsx — backward-compatibility redirect.
//
// The unified login surface now lives at /login?mode=citizen. This page
// ensures any old bookmarks or links to /public/login still land correctly.
// ---------------------------------------------------------------------

export default function PublicLoginRedirect() {
  redirect("/login?mode=citizen");
}
