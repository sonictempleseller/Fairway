import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { type Student } from "@/lib/students";
import { updateStudent } from "@/app/actions/students";

export default async function EditStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle<Student>();

  if (!student) notFound();

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <div className="mb-6">
        <Link href={`/students/${student.id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to {student.name}
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit student</CardTitle>
          <CardDescription>Update name or handicap.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateStudent} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={student.id} />

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input id="name" name="name" type="text" required defaultValue={student.name} />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="handicap" className="text-sm font-medium">Handicap</label>
              <Input
                id="handicap"
                name="handicap"
                type="number"
                required
                min={0}
                max={54}
                defaultValue={student.handicap}
              />
              <p className="text-xs text-muted-foreground">A number from 0 to 54.</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="mt-2">Save changes</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
