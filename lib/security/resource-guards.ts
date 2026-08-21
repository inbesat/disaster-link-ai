// ---------------------------------------------------------------------
// lib/security/resource-guards.ts — Prompt 7.4 Resource Exhaustion Prevention
//
// Limits query result sizes, GeoJSON polygon complexity, file uploads,
// WebSocket connections, alert broadcast recipients, and AI prompt lengths.
// ---------------------------------------------------------------------

export const RESOURCE_LIMITS = {
  MAX_QUERY_ROWS: 1000,
  MAX_POLYGON_VERTICES: 500,
  MAX_IMAGE_UPLOAD_BYTES: 5 * 1024 * 1024, // 5MB
  MAX_DOCUMENT_UPLOAD_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_CONCURRENT_WEBSOCKETS: 3,
  MAX_BROADCAST_RECIPIENTS: 50_000,
  MAX_AI_PROMPT_TOKENS: 4000,
} as const;

/** Enforces pagination / row limits on database queries (max 1,000 rows). */
export function clampQueryLimit(requestedLimit?: number): number {
  if (!requestedLimit || requestedLimit <= 0) {
    return RESOURCE_LIMITS.MAX_QUERY_ROWS;
  }
  return Math.min(requestedLimit, RESOURCE_LIMITS.MAX_QUERY_ROWS);
}

/** Validates GeoJSON polygon complexity (max 500 vertices). */
export function validatePolygonComplexity(geometry: {
  type?: string;
  coordinates?: unknown;
}): {
  valid: boolean;
  vertexCount: number;
  reason?: string;
} {
  if (!geometry || !geometry.type || !Array.isArray(geometry.coordinates)) {
    return {
      valid: false,
      vertexCount: 0,
      reason: "Invalid GeoJSON geometry structure.",
    };
  }

  let count = 0;
  const countVertices = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    if (
      arr.length === 2 &&
      typeof arr[0] === "number" &&
      typeof arr[1] === "number"
    ) {
      count++;
      return;
    }
    for (const item of arr) {
      countVertices(item);
    }
  };

  countVertices(geometry.coordinates);

  if (count > RESOURCE_LIMITS.MAX_POLYGON_VERTICES) {
    return {
      valid: false,
      vertexCount: count,
      reason: `Polygon vertex count (${count}) exceeds limit of ${RESOURCE_LIMITS.MAX_POLYGON_VERTICES} vertices.`,
    };
  }

  return { valid: true, vertexCount: count };
}

/** Validates upload file sizes based on MIME type (5MB for images, 10MB for documents). */
export function validateFileUploadSize(
  fileSizeBytes: number,
  mimeType: string,
): {
  valid: boolean;
  reason?: string;
} {
  const isImage = mimeType.startsWith("image/");
  const maxBytes = isImage
    ? RESOURCE_LIMITS.MAX_IMAGE_UPLOAD_BYTES
    : RESOURCE_LIMITS.MAX_DOCUMENT_UPLOAD_BYTES;

  if (fileSizeBytes > maxBytes) {
    const maxMb = isImage ? "5MB" : "10MB";
    return {
      valid: false,
      reason: `File size (${(fileSizeBytes / (1024 * 1024)).toFixed(
        1,
      )}MB) exceeds maximum limit of ${maxMb}.`,
    };
  }

  return { valid: true };
}

/** Validates alert broadcast recipient count (max 50,000 recipients). */
export function validateBroadcastSize(recipientCount: number): {
  valid: boolean;
  batchNeeded: boolean;
  batchCount: number;
  reason?: string;
} {
  if (recipientCount <= 0) {
    return {
      valid: false,
      batchNeeded: false,
      batchCount: 0,
      reason: "Recipient count must be greater than zero.",
    };
  }

  if (recipientCount > RESOURCE_LIMITS.MAX_BROADCAST_RECIPIENTS) {
    const batchCount = Math.ceil(
      recipientCount / RESOURCE_LIMITS.MAX_BROADCAST_RECIPIENTS,
    );
    return {
      valid: false,
      batchNeeded: true,
      batchCount,
      reason: `Recipient count (${recipientCount}) exceeds limit of ${RESOURCE_LIMITS.MAX_BROADCAST_RECIPIENTS}. Batch into ${batchCount} sends.`,
    };
  }

  return { valid: true, batchNeeded: false, batchCount: 1 };
}

/** Truncates or validates AI prompt input tokens (max 4000 tokens / ~16000 chars). */
export function validateAiPromptLength(promptText: string): {
  valid: boolean;
  estimatedTokens: number;
  truncatedText?: string;
} {
  const estimatedTokens = Math.ceil(promptText.length / 4);

  if (estimatedTokens > RESOURCE_LIMITS.MAX_AI_PROMPT_TOKENS) {
    const maxChars = RESOURCE_LIMITS.MAX_AI_PROMPT_TOKENS * 4;
    return {
      valid: false,
      estimatedTokens,
      truncatedText: promptText.slice(0, maxChars),
    };
  }

  return { valid: true, estimatedTokens };
}
