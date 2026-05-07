"use client";

// Reusable lesson form. Two modes:
//
//   mode="schedule"  → planning ahead. Asks for student (if not fixed),
//                      datetime, duration, optional plan/notes.
//
//   mode="log"       → recording a completed lesson after the fact. Asks for
//                      datetime + notes. Notes carry the "what we worked on"
//                      content. Duration is implicit (defaults to 60).
//
// Why this is a Client Component: <input type="datetime-local"> gives a
// naive "YYYY-MM-DDTHH:MM" string with no timezone info. We convert to a
// proper UTC ISO string in the user's local timezone before submitting.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StudentOption = { id: string; name: string };

type Props = {
  /** "schedule" plans ahead; "log" records a completed lesson. */
  mode: "schedule" | "log";
  /** Fixed student (no dropdown). Used on student profile. */
  studentId?: string;
  /** Dropdown options. Used on /lessons/new. */
  students?: StudentOption[];
  /** The Server Action to call once the FormData is finalized. */
  action: (formData: FormData) => Promise<void>;
  errorMsg?: string;
  /** Default date as YYYY-MM-DD (used to pre-fill from calendar day click). */
  defaultDate?: string;
  submitLabel?: string;
};

export function LessonForm({
  mode,
  studentId,
  students,
  action,
  errorMsg,
  defaultDate,
  submitLabel,
}: Props) {
  const [pending, setPending] = useState(false);

  const isSchedule = mode === "schedule";
  const finalLabel = submitLabel ?? (isSchedule ? "Schedule lesson" : "Log lesson");

  return (
    <form
      action={async (fd: FormData) => {
        setPending(true);
        // datetime-local "YYYY-MM-DDTHH:MM" → proper UTC ISO.
        const local = String(fd.get("occurred_at") ?? "");
        if (local) {
          const asDate = new Date(local);
          if (!Number.isNaN(asDate.getTime())) {
            fd.set("occurred_at", asDate.toISOString());
          }
        }
        // Always tag the row with the right status.
        fd.set("status", isSchedule ? "scheduled" : "logged");
        try {
          await action(fd);
        } finally {
          setPending(false);
        }
      }}
      className="flex flex-col gap-4"
    >
      {studentId && <input type="hidden" name="student_id" value={studentId} />}

      {students && (
        <div className="flex flex-col gap-2">
          <label htmlFor="student_id" className="text-sm font-medium">Student</label>
          <select
            id="student_id"
            name="student_id"
            required
            defaultValue=""
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="" disabled>Select a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="occurred_at" className="text-sm font-medium">Date &amp; time</label>
          <Input
            id="occurred_at"
            name="occurred_at"
            type="datetime-local"
            required
            defaultValue={getDefaultLocalValue(defaultDate, isSchedule)}
          />
        </div>

        {isSchedule && (
          <div className="flex flex-col gap-2">
            <label htmlFor="duration_minutes" className="text-sm font-medium">Duration</label>
            <select
              id="duration_minutes"
              name="duration_minutes"
              defaultValue="60"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="90">90 minutes</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="text-sm font-medium">
          {isSchedule ? "Plan / notes (optional)" : "What did you work on?"}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={isSchedule ? 2 : 3}
          placeholder={
            isSchedule
              ? "Driving range — focus on weight transfer."
              : "Worked on grip pressure and tempo."
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

      <Button
        type="submit"
        disabled={pending}
        className="self-start bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {pending ? "Saving…" : finalLabel}
      </Button>
    </form>
  );
}

// Returns "YYYY-MM-DDTHH:MM" in the user's local clock.
//   - schedule mode: defaults to noon on the supplied calendar date
//     (or noon today if not supplied), so it feels natural for planning
//   - log mode: defaults to "now" rounded down to nearest 5 minutes
function getDefaultLocalValue(defaultDate: string | undefined, isSchedule: boolean): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  let d: Date;
  if (defaultDate && /^\d{4}-\d{2}-\d{2}$/.test(defaultDate)) {
    const [y, mo, da] = defaultDate.split("-").map(Number);
    d = new Date(y, mo - 1, da, isSchedule ? 12 : new Date().getHours(), 0, 0);
  } else if (isSchedule) {
    d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0); // next hour, on the hour
  } else {
    d = new Date();
    d.setMinutes(d.getMinutes() - (d.getMinutes() % 5), 0, 0);
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
