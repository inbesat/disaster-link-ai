"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { useToast } from "@/hooks/useToast";
import { shareAlert, type ShareAlertPayload } from "@/lib/share-alert";

interface ShareAlertButtonProps {
  payload: ShareAlertPayload;
  className?: string;
}

export default function ShareAlertButton({ payload, className = "" }: ShareAlertButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const toast = useToast();

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    try {
      const success = await shareAlert(payload);
      if (success) {
        toast.success({ 
          title: "Alert Shared", 
          description: "Alert copied to clipboard or shared successfully." 
        });
      }
    } catch (err) {
      toast.error({ 
        title: "Share Failed", 
        description: "Could not share the alert." 
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <IconButton
      label="Share Alert"
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className={className}
    >
      <Share2 className="h-4 w-4" />
    </IconButton>
  );
}
