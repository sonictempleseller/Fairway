import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { type Student, handicapLabel, formatLessonDate } from "@/lib/students";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .returns<Student[]>();

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-destructive">Could not load dashboard: {error.message}</p>
      </main>
    );
  }

  const list = students ?? [];

  // Empty state — first-time user, no students yet.
  if (list.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Welcome to Fairway{user?.email ? "" : ""}.</p>
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

  // Compute stats from real data.
  const totalLessons = list.reduce((sum, s) => sum + s.total_lessons, 0);
  const avgHandicap = Math.round(
    list.reduce((sum, s) => sum + s.handicap, 0) / list.length,
  );
  const recentStudents = [...list]
    .filter((s) => s.last_lesson_at !== null)
    .sort((a, b) => (b.last_lesson_at ?? "").localeCompare(a.last_lesson_at ?? ""))
    .slice(0, 4);

  const stats = [
    { label: "Total students", value: list.length },
    { label: "Lessons given", value: totalLessons },
    { label: "Avg handicap", value: avgHandicap },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, Coach</p>
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

      {/* Recent lessons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Recent lessons</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/students">View all</Link>
        </Button>
      </div>

      {recentStudents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardDescription>
              No lessons logged yet. Lesson tracking is coming soon.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recentStudents.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle>{student.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground flex flex-col gap-1">
                <span>
                  {handicapLabel(student.handicap)} · Handicap {student.handicap}
                </span>
                <span>Last lesson: {formatLessonDate(student.last_lesson_at)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
