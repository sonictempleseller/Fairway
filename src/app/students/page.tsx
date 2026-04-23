import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { students, handicapLabel } from "@/lib/students";

export default function StudentsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Students</h1>
        <p className="mt-1 text-muted-foreground">{students.length} students on your roster</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {students.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle>{student.name}</CardTitle>
              <CardDescription>{handicapLabel(student.handicap)} · Handicap {student.handicap}</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm flex flex-col gap-1">
              <span>Last lesson: {student.lastLesson}</span>
              <span>Total lessons: {student.totalLessons}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
