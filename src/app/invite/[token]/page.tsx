import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { signupWithInvite } from "@/app/actions/auth";

type LookupRow = {
  invitation_id: string;
  coach_display_name: string;
  student_name: string;
  expires_at: string;
  redeemed: boolean;
};

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const { token } = await params;
  const { error, mode } = await searchParams;

  const supabase = await createClient();

  // Use the public lookup_invitation RPC (SECURITY DEFINER) so anonymous
  // visitors can see basic invite details without us exposing the table.
  const { data, error: lookupErr } = await supabase
    .rpc("lookup_invitation", { invite_token: token })
    .returns<LookupRow[]>();

  const invite = Array.isArray(data) ? data[0] : null;

  if (lookupErr || !invite) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-20">
        <Card>
          <CardHeader>
            <CardTitle>Invitation not found</CardTitle>
            <CardDescription>
              This link is invalid or has been revoked. Ask your coach to send a new one.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const expired = new Date(invite.expires_at) < new Date();

  if (invite.redeemed) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-20">
        <Card>
          <CardHeader>
            <CardTitle>Already used</CardTitle>
            <CardDescription>
              This invitation has already been redeemed. Sign in to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (expired) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-20">
        <Card>
          <CardHeader>
            <CardTitle>Invitation expired</CardTitle>
            <CardDescription>
              This link has expired. Ask {invite.coach_display_name} to send a fresh one.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  // If the visitor is already signed in we can't transparently make them a
  // student of this coach (their existing identity might be a different
  // person). Tell them to sign out first.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    return (
      <main className="mx-auto w-full max-w-md px-6 py-20">
        <Card>
          <CardHeader>
            <CardTitle>Already signed in</CardTitle>
            <CardDescription>
              You&apos;re signed in as {user.email}. To accept an invitation, sign out first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-20">
      <Card>
        <CardHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            You&apos;ve been invited
          </div>
          <CardTitle className="text-2xl mt-3">
            Join {invite.coach_display_name} on Fairway
          </CardTitle>
          <CardDescription>
            {invite.coach_display_name} added you to their roster as{" "}
            <span className="text-foreground">{invite.student_name}</span>. Create your account
            to see your lessons, schedule, and chat with your coach.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signupWithInvite} className="flex flex-col gap-4">
            <input type="hidden" name="invite_token" value={token} />

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">At least 6 characters.</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              Create account &amp; join
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-1">
              Already have a Fairway account?{" "}
              <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} className="text-foreground underline-offset-4 hover:underline">
                Sign in
              </Link>{" "}
              first, then come back to this link.
            </p>
            {/* mode is reserved for a future "redeem-only" path when an existing
                user accepts an invite. For now this is unused. */}
            {mode === "redeem" && null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
