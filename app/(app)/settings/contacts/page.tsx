import type { Metadata } from "next";
import ContactsSettingsWrapper from "@/components/settings/contacts/ContactsSettingsWrapper";

export const metadata: Metadata = {
  title: "Emergency Contacts & Comms | Settings | DRIP",
};

// ---------------------------------------------------------------------
// app/(app)/settings/contacts/page.tsx — Emergency Contacts (Phase 7 · Step 1).
//
// Thin server shell. The responsive page layout (header + card grid for
// Personal Contacts, Control Room, Quick Dial, Templates and Channel
// Priority) lives in ContactsSettingsWrapper.
// ---------------------------------------------------------------------

export default function ContactsSettingsPage() {
  return <ContactsSettingsWrapper />;
}
