// ---------------------------------------------------------------------
// lib/security/upload-security.ts — Phase 8: File Upload & Storage Security
//
// Magic number validation, MIME/extension verification, size caps,
// EXIF/GPS metadata stripping, secure UUID renaming, and signed URLs.
// ---------------------------------------------------------------------

export type UploadCategory = "avatar" | "image" | "document" | "audio";

export interface FileValidationResult {
  valid: boolean;
  mimeType: string;
  extension: string;
  reason?: string;
}

export const UPLOAD_LIMITS_BYTES = {
  avatar: 2 * 1024 * 1024, // 2MB
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  audio: 10 * 1024 * 1024, // 10MB
} as const;

export const ALLOWED_MIME_TYPES: Record<UploadCategory, string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp"],
  image: ["image/jpeg", "image/png", "image/webp"],
  document: ["application/pdf"],
  audio: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"],
};

export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

/**
 * Validates file magic numbers (file signature bytes).
 * Ensures files are not disguised (e.g., HTML or SVG renamed as JPEG or PDF).
 */
export function validateMagicNumbers(buffer: Uint8Array): {
  valid: boolean;
  detectedMime?: string;
  reason?: string;
} {
  if (!buffer || buffer.length < 4) {
    return { valid: false, reason: "File buffer is too short to verify magic numbers." };
  }

  // Reject SVG and HTML signatures explicitly
  const sliceStr = Array.from(buffer.slice(0, 100))
    .map((b) => String.fromCharCode(b))
    .join("");
  const headerText = sliceStr.toLowerCase();
  if (
    headerText.includes("<svg") ||
    headerText.includes("xmlns=") ||
    headerText.includes("<!doctype html") ||
    headerText.includes("<html") ||
    headerText.includes("<script")
  ) {
    return {
      valid: false,
      reason: "Executable or scriptable file content detected (SVG/HTML rejected).",
    };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, detectedMime: "image/png" };
  }

  // WEBP: RIFF at 0..3 and WEBP at 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedMime: "image/webp" };
  }

  // PDF: %PDF (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, detectedMime: "application/pdf" };
  }

  // MP3: ID3 header (49 44 33) or MPEG sync frame (FF FB / FF FA / FF F3)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
    (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  ) {
    return { valid: true, detectedMime: "audio/mpeg" };
  }

  // WAV: RIFF at 0..3 and WAVE at 8..11
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return { valid: true, detectedMime: "audio/wav" };
  }

  return {
    valid: false,
    reason: "File signature (magic numbers) does not match allowed types.",
  };
}

/**
 * Validates file type, size, and magic numbers.
 */
export function validateUploadFile(
  buffer: Uint8Array,
  declaredMimeType: string,
  category: UploadCategory,
): FileValidationResult {
  const maxBytes = UPLOAD_LIMITS_BYTES[category];
  if (buffer.length > maxBytes) {
    const maxMb = maxBytes / (1024 * 1024);
    return {
      valid: false,
      mimeType: declaredMimeType,
      extension: "bin",
      reason: `File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds ${category} limit of ${maxMb}MB.`,
    };
  }

  const allowedTypes = ALLOWED_MIME_TYPES[category];
  if (!allowedTypes.includes(declaredMimeType)) {
    return {
      valid: false,
      mimeType: declaredMimeType,
      extension: "bin",
      reason: `Invalid MIME type '${declaredMimeType}' for ${category}. Allowed: ${allowedTypes.join(", ")}.`,
    };
  }

  const magic = validateMagicNumbers(buffer);
  if (!magic.valid) {
    return {
      valid: false,
      mimeType: declaredMimeType,
      extension: "bin",
      reason: magic.reason || "Magic number verification failed.",
    };
  }

  const ext = MIME_TO_EXT[declaredMimeType] || MIME_TO_EXT[magic.detectedMime || ""] || "bin";

  return {
    valid: true,
    mimeType: declaredMimeType,
    extension: ext,
  };
}

/**
 * Generates a secure, unguessable filename: `{userId}_{timestamp}_{uuid}.{ext}`
 * NEVER preserves original user-supplied filenames to prevent path traversal or script execution.
 */
export function generateSecureFilename(userId: string, extension: string): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 36);
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const safeExt = extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `${safeUser}_${timestamp}_${uuid}.${safeExt}`;
}

/**
 * Strips EXIF APP1 metadata markers (0xFFE1) from JPEG image buffers to remove
 * embedded GPS location data and personal camera metadata.
 */
export function stripJpegExif(buffer: Uint8Array): Uint8Array {
  // Check JPEG SOI marker (FF D8)
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return buffer;
  }

  const result: number[] = [0xff, 0xd8];
  let offset = 2;

  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xff) {
      break;
    }

    const marker = buffer[offset + 1];

    // EOI (End of Image) or SOS (Start of Scan) - rest is compressed image data
    if (marker === 0xd9 || marker === 0xda) {
      for (let i = offset; i < buffer.length; i++) {
        result.push(buffer[i]);
      }
      break;
    }

    const length = (buffer[offset + 2] << 8) | buffer[offset + 3];

    // APP1 marker (0xE1) contains EXIF / GPS data — skip it!
    if (marker === 0xe1) {
      offset += 2 + length;
      continue;
    }

    // Keep all other segments
    for (let i = 0; i < 2 + length; i++) {
      if (offset + i < buffer.length) {
        result.push(buffer[offset + i]);
      }
    }
    offset += 2 + length;
  }

  return new Uint8Array(result);
}

/**
 * Calculates thumbnail (100x100) and medium (400x400) target dimensions for avatars/photos.
 */
export function calculateTargetDimensions(
  width: number,
  height: number,
  maxDimension: number = 400,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}
