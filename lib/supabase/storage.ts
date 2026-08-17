import { createClient } from "@/lib/supabase/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MIME_TO_EXT: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "application/pdf": ["pdf"],
};

function validateFile(file: File, allowedTypes: string[]): void {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}`,
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    );
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = MIME_TO_EXT[file.type] ?? [];
  if (ext && allowedExts.length > 0 && !allowedExts.includes(ext)) {
    throw new Error(`File extension .${ext} does not match type ${file.type}`);
  }
}

/**
 * Uploads a file to a Supabase Storage bucket and returns its public URL.
 * Throws if the upload fails or the bucket is private (no public URL).
 */
async function uploadToBucket(
  bucket: string,
  folder: string,
  file: File,
  allowedTypes: string[],
): Promise<string> {
  validateFile(file, allowedTypes);

  const supabase = createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: false });

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
 * Uploads a user avatar to the `user-avatars` bucket, namespaced by userId.
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  return uploadToBucket("user-avatars", userId, file, IMAGE_TYPES);
}

/**
 * Uploads a disaster image to the `disaster-images` bucket, namespaced by eventId.
 */
export async function uploadDisasterImage(
  file: File,
  eventId: string,
): Promise<string> {
  return uploadToBucket("disaster-images", eventId, file, IMAGE_TYPES);
}

/**
 * Uploads a shelter photo to the `shelter-photos` bucket.
 */
export async function uploadShelterPhoto(file: File): Promise<string> {
  return uploadToBucket("shelter-photos", "shelters", file, IMAGE_TYPES);
}

/**
 * Uploads an SOP document to the `document-files` bucket, namespaced by docId.
 */
export async function uploadSOPDocument(
  file: File,
  docId: string,
): Promise<string> {
  return uploadToBucket("document-files", docId, file, DOCUMENT_TYPES);
}
