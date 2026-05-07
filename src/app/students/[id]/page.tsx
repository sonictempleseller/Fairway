import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { CopyButton } from "@/components/copy-button";
import { LessonForm } from "@/components/lesson-form";
import { createClient } from "@/lib/supabase/server";
import { type Student, handicapLabel, formatLessonDate } from "@/lib/students";
import { type Lesson, formatLessonOccurredAt, formatLessonTime } from "@/lib/lessons";
import { deleteStudent } from "@/app/actions/students";
import { createLesson, deleteLesson } from "@/app/actions/lessons";
import { createInvitation, revokeInvitation } from "@/app/actions/invitations";

type Invitation = {
  id: string;
  token: string;
  email: string | null;
  expires_at: string;
  redeemed_at: string | null;
  created_at: string;
};

async function buildBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

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

  const [studentRes, lessonsRes, invitesRes, baseUrl] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).maybeSingle<Student>(),
    supabase
      .from("lessons")
      .select("*")
      .eq("student_id", id)
      .order("occurred_at", { ascending: false })
      .returns<Lesson[]>(),
    supabase
      .from("student_invitations")
      .select("id, token, email, expires_at, redeemed_at, created_at")
      .eq("student_id", id)
      .order("created_at", { ascending: false })
      .returns<Invitation[]>(),
    buildBaseUrl(),
  ]);

  if (studentRes.error) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="text-destructive">Could not load student: {studentRes.error.message}</p>
      </main>
    );
  }
  if (!studentRes.data) notFound();

  const student = studentRes.data;
  const lessons = lessonsRes.data ?? [];
  const invitations = invitesRes.data ?? [];
  const nowIso = new Date().toISOString();
  const upcoming = lessons
    .filter((l) => l.status === "scheduled" && l.occurred_at >= nowIso)
    .sort((a, b) => a.occurred_at.localeCompare(b.occurred_at));
  const history = lessons.filter((l) => l.status === "logged");

  // Active = not redeemed and not expired.
  const activeInvitation = invitations.find(
    (inv) => inv.redeemed_at === null && inv.expires_at > nowIso,
  );
  // Defensive: treat null, undefined, empty string all as "not linked".
  const isLinked = typeof student.user_id === "string" && student.user_id.length > 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
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
          {/* Log a completed lesson — for after a lesson has happened. */}
          <Card>
            <CardHeader>
              <CardTitle>Log a completed lesson</CardTitle>
              <CardDescription>
                Record what you worked on after a lesson. Use the calendar&apos;s{" "}
                <Link href="/lessons/new" className="underline-offset-4 hover:underline text-foreground">
                  Schedule
                </Link>{" "}
                button to plan ahead instead.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LessonForm mode="log" studentId={student.id} action={createLesson} errorMsg={errorMsg} />
            </CardContent>
          </Card>

          {/* Upcoming (scheduled) */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">Upcoming</h2>
              <div className="flex flex-col gap-3">
                {upcoming.map((lesson) => (
                  <Card key={lesson.id} size="sm" className="border border-emerald-300 dark:border-emerald-900">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">
                            {formatLessonOccurredAt(lesson.occurred_at)}
                          </CardTitle>
                          <CardDescription>
                            {formatLessonTime(lesson.occurred_at)} · {lesson.duration_minutes} min
                          </CardDescription>
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
                            message="Cancel this scheduled lesson?"
                            variant="ghost"
                            size="sm"
                          >
                            Cancel
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Lesson history (logged only) */}
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground mb-4">Lesson history</h2>
            {history.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardDescription>No lessons logged yet.</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((lesson) => (
                  <Card key={lesson.id} size="sm">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">
                            {formatLessonOccurredAt(lesson.occurred_at)}
                          </CardTitle>
                          <CardDescription>{formatLessonTime(lesson.occurred_at)}</CardDescription>
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

          {/* Invite to Fairway */}
          <Card>
            <CardHeader>
              <CardTitle>Invite to Fairway</CardTitle>
              <CardDescription>
                {isLinked
                  ? "This student has joined Fairway. They can sign in and see their lessons."
                  : "Send a link so they can claim their account and see lessons, homework, and chat with you."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {isLinked ? (
                <p className="text-sm text-muted-foreground">✓ Linked.</p>
              ) : activeInvitation ? (
                <>
                  <div className="text-xs text-muted-foreground">
                    Expires {new Date(activeInvitation.expires_at).toLocaleDateString()}
                  </div>
                  <Input
                    readOnly
                    value={`${baseUrl}/invite/${activeInvitation.token}`}
                    className="text-xs"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <CopyButton value={`${baseUrl}/invite/${activeInvitation.token}`} />
                    <form action={revokeInvitation}>
                      <input type="hidden" name="id" value={activeInvitation.id} />
                      <input type="hidden" name="student_id" value={student.id} />
                      <ConfirmSubmitButton
                        message="Revoke this invitation? The link will stop working."
                        variant="ghost"
                        size="sm"
                      >
                        Revoke
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </>
              ) : (
                <form action={createInvitation} className="flex flex-col gap-3">
                  <input type="hidden" name="student_id" value={student.id} />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Their email (optional, for your records)"
                    className="text-sm"
                  />
                  <Button type="submit" size="sm" className="self-start bg-emerald-600 hover:bg-emerald-700 text-white">
                    Generate invite link
                  </Button>
                </form>
              )}
            </CardContent>
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
