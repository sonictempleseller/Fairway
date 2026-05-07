// Type definitions for lessons.

export type Lesson = {
  id: string;
  student_id: string;
  coach_id: string;
  occurred_at: string; // ISO timestamp
  notes: string | null;
  created_at: string;
};

export function formatLessonOccurredAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
