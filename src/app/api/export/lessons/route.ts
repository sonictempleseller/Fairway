// GET /api/export/lessons
// Streams a CSV of the signed-in coach's lessons. The lessons feature isn't
// built yet, so this will currently produce a header-only file — that's by
// design so the export endpoint exists and works once we start logging lessons.

import { createClient } from "@/lib/supabase/server";
import { toCsv, csvFilename } from "@/lib/csv";

type LessonRow = {
  id: string;
  student_id: string;
  coach_id: string;
  occurred_at: string;
  notes: string | null;
  created_at: string;
};

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Not authenticated", { status: 401 });
  }

  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("*")
    .order("occurred_at", { ascending: false })
    .returns<LessonRow[]>();

  if (error) {
    return new Response(`Failed to load lessons: ${error.message}`, { status: 500 });
  }

  const headers = ["id", "student_id", "occurred_at", "notes", "created_at"];
  const rows = (lessons ?? []).map((l) => [
    l.id,
    l.student_id,
    l.occurred_at,
    l.notes ?? "",
    l.created_at,
  ]);

  const csv = toCsv(headers, rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFilename("lessons")}"`,
      "Cache-Control": "no-store",
    },
  });
}
