import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createStudent } from "@/app/actions/students";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <div className="mb-6">
        <Link href="/students" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to students
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add student</CardTitle>
          <CardDescription>Add a student to your roster.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createStudent} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input id="name" name="name" type="text" required placeholder="Jane Doe" />
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
                placeholder="14"
              />
              <p className="text-xs text-muted-foreground">A number from 0 to 54.</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="mt-2">Add student</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
