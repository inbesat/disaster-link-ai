import { createClient } from "@/lib/supabase/client";
import {
  validateUploadFile,
  generateSecureFilename,
  stripJpegExif,
  type UploadCategory,
} from "@/lib/security/upload-security";

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour for sensitive documents

/**
 * Validates, strips metadata, renames, and uploads a file to a Supabase Storage bucket.
 */
async function uploadToBucket(
  bucket: string,
  folder: string,
  file: File,
  category: UploadCategory,
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = new Uint8Array(arrayBuffer);

  const validation = validateUploadFile(rawBuffer, file.type, category);
  if (!validation.valid) {
    throw new Error(validation.reason || "File validation failed.");
  }

  // Strip EXIF metadata from JPEG photos
  let buffer: Uint8Array = rawBuffer;
  if (file.type === "image/jpeg") {
    buffer = stripJpegExif(rawBuffer);
  }

  const supabase = createClient();
  const fileName = `${folder}/${generateSecureFilename(folder, validation.extension)}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, { contentType: validation.mimeType, upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  if (!data.publicUrl) {
    throw new Error(`Upload succeeded but bucket "${bucket}" is private.`);
  }
  return data.publicUrl;
}

/**
 * Generates a temporary signed URL for sensitive documents expiring in 1 hour.
 */
export async function getSignedDocumentUrl(
  bucket: string,
  filePath: string,
  expiresInSeconds: number = SIGNED_URL_EXPIRY_SECONDS,
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message || "Unknown error"}`);
  }
  return data.signedUrl;
}

/**
 * Uploads a user avatar to the `user-avatars` bucket, namespaced by userId.
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadToBucket("user-avatars", userId, file, "avatar");
}

/**
 * Uploads a disaster image to the `disaster-images` bucket, namespaced by eventId.
 */
export async function uploadDisasterImage(
  file: File,
  eventId: string,
): Promise<string> {
  return uploadToBucket("disaster-images", eventId, file, "image");
}

/**
 * Uploads a shelter photo to the `shelter-photos` bucket.
 */
export async function uploadShelterPhoto(file: File): Promise<string> {
  return uploadToBucket("shelter-photos", "shelters", file, "image");
}

/**
 * Uploads an SOP document to the `document-files` bucket, namespaced by docId.
 */
export async function uploadSOPDocument(
  file: File,
  docId: string,
): Promise<string> {
  return uploadToBucket("document-files", docId, file, "document");
}
