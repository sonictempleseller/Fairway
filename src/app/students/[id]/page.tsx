import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createClient } from "@/lib/supabase/server";
import { type Student, handicapLabel, formatLessonDate } from "@/lib/students";
import { type Lesson, formatLessonOccurredAt } from "@/lib/lessons";
import { deleteStudent } from "@/app/actions/students";
import { createLesson, deleteLesson } from "@/app/actions/lessons";

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorMsg } = await searchParams;

  const supabase = await createClient();

  const [studentRes, lessonsRes] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).maybeSingle<Student>(),
    supabase
      .from("lessons")
      .select("*")
      .eq("student_id", id)
      .order("occurred_at", { ascending: false })
      .returns<Lesson[]>(),
  ]);

  if (studentRes.error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-destructive">Could not load student: {studentRes.error.message}</p>
      </main>
    );
  }
  if (!studentRes.data) notFound();

  const student = studentRes.data;
  const lessons = lessonsRes.data ?? [];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <Link href="/students" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to students
        </Link>
      </div>

      {/* Title row */}
      <div className="mb-10 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {student.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {handicapLabel(student.handicap)} · Handicap {student.handicap}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/students/${student.id}/edit`}>Edit</Link>
        </Button>
      </div>

      {/* Two-column layout: lessons (wide) + sidebar (narrow) on desktop */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Log a new lesson */}
          <Card>
            <CardHeader>
              <CardTitle>Log a lesson</CardTitle>
              <CardDescription>Record a lesson with this student.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createLesson} className="flex flex-col gap-4">
                <input type="hidden" name="student_id" value={student.id} />
                <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="occurred_at" className="text-sm font-medium">Date</label>
                    <Input
                      id="occurred_at"
                      name="occurred_at"
                      type="date"
                      required
                      defaultValue={today}
                      max={today}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="notes" className="text-sm font-medium">Notes (optional)</label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      placeholder="What did you work on?"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </div>
                </div>
                {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
                <Button type="submit" className="self-start bg-emerald-600 hover:bg-emerald-700 text-white">Log lesson</Button>
              </form>
            </CardContent>
          </Card>

          {/* Lesson history */}
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">Lesson history</h2>
            {lessons.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardDescription>No lessons logged yet.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {lessons.map((lesson) => (
                  <Card key={lesson.id} size="sm">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">
                            {formatLessonOccurredAt(lesson.occurred_at)}
                          </CardTitle>
                          {lesson.notes && (
                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                              {lesson.notes}
                            </p>
                          )}
                        </div>
                        <form action={deleteLesson}>
                          <input type="hidden" name="id" value={lesson.id} />
                          <input type="hidden" name="student_id" value={student.id} />
                          <ConfirmSubmitButton
                            message="Delete this lesson? This cannot be undone."
                            variant="ghost"
                            size="sm"
                          >
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>Removing a student also deletes their lesson history.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={deleteStudent}>
                <input type="hidden" name="id" value={student.id} />
                <ConfirmSubmitButton
                  message={`Permanently remove ${student.name} and all of their lessons? This cannot be undone.`}
                  variant="destructive"
                  size="sm"
                >
                  Remove from roster
                </ConfirmSubmitButton>
              </form>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
