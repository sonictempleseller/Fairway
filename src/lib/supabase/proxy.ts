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
//   5. Writes any updated cookies onto the outgoing response

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require a signed-in user. Anything not listed here is public
// (homepage, login, signup, static assets, etc.).
const PROTECTED_PREFIXES = ["/dashboard", "/students", "/calendar", "/lessons", "/settings"];

// Routes that are pointless to show a signed-in user. We bounce them to /dashboard.
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
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
