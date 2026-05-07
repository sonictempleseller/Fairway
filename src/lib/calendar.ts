// Tiny calendar helpers — month math + grid construction.
// Locale-aware month/day labels via Intl.DateTimeFormat.

export type CalendarDay = {
  date: Date;        // local-midnight date for this cell
  iso: string;       // YYYY-MM-DD (used to match against lesson timestamps)
  inMonth: boolean;  // false for leading/trailing days from neighbour months
  isToday: boolean;
};

export function parseMonthParam(param: string | undefined): Date {
  // Accepts "YYYY-MM"; falls back to current month on anything invalid.
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function monthParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function localISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Build a 6-row x 7-col grid covering the given month, padded with the
// trailing days of the previous month and the leading days of the next.
//
// Uses setDate() rather than millisecond math so that DST transitions
// (e.g. Nov 1 in the US) don't double-count or skip a day.
export function buildCalendar(monthStart: Date): CalendarDay[] {
  const today = localISODate(new Date());
  const startWeekday = monthStart.getDay(); // 0 = Sunday

  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - startWeekday);

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const iso = localISODate(d);
    days.push({
      date: d,
      iso,
      inMonth: d.getMonth() === monthStart.getMonth(),
      isToday: iso === today,
    });
  }
  return days;
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
