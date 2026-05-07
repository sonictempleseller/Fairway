import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { type Student } from "@/lib/students";
import { type Lesson, formatLessonOccurredAt, formatLessonTime } from "@/lib/lessons";

type ProfileRow = { display_name: string | null };

type RecentLessonRow = Lesson & { student: { id: string; name: string; handicap: number } | null };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nowIso = new Date().toISOString();

  // Load profile, students, recent (logged) lessons, and upcoming (scheduled) in parallel.
  const [profileRes, studentsRes, recentRes, upcomingRes] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle<ProfileRow>(),
    supabase.from("students").select("*").returns<Student[]>(),
    supabase
      .from("lessons")
      .select("*, student:students(id, name, handicap)")
      .eq("status", "logged")
      .order("occurred_at", { ascending: false })
      .limit(4)
      .returns<RecentLessonRow[]>(),
    supabase
      .from("lessons")
      .select("*, student:students(id, name, handicap)")
      .eq("status", "scheduled")
      .gte("occurred_at", nowIso)
      .order("occurred_at", { ascending: true })
      .limit(4)
      .returns<RecentLessonRow[]>(),
  ]);

  if (studentsRes.error) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="text-destructive">Could not load dashboard: {studentsRes.error.message}</p>
      </main>
    );
  }

  const list = studentsRes.data ?? [];
  const recentLessons = recentRes.data ?? [];
  const upcomingLessons = upcomingRes.data ?? [];
  const displayName = profileRes.data?.display_name?.trim();
  const greetingName = displayName || user?.email?.split("@")[0] || "Coach";

  // Empty state — first-time user, no students yet.
  if (list.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome to Fairway, {greetingName}.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Let&apos;s get started</CardTitle>
            <CardDescription>
              Your dashboard will fill up as you add students and log lessons. Start by adding your first student.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/students/new">Add your first student</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Stats from real data.
  const totalLessons = list.reduce((sum, s) => sum + s.total_lessons, 0);
  const avgHandicap = Math.round(
    list.reduce((sum, s) => sum + s.handicap, 0) / list.length,
  );

  const stats = [
    { label: "Total students", value: list.length },
    { label: "Lessons given", value: totalLessons },
    { label: "Avg handicap", value: avgHandicap },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, {greetingName}</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-4xl font-bold">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{stat.label}</CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming (scheduled) */}
      {upcomingLessons.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Upcoming</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/calendar">Calendar</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={lesson.student ? `/students/${lesson.student.id}` : "/students"}
                className="group"
              >
                <Card className="border border-emerald-300 dark:border-emerald-900 transition-colors group-hover:bg-emerald-50/40">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {lesson.student?.name ?? "Unknown student"}
                    </CardTitle>
                    <CardDescription>
                      {formatLessonOccurredAt(lesson.occurred_at)} · {formatLessonTime(lesson.occurred_at)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent lessons (logged) */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Recent lessons</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/students">View all</Link>
        </Button>
      </div>

      {recentLessons.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>
              No lessons logged yet. Open a student&apos;s profile to log one.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recentLessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={lesson.student ? `/students/${lesson.student.id}` : "/students"}
              className="group"
            >
              <Card className="transition-colors group-hover:bg-muted/40">
                <CardHeader>
                  <CardTitle className="text-base">
                    {lesson.student?.name ?? "Unknown student"}
                  </CardTitle>
                  <CardDescription>
                    {formatLessonOccurredAt(lesson.occurred_at)}
                  </CardDescription>
                </CardHeader>
                {lesson.notes && (
                  <CardContent className="text-sm text-muted-foreground line-clamp-2">
                    {lesson.notes}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Export — downloads CSV files of your data */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-1">Export data</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Download your data as a spreadsheet. One file per type.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" asChild>
            <a href="/api/export/students" download>Export students.csv</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/export/lessons" download>Export lessons.csv</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
