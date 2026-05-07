import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

// Async Server Component — calls Supabase to find out who is signed in.
export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 gap-4">
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
              <span className="hidden sm:inline text-foreground/70 truncate max-w-[200px]">
                {user.email}
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
