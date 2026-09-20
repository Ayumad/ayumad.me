// Date + data helpers for the daily-journal calendar on /journal.
// Kept separate from the component (mirrors spotifyArtworkMath.ts) so the pure
// functions can be unit-tested without rendering anything.

export interface DailyJournalEntry {
  date: string;
  summary: string;
  highlights?: string[];
}

export interface WeeklyReviewSection {
  heading: string | null;
  items: string[];
}

export interface WeeklyReview {
  date: string;
  weekStart: string;
  summary?: string;
  sections: WeeklyReviewSection[];
}

export function parseISO(value: string): Date {
  const parts = value.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function toISO(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay());
}

export function buildMonthGrid(year: number, month: number): (string | null)[] {
  const cells: (string | null)[] = [];
  const lead = new Date(year, month, 1).getDay();
  for (let index = 0; index < lead; index += 1) cells.push(null);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(toISO(new Date(year, month, day)));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** ISO Sundays for each row of a month grid (row count = buildMonthGrid rows). */
export function monthWeekStarts(year: number, month: number): string[] {
  const first = startOfWeek(new Date(year, month, 1));
  const rows = buildMonthGrid(year, month).length / 7;
  const starts: string[] = [];
  for (let index = 0; index < rows; index += 1) starts.push(toISO(addDays(first, index * 7)));
  return starts;
}

/** The seven ISO dates of the week beginning at `startIso`. */
export function weekDates(startIso: string): string[] {
  const start = parseISO(startIso);
  return Array.from({ length: 7 }, (_, offset) => toISO(addDays(start, offset)));
}

export function isDateInWeek(iso: string, weekStartIso: string): boolean {
  const days = Math.round((parseISO(iso).getTime() - parseISO(weekStartIso).getTime()) / 86400000);
  return days >= 0 && days < 7;
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sep 13 – 19, 2026" (week range label; handles month/year boundaries). */
export function formatWeekRange(startIso: string): string {
  const start = parseISO(startIso);
  const end = addDays(start, 6);
  const startDay = `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}`;
  const endDay = start.getMonth() === end.getMonth() ? String(end.getDate()) : `${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}`;
  const years = start.getFullYear() === end.getFullYear() ? String(end.getFullYear()) : `${start.getFullYear()}/${end.getFullYear()}`;
  return `${startDay} – ${endDay}, ${years}`;
}

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function formatFullDate(iso: string): string {
  return fullDateFormatter.format(parseISO(iso));
}
