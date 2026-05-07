// Type definitions and small helpers for the students feature.
// Database queries live in the page components / server actions, not here.

export type Student = {
  id: string;
  coach_id: string;
  user_id: string | null; // set when an invitation is redeemed
  name: string;
  handicap: number;
  total_lessons: number;
  last_lesson_at: string | null; // ISO timestamp, or null if no lessons yet
  created_at: string;
};

export function handicapLabel(handicap: number): string {
  if (handicap <= 5) return "Low handicap";
  if (handicap <= 15) return "Mid handicap";
  if (handicap <= 25) return "High handicap";
  return "Beginner";
}

export function formatLessonDate(iso: string | null): string {
  if (!iso) return "No lessons yet";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
