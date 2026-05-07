import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { type Student, handicapLabel, formatLessonDate } from "@/lib/students";
import { deleteStudent } from "@/app/actions/students";

// In Next.js 16, params is a Promise that must be awaited.
export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle<Student>();

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-destructive">Could not load student: {error.message}</p>
      </main>
    );
  }

  if (!student) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <Link href="/students" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to students
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{student.name}</h1>
        <p className="mt-2 text-muted-foreground">
          {handicapLabel(student.handicap)} · Handicap {student.handicap}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{student.total_lessons}</CardTitle>
            <CardDescription>Total lessons</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{formatLessonDate(student.last_lesson_at)}</CardTitle>
            <CardDescription>Last lesson</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage</CardTitle>
          <CardDescription>Lesson tracking and student edits coming soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={deleteStudent}>
            <input type="hidden" name="id" value={student.id} />
            <Button type="submit" variant="destructive" size="sm">
              Remove from roster
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
