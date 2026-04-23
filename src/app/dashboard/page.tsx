import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { students, handicapLabel } from "@/lib/students";

const totalLessons = students.reduce((sum, s) => sum + s.totalLessons, 0);
const avgHandicap = Math.round(students.reduce((sum, s) => sum + s.handicap, 0) / students.length);
const recentStudents = [...students].sort((a, b) => b.lastLessonISO.localeCompare(a.lastLessonISO)).slice(0, 4);

const stats = [
  { label: "Total students",  value: students.length },
  { label: "Lessons given",   value: totalLessons    },
  { label: "Avg handicap",    value: avgHandicap      },
];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, Coach</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-4xl font-bold">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{stat.label}</CardContent>
          </Card>
        ))}
      </div>

      {/* Recent lessons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Recent lessons</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/students">View all</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {recentStudents.map((student) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle>{student.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex flex-col gap-1">
              <span>{handicapLabel(student.handicap)} · Handicap {student.handicap}</span>
              <span>Last lesson: {student.lastLesson}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
