"use server";

// Server Actions for managing lessons. Inserts / deletes here trigger the
// on_lesson_change DB trigger which keeps students.total_lessons and
// students.last_lesson_at in sync automatically.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

export async function createLesson(formData: FormData) {
  const studentId = String(formData.get("student_id") ?? "");
  const occurredAtRaw = String(formData.get("occurred_at") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studentId) {
    redirect("/students");
  }

  const back = `/students/${studentId}`;

  if (!occurredAtRaw) {
    redirect(`${back}?error=` + encodeURIComponent("Lesson date is required"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // <input type="date"> gives YYYY-MM-DD; Postgres can cast that to timestamptz.
  const { error } = await supabase.from("lessons").insert({
    student_id: studentId,
    coach_id: user.id,
    occurred_at: occurredAtRaw,
    notes: notes || null,
  });

  if (error) {
    redirect(`${back}?error=` + encodeURIComponent(errorMessage(error)));
  }

  revalidatePath(back);
  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect(back);
}

export async function deleteLesson(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  if (!id || !studentId) redirect("/students");

  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", id);

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect(`/students/${studentId}`);
}
