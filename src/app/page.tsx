import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Soft brand gradient backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-background to-background dark:from-emerald-950/40 dark:via-background dark:to-background"
        />
        {/* Subtle grid texture */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:40px_40px]"
        />

        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Built for teaching pros
          </div>

          {/* Brand wordmark — the big FAIRWAY */}
          <h1 className="mt-6 text-7xl font-bold tracking-tight text-foreground sm:text-8xl lg:text-[9rem] lg:leading-none">
            Fair<span className="text-emerald-700 dark:text-emerald-400">way</span>
          </h1>

          {/* Supporting tagline */}
          <p className="mt-6 max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Modern tools for golf teaching pros.
          </p>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Manage your students, log lessons while they&apos;re fresh, track progress, and own
            your data — in one clean place.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            {user ? (
              <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link href="/signup">Get started — it&apos;s free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature trio */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title="Roster in one place"
            description="Every student, their handicap, and their lesson history at a glance — searchable and ready to share."
          />
          <Feature
            title="Log lessons in seconds"
            description="Record what you worked on while it's fresh. Your dashboard surfaces what's recent without effort."
          />
          <Feature
            title="Own your data"
            description="Export to CSV anytime. Your roster and lesson history go with you, no lock-in."
          />
        </div>
      </section>

      {/* CTA strip */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-50 to-background dark:from-emerald-950/30 dark:to-background p-10 sm:p-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Spend more time coaching.
          </h2>
          <p className="mt-3 text-muted-foreground sm:text-lg">
            Stop juggling spreadsheets, sticky notes, and screenshots.
          </p>
          <div className="mt-8 flex justify-center">
            {user ? (
              <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/signup">Create your account</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md min-w-0">
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60">
        <span className="size-2.5 rounded-full bg-emerald-500" />
      </div>
      <h3 className="font-semibold text-foreground text-base mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
