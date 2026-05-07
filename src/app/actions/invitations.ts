"use server";

// Server Actions for student invitations.
//
// createInvitation: coach generates a one-time link to invite a roster student
//                   to claim their account on Fairway.
// revokeInvitation: coach kills an outstanding invitation.
// redeemInvitation: a freshly-signed-up student redeems a token, linking
//                   their auth user to the coach's roster row.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

function generateToken(): string {
  // 32 bytes -> 43-char URL-safe base64. Plenty of entropy, fits in a URL.
  return randomBytes(32).toString("base64url");
}

export async function createInvitation(formData: FormData) {
  const studentId = String(formData.get("student_id") ?? "");
  const email = String(formData.get("email") ?? "").trim() || null;

  if (!studentId) redirect("/students");
  const back = `/students/${studentId}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const token = generateToken();

  const { error } = await supabase.from("student_invitations").insert({
    coach_id: user.id,
    student_id: studentId,
    token,
    email,
  });

  if (error) {
    redirect(`${back}?error=` + encodeURIComponent(errorMessage(error)));
  }

  revalidatePath(back);
  redirect(back);
}

export async function revokeInvitation(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const studentId = String(formData.get("student_id") ?? "");
  if (!id || !studentId) redirect("/students");

  const supabase = await createClient();
  await supabase.from("student_invitations").delete().eq("id", id);

  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

// Called from the student-side signup flow once they've authenticated.
// Wraps the SECURITY DEFINER redeem_invitation() Postgres function which
// links students.user_id to the new auth user atomically.
export async function redeemInvitation(token: string): Promise<
  { ok: true; studentId: string; coachId: string } | { ok: false; error: string }
> {
  if (!token) return { ok: false, error: "Missing invitation token" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_invitation", {
    invite_token: token,
  });
  if (error) return { ok: false, error: errorMessage(error) };

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.student_id) return { ok: false, error: "Invitation could not be redeemed" };

  return { ok: true, studentId: String(row.student_id), coachId: String(row.coach_id) };
}
