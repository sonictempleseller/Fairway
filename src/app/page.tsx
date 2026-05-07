import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold tracking-tight text-foreground sm:text-7xl">
        Fairway
      </h1>
      <p className="mt-4 text-xl text-muted-foreground sm:text-2xl">
        Modern tools for teaching professionals
      </p>
      <div className="mt-10">
        <Button size="lg" asChild>
          <Link href={user ? "/dashboard" : "/signup"}>Get started</Link>
        </Button>
      </div>
    </main>
  );
}
