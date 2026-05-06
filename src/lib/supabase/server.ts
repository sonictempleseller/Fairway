// Supabase client for use on the server (Server Components, Server Actions, Route Handlers).
//
// IMPORTANT: in Next.js 16 the cookies() function is async — we must await it.
//
// IMPORTANT: per the @supabase/ssr docs, ALWAYS create a fresh client per request.
// Never share a single instance between requests, or you risk leaking sessions
// across users.
//
// Usage:
//   import { createClient } from "@/lib/supabase/server";
//   const supabase = await createClient();
//   const { data: { user } } = await supabase.auth.getUser();

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Setting cookies from a Server Component throws — that's expected.
            // The proxy.ts at the project root handles cookie refresh, so this
            // catch is intentional and safe to swallow.
          }
        },
      },
    },
  );
}
