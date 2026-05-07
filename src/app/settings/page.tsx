import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/avatar";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, uploadAvatar, removeAvatar } from "@/app/actions/profile";

type ProfileRow = { display_name: string | null; avatar_url: string | null };

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
    .select("display_name, avatar_url")
    .eq("id", user!.id)
    .maybeSingle<ProfileRow>();

  const displayName = profile?.display_name ?? "";
  const avatarUrl = profile?.avatar_url ?? null;
  const labelName = displayName || user?.email || "";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account.</p>
      </div>

      {/* Photo card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
          <CardDescription>JPG, PNG, or WebP. 5 MB max.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 flex-wrap">
            <Avatar src={avatarUrl} name={labelName} size="lg" />
            <div className="flex flex-col gap-3">
              <form action={uploadAvatar} className="flex items-center gap-3 flex-wrap">
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  className="text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
                />
                <Button type="submit" size="sm">Upload</Button>
              </form>
              {avatarUrl && (
                <form action={removeAvatar}>
                  <Button type="submit" variant="ghost" size="sm">Remove photo</Button>
                </form>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile info card */}
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
                defaultValue={displayName}
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
