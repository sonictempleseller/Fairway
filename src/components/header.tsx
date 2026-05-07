import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

type ProfileRow = { display_name: string | null };

// Async Server Component — calls Supabase to find out who is signed in
// and what their preferred display name is.
export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();
    displayName = data?.display_name?.trim() || null;
  }

  const headerLabel = displayName || user?.email || "";

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 gap-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
          Fairway
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-sm font-medium text-muted-foreground">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/students" className="hover:text-foreground transition-colors">
                Students
              </Link>
              <Link href="/calendar" className="hover:text-foreground transition-colors">
                Calendar
              </Link>
              <Link href="/settings" className="hover:text-foreground transition-colors hidden sm:inline">
                Settings
              </Link>
              <span className="hidden md:inline text-foreground/70 truncate max-w-[200px]">
                {headerLabel}
              </span>
              <form action={signout}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
