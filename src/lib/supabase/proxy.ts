// Session-refresh helper used by the root proxy.ts on every request.
//
// In Next.js 16 the file convention "middleware" was renamed to "proxy" — most
// Supabase docs still say "middleware" but the underlying request/response
// handling is identical. This helper is what the root proxy.ts file calls.
//
// What it does:
//   - Reads cookies from the incoming request
//   - Creates a Supabase server client wired to those cookies
//   - Calls supabase.auth.getUser() which automatically refreshes the access
//     token if it has expired
//   - Writes any updated cookies onto the outgoing response so the browser
//     stays in sync
//
// Per Supabase docs, getUser() (not getSession()) is required for auth
// decisions because getSession() reads from the cookie without verifying the
// token against the auth server.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

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

  // Triggers a token refresh if the access token has expired. The new tokens
  // are written to the response cookies via setAll above.
  await supabase.auth.getUser();

  return response;
}
