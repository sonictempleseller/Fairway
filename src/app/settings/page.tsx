import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/actions/profile";

type ProfileRow = { display_name: string | null };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .maybeSingle<ProfileRow>();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear in Fairway.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="display_name" className="text-sm font-medium">Display name</label>
              <Input
                id="display_name"
                name="display_name"
                type="text"
                placeholder="e.g. Coach Kellen"
                defaultValue={profile?.display_name ?? ""}
                maxLength={80}
              />
              <p className="text-xs text-muted-foreground">
                Shown on your dashboard. Leave blank to use your email username.
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && <p className="text-sm text-emerald-600">Saved.</p>}

            <Button type="submit" className="self-start">Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Read-only for now.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{user?.email}</span>
        </CardContent>
      </Card>
    </main>
  );
}
