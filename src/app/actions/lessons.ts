"use server";

// Server Actions for managing lessons. Inserts / deletes here trigger the
// on_lesson_change DB trigger which keeps students.total_lessons and
// students.last_lesson_at in sync (logged lessons only).

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
  const occurredAtIso = String(formData.get("occurred_at") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "scheduled");
  const status = statusRaw === "logged" ? "logged" : "scheduled";

  const durationRaw = String(formData.get("duration_minutes") ?? "60");
  const duration = Math.max(1, Math.min(600, Number.parseInt(durationRaw, 10) || 60));

  // Where to redirect on error: scheduling flow → /lessons/new, log flow →
  // student profile.
  const errorBack =
    status === "scheduled"
      ? "/lessons/new"
      : studentId
        ? `/students/${studentId}`
        : "/students";

  if (!studentId) {
    redirect("/lessons/new?error=" + encodeURIComponent("Please pick a student"));
  }
  if (!occurredAtIso) {
    redirect(`${errorBack}?error=` + encodeURIComponent("Date and time are required"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("lessons").insert({
    student_id: studentId,
    coach_id: user.id,
    occurred_at: occurredAtIso,
    duration_minutes: duration,
    status,
    notes: notes || null,
  });

  if (error) {
    redirect(`${errorBack}?error=` + encodeURIComponent(errorMessage(error)));
  }

  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");

  // After scheduling → return to the calendar so the new block is visible.
  // After logging   → return to the student profile so the new entry shows up.
  redirect(status === "scheduled" ? "/calendar" : `/students/${studentId}`);
}

export async function deleteLesson(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  if (!id) redirect("/students");

  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", id);

  revalidatePath("/students");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  if (studentId) revalidatePath(`/students/${studentId}`);
  redirect(studentId ? `/students/${studentId}` : "/calendar");
}
