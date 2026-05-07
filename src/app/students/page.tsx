import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { type Student, handicapLabel, formatLessonDate } from "@/lib/students";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Student[]>();

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="text-destructive">Could not load students: {error.message}</p>
      </main>
    );
  }

  const list = students ?? [];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Students</h1>
          <p className="mt-1 text-muted-foreground">
            {list.length === 0
              ? "Build your roster"
              : `${list.length} ${list.length === 1 ? "student" : "students"} on your roster`}
          </p>
        </div>
        <Button asChild>
          <Link href="/students/new">+ Add student</Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No students yet</CardTitle>
            <CardDescription>
              Add your first student to start tracking their handicap and lesson history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/students/new">Add your first student</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((student) => (
            <Link key={student.id} href={`/students/${student.id}`} className="group">
              <Card className="transition-colors group-hover:bg-muted/40">
                <CardHeader>
                  <CardTitle>{student.name}</CardTitle>
                  <CardDescription>
                    {handicapLabel(student.handicap)} · Handicap {student.handicap}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm flex flex-col gap-1">
                  <span>Last lesson: {formatLessonDate(student.last_lesson_at)}</span>
                  <span>Total lessons: {student.total_lessons}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
