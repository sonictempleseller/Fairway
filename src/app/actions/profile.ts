"use server";

// Server Actions for the coach's own profile.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

export async function updateProfile(formData: FormData) {
  const displayNameRaw = String(formData.get("display_name") ?? "").trim();
  const displayName = displayNameRaw.length > 0 ? displayNameRaw : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(errorMessage(error)));
  }

  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("photo");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/settings?error=" + encodeURIComponent("Please choose an image file"));
  }
  // The above instanceof guard narrows for TS; assert for clarity below.
  const photo = file as File;

  if (photo.size > MAX_AVATAR_BYTES) {
    redirect("/settings?error=" + encodeURIComponent("File is larger than 5 MB"));
  }
  if (!ALLOWED_AVATAR_TYPES.has(photo.type)) {
    redirect("/settings?error=" + encodeURIComponent("File must be JPG, PNG, or WebP"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Path is <user.id>/avatar.<ext>. Storage RLS ensures users can only
  // write to their own folder. upsert=true overwrites any previous file.
  const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("avatars")
    .upload(path, photo, { upsert: true, contentType: photo.type });

  if (uploadErr) {
    redirect("/settings?error=" + encodeURIComponent(errorMessage(uploadErr)));
  }

  // Public URL + cache-busting query string so the browser sees the new image
  // immediately after re-uploading.
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);

  if (profileErr) {
    redirect("/settings?error=" + encodeURIComponent(errorMessage(profileErr)));
  }

  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Delete every object under the user's folder (covers any extension).
  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files && files.length > 0) {
    await supabase.storage
      .from("avatars")
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);

  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}
