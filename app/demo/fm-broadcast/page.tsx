import type { Metadata } from "next";
import FmBroadcastDemo from "@/components/demo/fm/FmBroadcastDemo";

export const metadata: Metadata = {
  title: "FM Broadcast Simulator | SafeSphere Demo",
  description:
    "Simulate an AI-voiced calamity alert broadcasting to FM radio stations — 100% simulated, no real stations contacted.",
};

export default function FmBroadcastDemoPage() {
  return <FmBroadcastDemo />;
}
