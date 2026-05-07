// Type definitions and formatting helpers for lessons.

export type LessonStatus = "scheduled" | "logged";

export type Lesson = {
  id: string;
  student_id: string;
  coach_id: string;
  occurred_at: string; // ISO timestamp (timestamptz from Postgres)
  duration_minutes: number;
  status: LessonStatus;
  notes: string | null;
  created_at: string;
};

export function formatLessonOccurredAt(iso: string): string {
  // Full date — e.g. "Sat, May 7, 2026"
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLessonTime(iso: string): string {
  // Just the clock time — e.g. "10:30 AM"
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatLessonDateTime(iso: string): string {
  // Date + time combined — e.g. "Sat, May 7 · 10:30 AM"
  return `${formatLessonOccurredAt(iso)} · ${formatLessonTime(iso)}`;
}
