"use server";

// Server Actions for managing students. Called from <form action={...}>.
// RLS on the students table ensures the row is only writable by the
// coach whose auth.uid() matches coach_id.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

export async function createStudent(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const handicapRaw = String(formData.get("handicap") ?? "").trim();
  const handicap = Number.parseInt(handicapRaw, 10);

  if (!name) {
    redirect("/students/new?error=" + encodeURIComponent("Name is required"));
  }
  if (Number.isNaN(handicap) || handicap < 0 || handicap > 54) {
    redirect("/students/new?error=" + encodeURIComponent("Handicap must be a number between 0 and 54"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("students").insert({
    coach_id: user.id,
    name,
    handicap,
  });

  if (error) {
    redirect("/students/new?error=" + encodeURIComponent(errorMessage(error)));
  }

  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect("/students");
}

export async function updateStudent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const handicapRaw = String(formData.get("handicap") ?? "").trim();
  const handicap = Number.parseInt(handicapRaw, 10);

  if (!id) redirect("/students");
  const back = `/students/${id}/edit`;

  if (!name) {
    redirect(`${back}?error=` + encodeURIComponent("Name is required"));
  }
  if (Number.isNaN(handicap) || handicap < 0 || handicap > 54) {
    redirect(`${back}?error=` + encodeURIComponent("Handicap must be a number between 0 and 54"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ name, handicap })
    .eq("id", id);

  if (error) {
    redirect(`${back}?error=` + encodeURIComponent(errorMessage(error)));
  }

  revalidatePath(`/students/${id}`);
  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect(`/students/${id}`);
}

export async function deleteStudent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    redirect("/students");
  }

  const supabase = await createClient();
  // RLS prevents deleting another coach's student even if id is guessed.
  await supabase.from("students").delete().eq("id", id);

  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect("/students");
}
