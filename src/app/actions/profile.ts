"use server";

// Server Actions for the coach's own profile.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
