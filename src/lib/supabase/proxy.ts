// Session-refresh + route-gating helper used by the root proxy.ts on every request.
//
// In Next.js 16 the file convention "middleware" was renamed to "proxy" — most
// Supabase docs still say "middleware" but the underlying request/response
// handling is identical. This helper is what the root proxy.ts file calls.
//
// What it does:
//   1. Reads cookies from the incoming request and creates a Supabase server client
//   2. Calls supabase.auth.getUser() — refreshes the access token if expired
//      AND verifies the user against Supabase's auth server (per Supabase docs,
//      getUser is required for any authorization check)
//   3. Redirects unauthenticated visitors away from protected routes
//   4. Redirects already-signed-in visitors away from /login and /signup
//   5. Routes between coach (/dashboard) and student (/me) home pages by user_type
//   6. Writes any updated cookies onto the outgoing response

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require a signed-in user (any user_type). Settings is shared.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/students",
  "/calendar",
  "/lessons",
  "/settings",
  "/me",
];

// Routes that only coaches should access. Students hitting these get bounced
// to /me.
const COACH_ONLY_PREFIXES = ["/dashboard", "/students", "/calendar", "/lessons"];

// Routes only students should access. Coaches hitting these get bounced to
// /dashboard.
const STUDENT_ONLY_PREFIXES = ["/me"];

// Routes that are pointless to show a signed-in user.
const SIGNED_IN_REDIRECT_AWAY_FROM = ["/login", "/signup"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the token if needed AND verifies the session with the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Gate protected routes — kick anonymous visitors to /login.
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Bounce signed-in users away from auth pages.
  if (user && SIGNED_IN_REDIRECT_AWAY_FROM.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard"; // /dashboard handler will further redirect students -> /me
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Role-aware routing. We need to know the user's role to redirect, but
  // calling Supabase here makes proxy slow. We fetch user_type lazily —
  // only when the path is one of the role-gated prefixes.
  if (user) {
    const isCoachOnly = COACH_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
    const isStudentOnly = STUDENT_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

    if (isCoachOnly || isStudentOnly) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .maybeSingle<{ user_type: string }>();

      const role = profile?.user_type ?? "coach";

      if (isCoachOnly && role === "student") {
        const url = request.nextUrl.clone();
        url.pathname = "/me";
        url.search = "";
        return NextResponse.redirect(url);
      }
      if (isStudentOnly && role === "coach") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}
