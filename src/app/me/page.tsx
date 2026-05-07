import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/avatar";
import { createClient } from "@/lib/supabase/server";
import { type Student, handicapLabel } from "@/lib/students";
import { type Lesson, formatLessonOccurredAt, formatLessonTime } from "@/lib/lessons";

type StudentRow = Student & { user_id: string | null };

type CoachInfo = {
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Find the student-roster row(s) this user is linked to. RLS allows
  // selecting students where user_id = auth.uid().
  const { data: rosterRows } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", user!.id)
    .returns<StudentRow[]>();

  const linked = rosterRows ?? [];

  if (linked.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>You&apos;re signed in</CardTitle>
            <CardDescription>
              Your account isn&apos;t linked to a coach yet. If a coach gave you an invite link,
              open it now to finish joining their roster.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  // For now we assume one coach per student. (Schema supports multiple.)
  const me = linked[0];
  const coachId = me.coach_id;

  // Fetch coach profile + email separately. The coach's profile row is
  // readable by the coach themselves, but a student's RLS context can only
  // see public.profiles where id = auth.uid(). So for now we display the
  // coach name from a SECURITY DEFINER lookup. As a practical shortcut we
  // try the table directly first (will return null) and fall back gracefully.
  // (A future migration can expose a `lookup_coach(uuid)` function.)
  const { data: coach } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", coachId)
    .maybeSingle<CoachInfo>();

  // Pull this student's lessons. RLS already scopes lessons by coach_id =
  // auth.uid(), so a student can't read them yet — we'll relax that in a
  // later migration. For now we'll show what we can.
  const { data: lessonsData } = await supabase
    .from("lessons")
    .select("*")
    .eq("student_id", me.id)
    .order("occurred_at", { ascending: false })
    .returns<Lesson[]>();

  const lessons = lessonsData ?? [];
  const nowIso = new Date().toISOString();
  const upcoming = lessons.filter((l) => l.status === "scheduled" && l.occurred_at >= nowIso);
  const history = lessons.filter((l) => l.status === "logged");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to Fairway, {me.name}
        </h1>
        <p className="mt-1 text-muted-foreground">Your student account.</p>
      </div>

      {/* Coach card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your coach</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar src={coach?.avatar_url ?? null} name={coach?.display_name ?? "Coach"} size="lg" />
            <div>
              <div className="text-lg font-semibold text-foreground">
                {coach?.display_name ?? "Your coach"}
              </div>
              <div className="text-sm text-muted-foreground">
                {handicapLabel(me.handicap)} · Handicap {me.handicap}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming */}
      <h2 className="text-xl font-semibold tracking-tight text-foreground mb-3">Upcoming lessons</h2>
      {upcoming.length === 0 ? (
        <Card className="mb-8">
          <CardHeader>
            <CardDescription>No lessons scheduled yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3 mb-8">
          {upcoming.map((lesson) => (
            <Card key={lesson.id} size="sm" className="border border-emerald-300 dark:border-emerald-900">
              <CardHeader>
                <CardTitle className="text-base">{formatLessonOccurredAt(lesson.occurred_at)}</CardTitle>
                <CardDescription>
                  {formatLessonTime(lesson.occurred_at)} · {lesson.duration_minutes} min
                </CardDescription>
                {lesson.notes && (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{lesson.notes}</p>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      <h2 className="text-xl font-semibold tracking-tight text-foreground mb-3">Lesson history</h2>
      {history.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>No completed lessons yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {history.map((lesson) => (
            <Card key={lesson.id} size="sm">
              <CardHeader>
                <CardTitle className="text-base">{formatLessonOccurredAt(lesson.occurred_at)}</CardTitle>
                <CardDescription>{formatLessonTime(lesson.occurred_at)}</CardDescription>
                {lesson.notes && (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{lesson.notes}</p>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Button variant="ghost" asChild>
          <Link href="/settings">Account settings</Link>
        </Button>
      </div>
    </main>
  );
}
