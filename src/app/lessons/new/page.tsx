import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LessonForm } from "@/components/lesson-form";
import { createClient } from "@/lib/supabase/server";
import { createLesson } from "@/app/actions/lessons";

type StudentRow = { id: string; name: string };

export default async function NewLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; date?: string; student_id?: string }>;
}) {
  const { error, date, student_id } = await searchParams;

  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, name")
    .order("name", { ascending: true })
    .returns<StudentRow[]>();

  const studentList = students ?? [];

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6">
        <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to calendar
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule a lesson</CardTitle>
          <CardDescription>
            Plan an upcoming lesson. You&apos;ll log what you worked on after it happens, from
            the student&apos;s profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentList.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              You don&apos;t have any students yet.{" "}
              <Link href="/students/new" className="text-foreground underline-offset-4 hover:underline">
                Add a student first
              </Link>
              .
            </div>
          ) : (
            <LessonForm
              mode="schedule"
              students={studentList}
              action={createLesson}
              errorMsg={error}
              defaultDate={date}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
