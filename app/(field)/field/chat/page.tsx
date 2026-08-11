import type { Metadata } from "next";
import FieldChat from "@/components/field/FieldChat";

export const metadata: Metadata = {
  title: "Tactical Chat | Field",
};

export default function FieldChatPage() {
  return (
    <div className="space-y-3">
      <header>
        <h1 className="text-2xl font-bold text-amber-300">Tactical Chat</h1>
        <p className="mt-1 text-base text-gray-400">
          Secure unit &amp; command channels — encrypted end-to-end in production.
        </p>
      </header>
      <FieldChat />
    </div>
  );
}
