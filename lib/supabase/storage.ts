import { createClient } from "@/lib/supabase/client";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: File, allowedTypes: string[]): void {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}`
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }
  // Check file extension matches MIME type
  const ext = file.name.split(".").pop()?.toLowerCase();
  const mimeToExt: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
    "image/gif": ["gif"],
  };
  const allowedExts = mimeToExt[file.type] ?? [];
  if (ext && allowedExts.length > 0 && !allowedExts.includes(ext)) {
    throw new Error(`File extension .${ext} does not match type ${file.type}`);
  }
}

/**
 * Uploads a shelter photo to the `shelters` storage bucket and returns its
 * public URL (to persist in the `Shelter.imageUrl` field).
 */
export async function uploadShelterPhoto(file: File): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES);

  const supabase = createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `shelter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const { error } = await supabase.storage
    .from("shelters")
    .upload(fileName, file, { upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("shelters").getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Uploads an avatar / organization logo to the `avatars` storage bucket.
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  validateFile(file, ALLOWED_IMAGE_TYPES);

  const supabase = createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const fileName = `${userId}-${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
  return data.publicUrl;
}
