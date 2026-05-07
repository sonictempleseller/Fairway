"use server";

// Server Actions for authentication. Called from <form action={...}>.
// Each runs on the server, talks to Supabase, then redirects.
//
// On error we redirect back to the form with ?error=... in the URL so the
// page can display it. Keeping the forms as Server Components (no
// useActionState) makes this much simpler for a small app.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Something went wrong. Please try again.";
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("Email and password are required"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(errorMessage(error)));
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/signup?error=" + encodeURIComponent("Email and password are required"));
  }
  if (password.length < 6) {
    redirect("/signup?error=" + encodeURIComponent("Password must be at least 6 characters"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect("/signup?error=" + encodeURIComponent(errorMessage(error)));
  }

  // With email confirmation OFF in Supabase, signUp returns an active session,
  // so the user is logged in immediately.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

// Student-side signup. Same shape as signup() above but tags the user as
// a 'student' in their profile (via raw_user_meta_data.user_type) and
// redeems the invitation token immediately afterwards so the auth user is
// linked to the coach's roster row.
export async function signupWithInvite(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const token = String(formData.get("invite_token") ?? "").trim();

  const back = `/invite/${token}`;

  if (!token) {
    redirect("/?error=" + encodeURIComponent("Missing invitation token"));
  }
  if (!email || !password) {
    redirect(`${back}?error=` + encodeURIComponent("Email and password are required"));
  }
  if (password.length < 6) {
    redirect(`${back}?error=` + encodeURIComponent("Password must be at least 6 characters"));
  }

  const supabase = await createClient();
  const { error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { user_type: "student" } },
  });

  if (signUpErr) {
    redirect(`${back}?error=` + encodeURIComponent(errorMessage(signUpErr)));
  }

  // The signup just established a session. Use it to redeem the invite.
  const { error: rpcErr } = await supabase.rpc("redeem_invitation", {
    invite_token: token,
  });

  if (rpcErr) {
    // The student is now signed up but unlinked. Surface the error so they
    // can ask the coach for a fresh invite — their account still exists.
    redirect(`${back}?error=` + encodeURIComponent(errorMessage(rpcErr)));
  }

  revalidatePath("/", "layout");
  redirect("/me");
}
