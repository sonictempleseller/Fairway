import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatLessonTime } from "@/lib/lessons";
import {
  buildCalendar,
  monthLabel,
  monthParam,
  parseMonthParam,
  shiftMonth,
  WEEKDAY_LABELS,
} from "@/lib/calendar";

type LessonRow = {
  id: string;
  occurred_at: string;
  notes: string | null;
  status: "scheduled" | "logged";
  duration_minutes: number;
  student: { id: string; name: string } | null;
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const monthStart = parseMonthParam(month);
  const days = buildCalendar(monthStart);

  // Pull lessons whose date falls inside the visible 6-week grid.
  // Use setDate (DST-safe) to compute the day after the last grid cell.
  const rangeStart = days[0].iso;
  const rangeEnd = new Date(days[days.length - 1].date);
  rangeEnd.setDate(rangeEnd.getDate() + 1);
  const rangeEndExclusive = `${rangeEnd.getFullYear()}-${String(rangeEnd.getMonth() + 1).padStart(2, "0")}-${String(rangeEnd.getDate()).padStart(2, "0")}`;

  const supabase = await createClient();
  const { data: lessonsData, error } = await supabase
    .from("lessons")
    .select("id, occurred_at, notes, status, duration_minutes, student:students(id, name)")
    .gte("occurred_at", rangeStart)
    .lt("occurred_at", rangeEndExclusive)
    .order("occurred_at", { ascending: true })
    .returns<LessonRow[]>();

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <p className="text-destructive">Could not load calendar: {error.message}</p>
      </main>
    );
  }

  // Bucket lessons by their local date (YYYY-MM-DD) so we can render quickly.
  const byDay = new Map<string, LessonRow[]>();
  for (const lesson of lessonsData ?? []) {
    const iso = lesson.occurred_at.slice(0, 10);
    const list = byDay.get(iso);
    if (list) list.push(lesson);
    else byDay.set(iso, [lesson]);
  }

  const prev = monthParam(shiftMonth(monthStart, -1));
  const next = monthParam(shiftMonth(monthStart, 1));
  const totalLessonsThisView = lessonsData?.length ?? 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendar</h1>
          <p className="mt-1 text-muted-foreground">
            {monthLabel(monthStart)} · {totalLessonsThisView}{" "}
            {totalLessonsThisView === 1 ? "lesson" : "lessons"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/calendar?month=${prev}`} aria-label="Previous month">
              ←
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/calendar">Today</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/calendar?month=${next}`} aria-label="Next month">
              →
            </Link>
          </Button>
          <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white ml-2">
            <Link href="/lessons/new" aria-label="Schedule a lesson">+ Schedule</Link>
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded border border-emerald-400/70 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20" />
          Scheduled
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-3 rounded bg-emerald-600 dark:bg-emerald-700" />
          Logged
        </span>
      </div>

      {/* Weekday header row */}
      <div className="grid grid-cols-7 gap-px text-center text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {days.map((day) => {
          const lessons = byDay.get(day.iso) ?? [];
          return (
            <div
              key={day.iso}
              className={`group/day flex h-[176px] min-w-0 flex-col overflow-hidden bg-background p-2 text-left ${
                day.inMonth ? "" : "bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-semibold ${
                    day.isToday
                      ? "inline-flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                      : day.inMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {day.date.getDate()}
                </span>
                {day.inMonth && (
                  <Link
                    href={`/lessons/new?date=${day.iso}`}
                    aria-label={`Add lesson on ${day.iso}`}
                    className="opacity-0 group-hover/day:opacity-100 transition-opacity text-xs font-bold text-muted-foreground hover:text-emerald-700"
                  >
                    +
                  </Link>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {lessons.slice(0, 3).map((lesson) => {
                  const isScheduled = lesson.status === "scheduled";
                  // Logged: filled emerald (a recorded lesson)
                  // Scheduled: outlined emerald (planned, not yet recorded)
                  const pillClass = isScheduled
                    ? "border border-emerald-400/70 bg-emerald-50/60 text-emerald-900 hover:bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-200"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600";
                  return (
                    <Link
                      key={lesson.id}
                      href={lesson.student ? `/students/${lesson.student.id}` : "/students"}
                      className={`block rounded px-1.5 py-1 text-[11px] font-medium transition-colors ${pillClass}`}
                      title={`${isScheduled ? "Scheduled" : "Logged"} · ${formatLessonTime(lesson.occurred_at)} · ${lesson.student?.name ?? "Lesson"}`}
                    >
                      <div className="text-[10px] tabular-nums opacity-80 leading-tight">
                        {formatLessonTime(lesson.occurred_at)}
                      </div>
                      <div className="truncate leading-tight">
                        {lesson.student?.name ?? "Lesson"}
                      </div>
                    </Link>
                  );
                })}
                {lessons.length > 3 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{lessons.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalLessonsThisView === 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardDescription>
              No lessons in {monthLabel(monthStart)}. Log a lesson from a student&apos;s profile.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </main>
  );
}
