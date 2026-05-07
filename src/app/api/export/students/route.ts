// GET /api/export/students
// Streams a CSV of the signed-in coach's students.
// RLS scopes the query to the coach automatically; the explicit auth check
// here is defense-in-depth and gives a cleaner 401 if someone hits this URL
// without a session.

import { createClient } from "@/lib/supabase/server";
import { type Student } from "@/lib/students";
import { toCsv, csvFilename } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Not authenticated", { status: 401 });
  }

  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Student[]>();

  if (error) {
    return new Response(`Failed to load students: ${error.message}`, { status: 500 });
  }

  const headers = ["id", "name", "handicap", "total_lessons", "last_lesson_at", "created_at"];
  const rows = (students ?? []).map((s) => [
    s.id,
    s.name,
    s.handicap,
    s.total_lessons,
    s.last_lesson_at ?? "",
    s.created_at,
  ]);

  const csv = toCsv(headers, rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename("students")}"`,
      "Cache-Control": "no-store",
    },
  });
}
