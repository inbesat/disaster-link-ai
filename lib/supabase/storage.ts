import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a shelter photo to the `shelters` storage bucket and returns its
 * public URL (to persist in the `Shelter.imageUrl` field).
 *
 * NOTE: the `shelters` bucket must exist in Supabase Storage (and have public
 * read access) for the returned URL to be accessible.
 */
export async function uploadShelterPhoto(file: File): Promise<string> {
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
 * Renames the file to `userId-timestamp.ext` to prevent overwrites and
 * cache collisions, then returns its public URL.
 *
 * NOTE: the `avatars` bucket must exist in Supabase Storage (and have
 * public read access) for the returned URL to be accessible.
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
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
