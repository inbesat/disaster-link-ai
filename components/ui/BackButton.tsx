"use client";

// ---------------------------------------------------------------------
// components/ui/BackButton.tsx — global "go back" affordance.
//
// Renders a ghost IconButton with an arrow-left icon that calls
// history.back(). If there is no navigation history to go back to, it
// falls back to the command center so the button never dead-ends.
// ---------------------------------------------------------------------

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

export interface BackButtonProps {
  label?: string;
  className?: string;
}

export function BackButton({
  label = "Go back",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  return (
    <IconButton
      label={label}
      size="md"
      variant="ghost"
      className={className}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push("/command-center");
        }
      }}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
    </IconButton>
  );
}

export default BackButton;
