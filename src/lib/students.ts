export type Student = {
  id: string;
  name: string;
  handicap: number;
  lastLesson: string;
  totalLessons: number;
};

export const students: Student[] = [
  { id: "1", name: "Marcus Webb",    handicap: 22, lastLesson: "Apr 18, 2026", totalLessons: 8  },
  { id: "2", name: "Diana Chen",     handicap: 6,  lastLesson: "Apr 20, 2026", totalLessons: 31 },
  { id: "3", name: "Tom Gallagher",  handicap: 14, lastLesson: "Apr 15, 2026", totalLessons: 15 },
  { id: "4", name: "Sara Okonkwo",   handicap: 30, lastLesson: "Apr 10, 2026", totalLessons: 3  },
  { id: "5", name: "James Whitfield",handicap: 9,  lastLesson: "Apr 21, 2026", totalLessons: 22 },
  { id: "6", name: "Priya Nair",     handicap: 18, lastLesson: "Apr 17, 2026", totalLessons: 11 },
];

export function handicapLabel(handicap: number): string {
  if (handicap <= 5)  return "Low handicap";
  if (handicap <= 15) return "Mid handicap";
  if (handicap <= 25) return "High handicap";
  return "Beginner";
}
