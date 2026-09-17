import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addDays,
  buildMonthGrid,
  formatFullDate,
  parseISO,
  startOfWeek,
  toISO,
  type DailyJournalEntry,
} from "./journalCalendarMath";

type CalendarView = "week" | "month" | "year";

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function renderRichText(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, index) => (index % 2 === 1 ? <strong key={index}>{part}</strong> : part));
}

export default function JournalCalendar() {
  const [entries, setEntries] = useState<DailyJournalEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/journal.json")
      .then((response) => {
        if (!response.ok) throw new Error(`journal.json ${response.status}`);
        return response.json() as Promise<DailyJournalEntry[]>;
      })
      .then((data) => {
        if (cancelled) return;
        const loaded = (Array.isArray(data) ? data : [])
          .filter((entry) => entry && typeof entry.date === "string")
          .sort((a, b) => b.date.localeCompare(a.date));
        setEntries(loaded);
        const latest = loaded[0];
        if (latest) {
          setSelected(latest.date);
          setCursor(parseISO(latest.date));
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, DailyJournalEntry>();
    for (const entry of entries ?? []) map.set(entry.date, entry);
    return map;
  }, [entries]);

  const todayIso = toISO(new Date());
  const activeIso = preview ?? selected;
  const activeEntry = activeIso ? byDate.get(activeIso) ?? null : null;

  const shift = (direction: -1 | 1) => {
    setCursor((current) => {
      if (view === "week") return addDays(current, direction * 7);
      if (view === "month") return new Date(current.getFullYear(), current.getMonth() + direction, 1);
      return new Date(current.getFullYear() + direction, current.getMonth(), 1);
    });
  };

  const jumpToLatest = () => {
    const latest = entries?.[0];
    if (!latest) return;
    setSelected(latest.date);
    setPreview(null);
    setCursor(parseISO(latest.date));
  };

  const periodLabel = useMemo(() => {
    if (view === "year") return String(cursor.getFullYear());
    if (view === "month") return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    const start = startOfWeek(cursor);
    const end = addDays(start, 6);
    const startDay = `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}`;
    const endDay = start.getMonth() === end.getMonth() ? String(end.getDate()) : `${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}`;
    const years = start.getFullYear() === end.getFullYear() ? String(end.getFullYear()) : `${start.getFullYear()}/${end.getFullYear()}`;
    return `${startDay} – ${endDay}, ${years}`;
  }, [cursor, view]);

  const cellProps = (iso: string) => ({
    onMouseEnter: () => setPreview(iso),
    onMouseLeave: () => setPreview(null),
    onFocus: () => setPreview(iso),
    onBlur: () => setPreview(null),
    onClick: () => {
      setSelected(iso);
      setPreview(null);
    },
  });

  const entryCellClass = (base: string, iso: string, isSelected: boolean) => {
    const classes = [base, "jcal-has-entry"];
    if (isSelected) classes.push("is-selected");
    if (preview === iso) classes.push("is-preview");
    if (iso === todayIso) classes.push("is-today");
    return classes.join(" ");
  };

  return (
    <section className="journal-calendar" id="daily-journal" aria-label="Daily journal calendar">
      <div className="jcal-head">
        <p className="label">Daily journal</p>
        <div className="jcal-controls">
          <div className="jcal-toggle" role="group" aria-label="Calendar view">
            {(["week", "month", "year"] as const).map((option) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)}>
                {option === "week" ? "Weekly" : option === "month" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
          <div className="jcal-nav">
            <button type="button" onClick={() => shift(-1)} aria-label={`Previous ${view}`}>←</button>
            <span className="jcal-period">{periodLabel}</span>
            <button type="button" onClick={() => shift(1)} aria-label={`Next ${view}`}>→</button>
          </div>
          <button type="button" className="jcal-latest" onClick={jumpToLatest} disabled={!entries || entries.length === 0}>Latest</button>
        </div>
      </div>
      <div className="jcal-body">
        <div className="jcal-panel">
          {view === "month" ? (
            <>
              <div className="jcal-weekdays" aria-hidden="true">
                {WEEKDAY_SHORT.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="jcal-grid">
                {buildMonthGrid(cursor.getFullYear(), cursor.getMonth()).map((iso, index) => {
                  if (iso === null) return <span key={`blank-${index}`} className="jcal-cell jcal-blank" aria-hidden="true" />;
                  const hasEntry = byDate.has(iso);
                  const isSelected = iso === selected;
                  if (hasEntry) {
                    return (
                      <button
                        key={iso}
                        type="button"
                        className={entryCellClass("jcal-cell", iso, isSelected)}
                        aria-pressed={isSelected}
                        aria-label={`${formatFullDate(iso)} — open entry`}
                        {...cellProps(iso)}
                      >
                        <span className="jcal-daynum">{parseISO(iso).getDate()}</span>
                        <span className="jcal-dot" aria-hidden="true" />
                      </button>
                    );
                  }
                  return (
                    <span key={iso} className={`jcal-cell jcal-day${iso === todayIso ? " is-today" : ""}`}>
                      <span className="jcal-daynum">{parseISO(iso).getDate()}</span>
                    </span>
                  );
                })}
              </div>
            </>
          ) : null}
          {view === "week" ? (
            <div className="jcal-week">
              {Array.from({ length: 7 }, (_, offset) => addDays(startOfWeek(cursor), offset)).map((day) => {
                const iso = toISO(day);
                const entry = byDate.get(iso);
                if (entry) {
                  const isSelected = iso === selected;
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`jcal-week-cell${isSelected ? " is-selected" : ""}${preview === iso ? " is-preview" : ""}${iso === todayIso ? " is-today" : ""}`}
                      aria-pressed={isSelected}
                      aria-label={`${formatFullDate(iso)} — open entry`}
                      {...cellProps(iso)}
                    >
                      <span className="jcal-weekday">{WEEKDAY_SHORT[day.getDay()]}</span>
                      <span className="jcal-daynum">{day.getDate()} {MONTHS_SHORT[day.getMonth()]}</span>
                      <span className="jcal-snippet">{entry.summary}</span>
                    </button>
                  );
                }
                return (
                  <div key={iso} className={`jcal-week-cell jcal-week-empty${iso === todayIso ? " is-today" : ""}`}>
                    <span className="jcal-weekday">{WEEKDAY_SHORT[day.getDay()]}</span>
                    <span className="jcal-daynum">{day.getDate()} {MONTHS_SHORT[day.getMonth()]}</span>
                    <span className="jcal-snippet">—</span>
                  </div>
                );
              })}
            </div>
          ) : null}
          {view === "year" ? (
            <div className="jcal-year">
              {Array.from({ length: 12 }, (_, month) => month).map((month) => (
                <section key={month} className="jcal-mini" aria-label={`${MONTHS[month]} ${cursor.getFullYear()}`}>
                  <header>
                    <button
                      type="button"
                      className="jcal-mini-title"
                      onClick={() => {
                        setCursor(new Date(cursor.getFullYear(), month, 1));
                        setView("month");
                      }}
                    >
                      {MONTHS_SHORT[month]}
                    </button>
                  </header>
                  <div className="jcal-mini-grid">
                    {buildMonthGrid(cursor.getFullYear(), month).map((iso, index) => {
                      if (iso === null) return <span key={`blank-${month}-${index}`} className="jcal-mini-cell jcal-blank" aria-hidden="true" />;
                      const hasEntry = byDate.has(iso);
                      const isSelected = iso === selected;
                      if (hasEntry) {
                        return (
                          <button
                            key={iso}
                            type="button"
                            className={`jcal-mini-cell jcal-has-entry${isSelected ? " is-selected" : ""}${iso === todayIso ? " is-today" : ""}`}
                            aria-label={`${formatFullDate(iso)} — open entry`}
                            {...cellProps(iso)}
                          >
                            <span className="jcal-mini-day">{parseISO(iso).getDate()}</span>
                            <span className="jcal-dot" aria-hidden="true" />
                          </button>
                        );
                      }
                      return (
                        <span key={iso} className="jcal-mini-cell">
                          <span className="jcal-mini-day">{parseISO(iso).getDate()}</span>
                        </span>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </div>
        <div className="jcal-detail" aria-live="polite">
          {activeEntry ? (
            <>
              <p className="jcal-detail-date">{formatFullDate(activeEntry.date)}</p>
              <p className="jcal-detail-summary">{activeEntry.summary}</p>
              {activeEntry.highlights && activeEntry.highlights.length > 0 ? (
                <ul className="jcal-highlights">
                  {activeEntry.highlights.map((line, index) => (
                    <li key={index}>{renderRichText(line)}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : (
            <p className="jcal-empty">
              {failed
                ? "The daily log isn't available right now."
                : entries === null
                  ? "Loading the daily log…"
                  : entries.length === 0
                    ? "No logged days yet."
                    : "Hover or open a marked day to see what I got up to."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
