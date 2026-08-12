// lib/share-alert.ts
// Shares current flood alert status via Web Share API or clipboard fallback.
// Used by the alert banner and notification center.

export interface ShareAlertPayload {
  district: string;
  riskLevel: string;
  message: string;
  predictedTime?: string;
  url?: string;
}

/**
 * Shares an alert via Web Share API (mobile) or copies to clipboard (desktop).
 * Returns true if shared successfully, false otherwise.
 */
export async function shareAlert(payload: ShareAlertPayload): Promise<boolean> {
  const text = formatAlertText(payload);
  
  // Try Web Share API first (mobile browsers, some desktop)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `⚠️ Flood Alert — ${payload.district}`,
        text,
        url: payload.url ?? window.location.href,
      });
      return true;
    } catch (err) {
      // User cancelled or API failed — fall through to clipboard
      if ((err as Error).name === 'AbortError') return false;
    }
  }
  
  // Fallback: copy to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

function formatAlertText(payload: ShareAlertPayload): string {
  const lines = [
    `🚨 FLOOD ALERT — ${payload.district.toUpperCase()}`,
    `Risk Level: ${payload.riskLevel.toUpperCase()}`,
    '',
    payload.message,
  ];
  if (payload.predictedTime) {
    lines.push('', `⏰ Predicted: ${payload.predictedTime}`);
  }
  lines.push('', `🔗 ${payload.url ?? 'https://drip-platform.vercel.app'}`);
  lines.push('', '— SafeSphere Platform');
  return lines.join('\n');
}
