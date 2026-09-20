import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addDays,
  buildMonthGrid,
  formatFullDate,
  formatWeekRange,
  isDateInWeek,
  monthWeekStarts,
  parseISO,
  startOfWeek,
  toISO,
  weekDates,
  type DailyJournalEntry,
  type WeeklyReview,
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
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [failed, setFailed] = useState(false);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [openWeek, setOpenWeek] = useState<string | null>(null);

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

  // Weekly reviews are an optional layer — a missing feed never blocks the calendar.
  useEffect(() => {
    let cancelled = false;
    fetch("/weekly.json")
      .then((response) => {
        if (!response.ok) throw new Error(`weekly.json ${response.status}`);
        return response.json() as Promise<WeeklyReview[]>;
      })
      .then((data) => {
        if (cancelled) return;
        setReviews(
          (Array.isArray(data) ? data : []).filter(
            (review) =>
              review && typeof review.weekStart === "string" && Array.isArray(review.sections),
          ),
        );
      })
      .catch(() => {
        /* the week panel composes from daily entries without it */
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

  const reviewByWeek = useMemo(() => {
    const map = new Map<string, WeeklyReview>();
    for (const review of reviews) map.set(review.weekStart, review);
    return map;
  }, [reviews]);

  const todayIso = toISO(new Date());
  const activeIso = preview ?? selected;
  const activeEntry = !openWeek && activeIso ? byDate.get(activeIso) ?? null : null;

  const openWeekReview = openWeek ? reviewByWeek.get(openWeek) ?? null : null;
  const openWeekDays = useMemo(() => {
    const days: { iso: string; entry: DailyJournalEntry }[] = [];
    if (!openWeek) return days;
    for (const iso of weekDates(openWeek)) {
      const entry = byDate.get(iso);
      if (entry) days.push({ iso, entry });
    }
    return days;
  }, [openWeek, byDate]);

  const shift = (direction: -1 | 1) => {
    setCursor((current) => {
      if (view === "week") return addDays(current, direction * 7);
      if (view === "month") return new Date(current.getFullYear(), current.getMonth() + direction, 1);
      return new Date(current.getFullYear() + direction, current.getMonth(), 1);
    });
  };

  const changeView = (option: CalendarView) => {
    setView(option);
    setOpenWeek(null);
  };

  const jumpToLatest = () => {
    const latest = entries?.[0];
    if (!latest) return;
    setSelected(latest.date);
    setPreview(null);
    setOpenWeek(null);
    setCursor(parseISO(latest.date));
  };

  const openWeekFrom = (weekStartIso: string) => {
    setOpenWeek(weekStartIso);
    setPreview(null);
  };

  const selectDay = (iso: string) => {
    setSelected(iso);
    setPreview(null);
    setOpenWeek(null);
  };

  const periodLabel = useMemo(() => {
    if (view === "year") return String(cursor.getFullYear());
    if (view === "month") return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    return formatWeekRange(toISO(startOfWeek(cursor)));
  }, [cursor, view]);

  const cellProps = (iso: string) => ({
    onMouseEnter: () => setPreview(iso),
    onMouseLeave: () => setPreview(null),
    onFocus: () => setPreview(iso),
    onBlur: () => setPreview(null),
    onClick: () => selectDay(iso),
  });

  const entryCellClass = (base: string, iso: string, isSelected: boolean) => {
    const classes = [base, "jcal-has-entry"];
    if (isSelected && !openWeek) classes.push("is-selected");
    if (preview === iso) classes.push("is-preview");
    if (iso === todayIso) classes.push("is-today");
    if (openWeek && isDateInWeek(iso, openWeek)) classes.push("is-week");
    return classes.join(" ");
  };

  const monthGrid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );
  const monthWeeks = useMemo(
    () => monthWeekStarts(cursor.getFullYear(), cursor.getMonth()),
    [cursor],
  );
  const visibleWeekStart = toISO(startOfWeek(cursor));

  const weekButton = (weekStartIso: string, extra: string) => (
    <button
      type="button"
      className={`jcal-weeklink${extra}`}
      aria-pressed={openWeek === weekStartIso}
      onClick={() => openWeekFrom(weekStartIso)}
    >
      Week in review ↗
    </button>
  );

  return (
    <section className="journal-calendar" id="daily-journal" aria-label="Daily journal calendar">
      <div className="jcal-head">
        <p className="label">Daily journal</p>
        <div className="jcal-controls">
          <div className="jcal-toggle" role="group" aria-label="Calendar view">
            {(["week", "month", "year"] as const).map((option) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => changeView(option)}>
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
                <span className="jcal-gutter-gap" />
                {WEEKDAY_SHORT.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="jcal-grid">
                {monthWeeks.map((weekStart, row) => {
                  const cells = monthGrid.slice(row * 7, row * 7 + 7);
                  const isOpen = openWeek === weekStart;
                  return (
                    <Fragment key={weekStart}>
                      <button
                        type="button"
                        className={`jcal-weekbtn${isOpen ? " is-open" : ""}${reviewByWeek.has(weekStart) ? " has-review" : ""}`}
                        aria-label={`Week in review, ${formatWeekRange(weekStart)}`}
                        aria-pressed={isOpen}
                        onClick={() => openWeekFrom(weekStart)}
                      >
                        ↗
                      </button>
                      {cells.map((iso, index) => {
                        if (iso === null) return <span key={`blank-${row}-${index}`} className="jcal-cell jcal-blank" aria-hidden="true" />;
                        const hasEntry = byDate.has(iso);
                        const isSelected = iso === selected;
                        if (hasEntry) {
                          return (
                            <button
                              key={iso}
                              type="button"
                              className={entryCellClass("jcal-cell", iso, isSelected)}
                              aria-pressed={isSelected && !openWeek}
                              aria-label={`${formatFullDate(iso)} — open entry`}
                              {...cellProps(iso)}
                            >
                              <span className="jcal-daynum">{parseISO(iso).getDate()}</span>
                              <span className="jcal-dot" aria-hidden="true" />
                            </button>
                          );
                        }
                        const weekClass = openWeek && isDateInWeek(iso, openWeek) ? " is-week" : "";
                        return (
                          <span key={iso} className={`jcal-cell jcal-day${iso === todayIso ? " is-today" : ""}${weekClass}`}>
                            <span className="jcal-daynum">{parseISO(iso).getDate()}</span>
                          </span>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </>
          ) : null}
          {view === "week" ? (
            <>
              <div className="jcal-week-bar">{weekButton(visibleWeekStart, "")}</div>
              <div className="jcal-week">
                {weekDates(visibleWeekStart).map((iso) => {
                  const day = parseISO(iso);
                  const entry = byDate.get(iso);
                  if (entry) {
                    const isSelected = iso === selected;
                    const weekClass = openWeek && isDateInWeek(iso, openWeek) ? " is-week" : "";
                    return (
                      <button
                        key={iso}
                        type="button"
                        className={`jcal-week-cell${isSelected && !openWeek ? " is-selected" : ""}${preview === iso ? " is-preview" : ""}${iso === todayIso ? " is-today" : ""}${weekClass}`}
                        aria-pressed={isSelected && !openWeek}
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
            </>
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
                        setOpenWeek(null);
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
                            className={`jcal-mini-cell jcal-has-entry${isSelected && !openWeek ? " is-selected" : ""}${iso === todayIso ? " is-today" : ""}`}
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
          {openWeek ? (
            <>
              <p className="jcal-detail-date">Week in review</p>
              <p className="jcal-detail-summary">{formatWeekRange(openWeek)}</p>
              {openWeekReview ? (
                <div className="jcal-review">
                  {openWeekReview.summary ? <p className="jcal-review-lead">{openWeekReview.summary}</p> : null}
                  {openWeekReview.sections.map((section, sectionIndex) => (
                    <section key={sectionIndex} className="jcal-review-section">
                      {section.heading ? <h4 className="jcal-review-heading">{section.heading}</h4> : null}
                      {section.items.length > 0 ? (
                        <ul className="jcal-review-items">
                          {section.items.map((item, itemIndex) => <li key={itemIndex}>{renderRichText(item)}</li>)}
                        </ul>
                      ) : null}
                    </section>
                  ))}
                  <p className="jcal-review-stamp">Reviewed {formatFullDate(openWeekReview.date)}</p>
                </div>
              ) : (
                <p className="jcal-empty">No written review for this week yet — here is the day-by-day log.</p>
              )}
              {openWeekDays.length > 0 ? (
                <div className="jcal-week-days">
                  <h4 className="jcal-review-heading">Day by day</h4>
                  {openWeekDays.map(({ iso, entry }) => (
                    <div key={iso} className="jcal-week-day">
                      <p className="jcal-week-day-title">{formatFullDate(iso)}</p>
                      <p className="jcal-week-day-summary">{entry.summary}</p>
                      {entry.highlights && entry.highlights.length > 0 ? (
                        <ul className="jcal-highlights">
                          {entry.highlights.map((line, index) => <li key={index}>{renderRichText(line)}</li>)}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : activeEntry ? (
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
              {weekButton(toISO(startOfWeek(parseISO(activeEntry.date))), "")}
            </>
          ) : (
            <p className="jcal-empty">
              {failed
                ? "The daily log isn't available right now."
                : entries === null
                  ? "Loading the daily log…"
                  : entries.length === 0
                    ? "No logged days yet."
                    : "Hover or open a marked day — or a whole week — to see what I got up to."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
