// Date + data helpers for the daily-journal calendar on /journal.
// Kept separate from the component (mirrors spotifyArtworkMath.ts) so the pure
// functions can be unit-tested without rendering anything.

export interface DailyJournalEntry {
  date: string;
  summary: string;
  highlights?: string[];
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

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function formatFullDate(iso: string): string {
  return fullDateFormatter.format(parseISO(iso));
}
