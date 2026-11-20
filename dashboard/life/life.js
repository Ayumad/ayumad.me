(() => {
  "use strict";

  const LA = "America/Los_Angeles";
  const IS_WALL = location.pathname.endsWith(".html") || location.protocol === "file:";
  const DASH = "—";
  const $ = (id) => document.getElementById(id);
  const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
  const count = (...values) => values.find((value) => Number.isFinite(value) && value >= 0);
  const metric = (value, label) => value === undefined ? DASH : `${value} ${label}`;
  const dateKey = (value) => String(value ?? "").match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const dateFormat = new Intl.DateTimeFormat("en-CA", {
    timeZone: LA, year: "numeric", month: "2-digit", day: "2-digit",
  });
  const dayFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: LA, weekday: "long", month: "short", day: "numeric",
  });
  const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: LA, hour: "numeric", minute: "2-digit" });
  const dateTag = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" });
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" });

  const state = { data: null, source: "", failed: false, stale: false, weather: null, weatherFailed: false };
  const clockDate = (now = new Date()) => {
    const parts = Object.fromEntries(dateFormat.formatToParts(now).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const utcDate = (key) => new Date(`${key}T12:00:00Z`);
  const formatDate = (value) => dateKey(value) && Number.isFinite(+utcDate(dateKey(value)))
    ? dateTag.format(utcDate(dateKey(value))) : DASH;
  const formatWeekday = (key) => key && Number.isFinite(+utcDate(key)) ? weekday.format(utcDate(key)) : DASH;
  const isWeekend = (key) => ["FRI", "SAT", "SUN"].includes(formatWeekday(key).toUpperCase());

  function setText(node, value) {
    const text = String(value ?? DASH);
    if (node.textContent !== text) node.textContent = text;
  }

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function timeInfo(now = new Date()) {
    const parts = Object.fromEntries(timeFormat.formatToParts(now).map(({ type, value }) => [type, value]));
    const minute = (Number(parts.hour) % 12) * 60 + Number(parts.minute) + (parts.dayPeriod === "PM" ? 720 : 0);
    return { minute, second: now.getSeconds(), face: `${parts.hour}:${parts.minute}`, period: parts.dayPeriod };
  }

  function parseTime(value) {
    const parts = String(value ?? "").match(/^(1[0-2]|0?[1-9]):([0-5]\d)\s*([AP])M$/i);
    return parts ? (Number(parts[1]) % 12) * 60 + Number(parts[2]) + (parts[3].toUpperCase() === "P" ? 720 : 0) : null;
  }

  function formatTime(minutes) {
    const value = Math.floor(minutes) % 1440;
    return `${Math.floor(value / 60) % 12 || 12}:${String(value % 60).padStart(2, "0")} ${value >= 720 ? "PM" : "AM"}`;
  }

  function relativeDays(value, today) {
    const key = dateKey(value);
    return key ? (+utcDate(key) - +utcDate(today)) / 86400000 : NaN;
  }

  function clean(value) {
    return String(value ?? "").replace(/\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
  }

  function shorten(value, max) {
    const text = clean(value);
    if (!text) return DASH;
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const space = cut.lastIndexOf(" ");
    return `${(space > max * 0.55 ? cut.slice(0, space) : cut).trimEnd()}…`;
  }

  const withoutAside = (value) => clean(value).replace(/\s*\([^)]*\)/g, "").trim();
  const courseOf = (value) => String(value ?? "").match(/\b(CMPE|CS|MATH|PHYS|POLS|ENGR|EE|ME|BIOL|CHEM)\s*-?\s*(\d{2,3})\b/i)?.slice(1).join(" ").toUpperCase();
  const projectOf = (value) => clean(value).match(/\bproject\s+\d+\b/i)?.[0].toLowerCase();
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const titleDeadline = /\b(?:due|by)\s+(?:(today|tonight)\b[ ,]*|(?:\w+\s+)?([a-z]{3})[a-z]*\s+(\d{1,2})(?:,?\s+(\d{4}))?\b[ ,]*)?(\d{1,2}:\d{2}\s*[AP]M)\b/i;

  function deadlineOf(item, today, minute, snapshotDay) {
    const fieldDate = dateKey(item.due);
    const stamp = /T.*(?:Z|[+-]\d\d:\d\d)$/i.test(item.due) ? new Date(item.due) : null;
    const timed = stamp && Number.isFinite(+stamp);
    let day = timed ? clockDate(stamp) : fieldDate;
    let time = timed ? timeInfo(stamp).minute : null;
    const explicit = String(item.title ?? "").match(titleDeadline);
    if (explicit) {
      const [, relative, month, date, year, clock] = explicit;
      const matchTime = parseTime(clock);
      const monthIndex = months.indexOf(month?.toLowerCase());
      let matchDay = relative ? snapshotDay || day : day;
      if (monthIndex >= 0) {
        // Use the due field to anchor abbreviated dates around New Year's.
        const anchor = day || today;
        const anchorYear = Number(anchor.slice(0, 4));
        const years = year ? [Number(year)] : [anchorYear, anchorYear - 1, anchorYear + 1];
        const suffix = `-${String(monthIndex + 1).padStart(2, "0")}-${date.padStart(2, "0")}`;
        matchDay = years.map((value) => `${value}${suffix}`)
          .filter((key) => Number.isFinite(+utcDate(key)) && utcDate(key).toISOString().startsWith(key))
          .sort((a, b) => Math.abs(relativeDays(a, anchor)) - Math.abs(relativeDays(b, anchor)))[0];
      }
      if (matchDay && matchTime !== null) {
        day = matchDay;
        time = matchTime;
      }
    }
    const overdue = day ? day < today || (day === today && time !== null && minute >= time) : item.overdue === true;
    const imminent = day === today && !overdue;
    const tonight = imminent && time !== null && time >= 1080;
    return { day, time, overdue, imminent, tonight, label: overdue ? "Overdue" : tonight ? "Due tonight" : imminent ? "Due today" : null };
  }

  function taskSchedule(data, today, minute) {
    const reported = count(data.tasks?.overdue, data.now?.overdue_tasks);
    if (data.public || data.errors?.tasks) return { tasks: [], overdue: reported, tonight: 0 };
    const snapshot = new Date(data.generated_at ?? NaN);
    const snapshotDay = Number.isFinite(+snapshot) ? clockDate(snapshot) : "";
    const tasks = list(data.tasks?.items).map((item) => ({ item, ...deadlineOf(item, today, minute, snapshotDay) }));
    // Replace only the flags for tasks included in this snapshot's item list.
    const flagged = tasks.filter(({ item }) => item.overdue === true).length;
    const verified = tasks.filter(({ overdue }) => overdue).length;
    const overdue = reported === undefined ? verified || undefined : Math.max(0, reported - flagged) + verified;
    return { tasks, overdue, tonight: tasks.filter(({ tonight }) => tonight).length };
  }
  const datedFirst = (a, b) => (dateKey(a.due) || "9999-12-31").localeCompare(dateKey(b.due) || "9999-12-31");
  const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);
  const calLabel = (cal) => {
    if (/canvas/i.test(cal)) return "Canvas";
    if (/class/i.test(cal)) return "Class";
    if (String(cal ?? "").includes("@")) return /sjsu|school/i.test(cal) ? "School" : "Personal";
    return cal || "Calendar";
  };
  const isSchoolEvent = (item) => {
    const cal = calLabel(item.cal);
    return cal === "Canvas" || cal === "Class" || !!courseOf(item.summary)
      || /^(Term Project|Chapter \d|SJSU Title IX|PART FIVE)/i.test(clean(item.summary));
  };

  function taskCopy(item, omitSubject = false) {
    const title = withoutAside(item.title).replace(titleDeadline, "").replace(/[\s,·—-]+$/, "");
    const separator = title.indexOf(": ");
    const action = separator > -1 ? title.slice(separator + 2) : title;
    const [primary, followup] = action.split(/, then\s/i, 2);
    const shortAction = primary.split(/\s+[—+]\s+/)[0]
      .replace(/\b(website|app) for (?:looking through|browsing|viewing) (?:my |the )?(.+)$/i, "$2 $1");
    if (omitSubject && separator > -1) {
      const second = followup && followup.length <= 12 ? ` · ${sentence(followup)}` : "";
      const compact = shortAction.replace(/\bthe (\d+ )?(teammates['’]) full names\b/i, "$1$2 names");
      return `${sentence(second ? compact.replace(/\s+to the title page$/i, "") : compact)}${second}`;
    }
    return (separator > -1 ? `${title.slice(0, separator)} · ${shortAction}` : shortAction) || DASH;
  }

  function schoolCopy(item) {
    const title = withoutAside(item.title).replace(/^Term Project:\s*/i, "").split(/\s+and\s+|\s+-\s+|\s*[-–]\s*Requires\b/i)[0];
    return title ? [item.course, title].filter(Boolean).join(" · ") : DASH;
  }

  function focusFor(data, today, minute, tasks) {
    const phase = minute < 300 ? "Wind down" : minute < 540 ? "Morning setup" : minute < 720 ? "Class block"
      : minute < 1020 ? "Deep work" : minute < 1260 ? "Evening sprint" : "Wrap up";
    const publicView = !!data.public;
    const weekend = isWeekend(today);
    const candidates = [{
      kicker: "Likely", title: phase, detail: publicView ? "Public view · sign in for details" : "No immediate commitments",
      tone: "soft", score: 10,
    }];
    if (publicView) return candidates[0];
    const { errors } = data;
    for (const item of list(errors?.calendar ? null : data.calendar?.events)) {
      if (dateKey(item.sort) !== today) continue;
      const start = parseTime(item.time);
      if (start === null) continue;
      const reportedEnd = parseTime(item.end_time);
      const end = reportedEnd > start ? reportedEnd : start + 1;
      const label = calLabel(item.cal);
      const common = { hub: "calendar", title: shorten(item.summary, 56), item, tone: label === "Canvas" ? "violet" : "cyan" };
      if (start <= minute && minute < end) {
        candidates.push({
          ...common, kicker: "Now",
          detail: reportedEnd > start ? `Until ${formatTime(end)} · ${label}` : label,
          window: reportedEnd > start ? [start, end] : null, score: 120,
        });
      } else if (start > minute && start - minute <= 120) {
        const wait = start - minute;
        candidates.push({ ...common, kicker: "Next", detail: `In ${wait}m · ${label}`, window: [start - 120, start], score: 85 - wait / 10 });
      }
    }

    for (const { item, day, time, overdue, tonight, label } of tasks) {
      if (!label || (weekend && item.list === "School")) continue;
      const title = withoutAside(item.title);
      const separator = title.indexOf(":");
      const due = time === null ? day && formatDate(day) : day === today ? formatTime(time) : `${formatDate(day)} at ${formatTime(time)}`;
      candidates.push({
        hub: "tasks", item, kicker: label,
        title: shorten(separator > 12 ? title.slice(0, separator) : title, 49),
        detail: [due && `Due ${due}`, item.list || "Task"].filter(Boolean).join(" · "),
        tone: overdue ? "bad" : "warn",
        window: day === today && time > 0 ? [0, time] : null,
        score: overdue ? 95 : tonight ? 94 : 85,
      });
    }

    const stamp = Date.parse(data.generated_at);
    const elapsed = Number.isFinite(stamp) ? Math.max(0, Math.floor((Date.now() - stamp) / 60000)) : 0;
    for (const note of list(errors?.recent ? null : data.recent)) {
      if (!Number.isFinite(note.age_min) || note.age_min < 0) continue;
      const age = note.age_min + elapsed;
      if (age > 180) continue;
      const hub = /project/i.test(note.folder) ? "projects" : "vault";
      candidates.push({
        hub, item: note, kicker: "Working on", title: shorten(note.label, 44),
        detail: `Edited ${age}m ago · ${note.folder || "Vault"}`,
        tone: "cyan", score: age <= 20 ? 92 : age <= 60 ? 80 : 70,
      });
    }

    const next = weekend ? null : list(errors?.school ? null : data.school?.next).find((item) => relativeDays(item.due, today) >= 0);
    if (next) {
      candidates.push({
        hub: "school", item: next, kicker: "Due soon", title: shorten(next.title, 56),
        detail: `Due ${formatDate(next.due)}${next.course ? ` · ${next.course}` : ""}`,
        tone: "violet", score: relativeDays(next.due, today) <= 3 ? 65 : 50,
      });
    }

    return candidates.reduce((best, item) => item.score > best.score ? item : best);
  }

  function model(data) {
    const { now = {}, tasks, school, calendar, brain, homelab, hermes, errors } = data;
    const events = count(calendar?.count, Array.isArray(calendar?.events) ? calendar.events.length : undefined);
    const open = count(tasks?.open, now?.open_tasks);
    const upcoming = count(school?.upcoming, now?.assignments_upcoming);
    const projects = count(now?.active_projects);
    const notes = count(brain?.vault_notes, brain?.notes);
    const failing = count(now?.jobs_failing, hermes?.cron_failing_count);
    const jobs = count(now?.jobs_total, hermes?.cron_active);
    const reachable = now?.homelab_reachable ?? homelab?.reachable;
    const bad = count(now?.homelab_issues_bad, homelab?.issue_counts?.bad);
    const warn = count(now?.homelab_issues_warn, homelab?.issue_counts?.warn);
    const up = count(now?.services_up, homelab?.services_up);
    const total = count(now?.services_total, homelab?.services_total);
    const devicesUp = count(now?.devices_online);
    const devicesTotal = count(now?.devices_total);
    const services = up !== undefined && total !== undefined ? `${up}/${total}` : DASH;
    const devices = devicesUp !== undefined && devicesTotal !== undefined ? `${devicesUp}/${devicesTotal}` : DASH;
    const serviceLoss = up !== undefined && total !== undefined && up < total;
    const mac = hermes?.host ?? {};
    const macCpu = count(mac.cpu_pct);
    const macMem = count(mac.mem_pct)
      ?? (Number.isFinite(mac.mem_used_gb) && Number.isFinite(mac.mem_total_gb) && mac.mem_total_gb > 0
        ? Math.round(mac.mem_used_gb / mac.mem_total_gb * 100) : undefined);
    const p520 = homelab?.host ?? {};
    const p520LoadRaw = Number.parseFloat(list(p520.load)[0]);
    const p520Load = Number.isFinite(p520LoadRaw) ? p520LoadRaw : undefined;
    const p520Mem = Number.isFinite(p520.mem_used_gb) && Number.isFinite(p520.mem_total_gb) && p520.mem_total_gb > 0
      ? Math.round(p520.mem_used_gb / p520.mem_total_gb * 100) : undefined;
    const gpuOwner = clean(homelab?.gpu?.owner_name);
    const gpuMode = clean(homelab?.gpu?.mode).toLowerCase();
    const gpu = gpuOwner ? gpuOwner.replace(/-vm$/i, "").toUpperCase()
      : gpuMode.includes("ai") ? "AI" : gpuMode.includes("media") ? "MEDIA" : DASH;
    const activeRuns = count(hermes?.active_runs);
    const lab = reachable === false ? ["Offline", "bad"]
      : bad > 0 ? [metric(bad, bad === 1 ? "issue" : "issues"), "bad"]
        : warn > 0 ? [metric(warn, warn === 1 ? "warning" : "warnings"), "warn"]
          : serviceLoss ? ["Degraded", "warn"]
            : errors?.homelab ? ["Unavailable", "bad"]
              : reachable === true && bad === 0 && warn === 0 ? ["Clear", "cyan"] : [DASH, "soft"];
    const agent = failing > 0 ? [metric(failing, "failing"), "bad"]
      : errors?.hermes ? ["Unavailable", "bad"]
        : failing === 0 && jobs > 0 ? ["Clear", "cyan"] : jobs === 0 ? ["No jobs", "soft"] : [DASH, "soft"];
    const tone = lab[1] === "bad" || agent[1] === "bad" ? "bad" : lab[1] === "warn" ? "warn"
      : lab[1] === "cyan" && agent[1] === "cyan" ? "cyan" : "soft";
    return { events, open, upcoming, projects, notes, failing, jobs, services, devices, lab, agent, tone, up, total,
      macCpu, macMem, p520Load, p520Mem, gpu, activeRuns };
  }

  function panelState(key, value) {
    if (state.failed && !state.data) return "error";
    if (state.data?.errors?.[key]) return "error";
    if (state.stale) return "stale";
    return value === undefined || value === 0 ? "empty" : "ready";
  }

  function setPanel(id, key, value, meta, label) {
    const status = panelState(key, value);
    $(id).dataset.state = status;
    const text = status === "error" ? "Unavailable" : label;
    setText($(meta), text);
    return status;
  }

  function appendRow(target, text, options = {}) {
    const row = el("li", "rail-row");
    const { lead, tail, title, tone, active, past, textClass } = options;
    if (past) row.dataset.past = "true";
    if (active) row.dataset.active = "true";
    if (tone) row.dataset.tone = tone;
    if (lead) row.append(el("span", `row-time leading ${textClass || ""}`, lead));
    if (text === null) {
      row.classList.add("date-only");
    } else {
      const label = el("span", `row-text${textClass === "week-day" ? " week-title" : ""}`, text);
      if (title) label.title = title;
      row.append(label);
    }
    if (tail) row.append(el("span", textClass === "week-day" ? "row-time week-count" : "row-time", tail));
    target.append(row);
  }

  function finishRail(target, shown, total, empty, status) {
    if (!shown) {
      target.append(el("li", "placeholder rail-empty", status === "error" ? "Data unavailable" : empty));
    } else if (total > shown) {
      target.append(el("li", "row-more", `+${total - shown} more`));
    }
  }

  function matchingAssignment(event, focus) {
    const project = projectOf(event.summary);
    const eventCourse = courseOf(event.summary);
    return focus.hub === "tasks" && event.time === "all-day" && project &&
      project === projectOf(focus.item.title) && eventCourse && eventCourse === courseOf(focus.item.title);
  }

  function scheduleEvents(data, today, minute) {
    return list(data.calendar?.events)
      .filter(({ sort }) => !dateKey(sort) || dateKey(sort) === today)
      .map((item) => {
        const start = parseTime(item.time);
        const end = parseTime(item.end_time);
        const past = start !== null && minute >= Math.max(start + 1, end ?? 0);
        return { item, start, past };
      })
      .sort((a, b) => (a.start ?? 1440) - (b.start ?? 1440));
  }

  function renderSchedule(data, values, focus, today, agenda) {
    const events = $("events");
    const ticks = $("dayticks");
    const disclosure = $("event-more");
    const moreLabel = $("event-more-label");
    const moreRows = $("event-overflow");
    const todayLabel = $("todaylabel");
    const track = $("today").querySelector(".daytrack");
    const hours = $("today").querySelector(".dayhours");
    events.replaceChildren();
    ticks.replaceChildren();
    moreRows.replaceChildren();
    const isPublic = !!data.public;
    const weekend = isWeekend(today);
    const nowMinute = timeInfo().minute;
    const focusCourse = courseOf(focus.item?.summary ?? focus.item?.title ?? focus.item?.course);
    const hasCurrentFocus = focus.hub === "calendar" && agenda.some(({ item, past }) => item === focus.item && !past);
    const hasUpcoming = agenda.some(({ item, start, past }) => item !== focus.item && item.time !== "all-day" && start !== null && !past);
    const nextMode = !hasCurrentFocus && !hasUpcoming;
    const status = setPanel("today", "calendar", values.events || (nextMode && (list(data.calendar?.week).length || list(data.calendar?.week_days).length) ? 1 : 0), "calmeta", metric(values.events, "events"));

    function eventRow(target, { item, start, past }) {
      const lead = start !== null ? formatTime(start) : item.time === "all-day" ? "All day" : DASH;
      const itemCourse = courseOf(item.summary);
      const related = !past && itemCourse && itemCourse === focusCourse;
      const title = clean(item.summary).replace(/^\([^)]*\)\s*/, "").split(/\s+-\s+/)[0];
      appendRow(target, title.replace(" — ", " · ") || DASH, { lead, title: item.summary, active: related, past });
    }

    if (nextMode) {
      setText(todayLabel, "NEXT UP");
      track.hidden = true;
      hours.hidden = true;
      const nextEntries = isPublic ? [] : list(data.calendar?.week)
        .filter((item) => !weekend || !isSchoolEvent(item))
        .filter((item) => {
          const day = dateKey(item.sort);
          if (day > today) return true;
          if (day !== today) return false;
          const start = parseTime(item.time);
          return start !== null && start > nowMinute;
        })
        .map((item) => ({ item, start: parseTime(item.time), date: dateKey(item.sort) }))
        .filter(({ date }) => date)
        .sort((a, b) => a.date.localeCompare(b.date) || ((a.start ?? 0) - (b.start ?? 0)));
      const rows = nextEntries.slice(0, 3);
      const overflow = nextEntries.slice(3);
      const compactDate = (date) => date.slice(0, 7) === today.slice(0, 7)
        ? `${formatWeekday(date)} ${Number(date.slice(8, 10))}`
        : `${formatWeekday(date)} ${formatDate(date)}`;
      for (const { item, start, date } of rows) {
        const title = clean(item.summary).replace(/^\([^)]*\)\s*/, "").split(/\s+-\s+/)[0];
        appendRow(events, title.replace(" — ", " · ") || DASH, {
          lead: compactDate(date),
          tail: start !== null ? formatTime(start) : item.time === "all-day" ? "All day" : DASH,
          title: item.summary,
        });
      }
      for (const { item, start, date } of overflow) {
        const title = clean(item.summary).replace(/^\([^)]*\)\s*/, "").split(/\s+-\s+/)[0];
        appendRow(moreRows, title.replace(" — ", " · ") || DASH, {
          lead: compactDate(date),
          tail: start !== null ? formatTime(start) : item.time === "all-day" ? "All day" : DASH,
          title: item.summary,
        });
      }
      disclosure.hidden = !overflow.length;
      if (disclosure.hidden) disclosure.open = false;
      else setText(moreLabel, `+${overflow.length} more`);
      setText($("calmeta"), isPublic ? "Sign in" : nextEntries.length ? `${nextEntries.length} upcoming` : "Clear");
      if (!rows.length) finishRail(events, 0, 0, isPublic ? "Sign in for details" : "No upcoming events", status);
      ticks.replaceChildren();
    } else {
      setText(todayLabel, "TODAY");
      track.hidden = false;
      hours.hidden = false;
      const eligible = isPublic ? [] : agenda.filter(({ item }) => item !== focus.item)
        .filter(({ item }) => !matchingAssignment(item, focus));
      eligible.sort((a, b) => Number(a.past) - Number(b.past));
      const rows = eligible.slice(0, 3);
      const overflow = eligible.slice(3);
      for (const entry of rows) eventRow(events, entry);
      for (const entry of overflow) eventRow(moreRows, entry);
      disclosure.hidden = !overflow.length;
      if (disclosure.hidden) {
        disclosure.open = false;
      } else {
        setText(moreLabel, `+${overflow.length} more`);
      }
      const tickTimes = new Map();
      for (const entry of agenda) {
        if (entry.start === null) continue;
        const visible = rows.includes(entry) || entry.item === focus.item || isPublic;
        tickTimes.set(entry.start, tickTimes.get(entry.start) || visible);
      }
      for (const [start, visible] of tickTimes) {
        const tick = el("i");
        if (visible) tick.dataset.featured = "true";
        tick.style.left = `${start / 1440 * 100}%`;
        ticks.append(tick);
      }
      const empty = values.events === 0 ? "Clear day" : isPublic ? "Sign in for details" : DASH;
      if (!rows.length && !overflow.length) {
        finishRail(events, 0, 0, focus.hub === "calendar" ? "See current focus" : empty, status);
      }
    }
  }

  function renderActions(data, values, focus, today, taskState) {
    const tasks = $("tasks");
    const school = $("school");
    const weekend = isWeekend(today);
    tasks.replaceChildren();
    school.replaceChildren();
    const nearTasks = taskState.tasks.filter(({ day }) => !day || relativeDays(day, today) <= 7);
    const taskStatus = setPanel("task-panel", "tasks", nearTasks.length, "taskmeta", metric(nearTasks.length, "near"));
    const schoolStatus = setPanel("school-panel", "school", weekend ? values.projects : values.upcoming,
      "schoolmeta", weekend ? metric(values.projects, "active") : metric(values.upcoming, "due"));

    if (data.public || taskStatus === "error") {
      const label = taskState.overdue > 0 ? metric(taskState.overdue, "overdue") : values.open === 0 ? "Clear" : "Sign in for details";
      finishRail(tasks, 0, 0, label, taskStatus);
    } else {
      const represented = focus.hub === "tasks" && !withoutAside(focus.item.title).includes(": ") ? 1 : 0;
      const ranked = nearTasks.filter(({ item }) => !represented || item !== focus.item)
        .sort((a, b) => Number(b.item === focus.item) - Number(a.item === focus.item)
          || Number(b.overdue) - Number(a.overdue) || (a.day || "9999").localeCompare(b.day || "9999")
          || (a.time ?? 1440) - (b.time ?? 1440));
      const rows = ranked.slice(0, 3);
      for (const { item, day, label, overdue, imminent } of rows) {
        const active = item === focus.item;
        appendRow(tasks, taskCopy(item, active), {
          tail: label ?? formatDate(day),
          title: item.title, active, tone: overdue ? "bad" : imminent ? "warn" : "soft",
        });
      }
      finishRail(tasks, rows.length, nearTasks.length - represented,
        represented && !ranked.length ? "See current focus" : nearTasks.length === 0 ? "Nothing near" : DASH, taskStatus);
    }

    if (weekend) {
      $("school-panel").dataset.mode = "projects";
      setText($("schoollabel"), "PROJECTS");
      if (data.public) {
        setText($("schoolmeta"), metric(values.projects, "active"));
        finishRail(school, 0, 0, "Sign in for details", schoolStatus);
      } else {
        const seen = new Set();
        const projectRows = [];
        for (const note of list(data.recent)) {
          if (!/project/i.test(note.folder) || !clean(note.label)) continue;
          const key = clean(note.label).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          projectRows.push({ label: clean(note.label), meta: note.age_min < 60 ? `${note.age_min}m ago` : "Recent" });
        }
        for (const node of list(data.brain?.nodes)) {
          if (node.group !== "projects" || !clean(node.label)) continue;
          const key = clean(node.label).toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          projectRows.push({ label: clean(node.label), meta: "Active" });
        }
        const rows = projectRows.slice(0, 2);
        for (const item of rows) {
          appendRow(school, shorten(item.label, 48), { tail: item.meta, title: item.label, tone: "violet" });
        }
        finishRail(school, rows.length, projectRows.length, values.projects === 0 ? "No active projects" : "Pick a project", schoolStatus);
      }
    } else {
      $("school-panel").dataset.mode = "school";
      setText($("schoollabel"), "SCHOOL DEADLINES");
      const upcoming = data.public || schoolStatus === "error" ? [] : list(data.school?.next)
        .filter((item) => item !== focus.item)
        .sort(datedFirst);
      const rows = upcoming.slice(0, 2);
      for (const item of rows) {
        const days = relativeDays(item.due, today);
        appendRow(school, schoolCopy(item), {
          tail: formatDate(item.due), title: item.title, tone: days < 0 ? "bad" : days <= 3 ? "warn" : "soft",
        });
      }
      const representedByFocus = focus.hub === "school" ? 1 : 0;
      const empty = representedByFocus ? "See current focus" : values.upcoming === 0 ? "Clear" : data.public ? "Sign in for details" : DASH;
      finishRail(school, rows.length, (values.upcoming ?? upcoming.length) - representedByFocus, empty, schoolStatus);
    }
  }

  function projectPulse(data, focus, today) {
    if (data.public) return null;
    const focusText = clean(focus.item?.name ?? focus.item?.title ?? "").toLowerCase();
    const candidates = list(data.projects).filter((project) => {
      if (!project?.name || !["active", "in-progress"].includes(project.status)) return false;
      if (/^\d\d\s|^workshop\s|^intro to\s/i.test(project.name)) return false;
      return !focusText || !focusText.includes(clean(project.name).toLowerCase());
    });
    const withAction = candidates.filter((project) => clean(project.next_action));
    const pool = withAction.length ? withAction : candidates;
    return pool.sort((a, b) => (a.updated || "9999").localeCompare(b.updated || "9999")
      || a.name.localeCompare(b.name))[0] ?? null;
  }

  function renderProjectPulse(data, values, focus, today) {
    const panel = $("project-pulse");
    const project = projectPulse(data, focus, today);
    panel.hidden = !project;
    if (!project) return;
    const age = relativeDays(project.updated, today);
    const ageDays = Number.isFinite(age) ? Math.max(0, -age) : null;
    setText($("projectmeta"), metric(values.projects, "active"));
    setText($("projectstatus"), String(project.status ?? "active").toUpperCase());
    setText($("projectage"), ageDays === null ? DASH : ageDays === 0 ? "TOUCHED TODAY" : `TOUCHED ${ageDays}D AGO`);
    setText($("projectname"), shorten(project.name, 42));
    const next = clean(project.next_action) || clean(project.summary) || "No open action";
    setText($("projectnext"), shorten(next, 92));
    $("projectnext").title = next;
    setText($("projectactions"), project.open_actions ? metric(project.open_actions, "open") : "NEXT ACTION");
    panel.dataset.state = values.projects === 0 ? "empty" : "ready";
  }

  function renderSpotify(data) {
    const panel = $("spotify");
    const spotify = data.spotify;
    const card = $("spotifycard");
    const art = $("spotifyart");
    const note = $("spotifynote");
    art.onerror = () => { art.hidden = true; note.hidden = false; };
    if (!spotify) {
      setText($("spotifystate"), "SPOTIFY");
      setText($("spotifytitle"), "Not connected");
      setText($("spotifyartist"), "Audio signal unavailable");
      setText($("spotifymeta"), DASH);
      return;
    }
    const configured = spotify.configured !== false;
    const title = clean(spotify.title) || "Spotify";
    const artist = list(spotify.artists).join(", ") || clean(spotify.album) || (configured ? "No recent playback" : "Not connected");
    const playing = spotify.isPlaying === true;
    const state = !configured ? "SPOTIFY OFFLINE" : playing ? "NOW LISTENING" : spotify.state === "recent" ? "LAST LISTENED" : "AUDIO SIGNAL";
    setText($("spotifystate"), state);
    setText($("spotifytitle"), title);
    setText($("spotifyartist"), artist);
    setText($("spotifymeta"), !configured ? "OFFLINE" : playing ? "LIVE" : spotify.state === "recent" ? "RECENT" : DASH);
    card.dataset.state = playing ? "playing" : configured ? "recent" : "offline";
    if (spotify.url) {
      card.href = spotify.url;
      card.target = "_blank";
      card.rel = "noreferrer";
    } else {
      card.removeAttribute("href");
    }
    if (spotify.artwork) {
      if (art.getAttribute("src") !== spotify.artwork) art.src = spotify.artwork;
      art.hidden = false;
      note.hidden = true;
    } else {
      art.hidden = true;
      art.removeAttribute("src");
      note.hidden = false;
    }
    let progress = 0;
    if (Number.isFinite(spotify.progressMs) && Number.isFinite(spotify.durationMs) && spotify.durationMs > 0) {
      const elapsed = playing && spotify.updatedAt ? Math.max(0, Date.now() - Date.parse(spotify.updatedAt)) : 0;
      progress = clamp((spotify.progressMs + elapsed) / spotify.durationMs);
    }
    $("spotifyfill").style.width = `${progress * 100}%`;
    panel.dataset.state = configured ? "ready" : "empty";
  }

  function renderActivity(data) {
    const panel = $("activity");
    panel.hidden = !!data.public;
    const note = data.public ? null : list(data.recent).find(({ label }) => clean(label));
    const status = setPanel("activity", "recent", note ? 1 : undefined, "activity-meta", "");
    const stamp = Date.parse(data.generated_at);
    const age = note && Number.isFinite(note.age_min) && note.age_min >= 0 && Number.isFinite(stamp)
      ? note.age_min + Math.max(0, Math.floor((Date.now() - stamp) / 60000)) : null;
    const label = status === "error" ? "Data unavailable" : note ? clean(note.label) : "No recent activity";
    setText($("activity-title"), label);
    setText($("activity-age"), status === "error" || !note ? "" : age === null ? DASH : age < 60 ? `${age}m ago` : `${Math.floor(age / 60)}h ago`);
    if (status === "stale") setText($("activity-meta"), "Stale");
  }

  const HUBS = [
    { id: "tasks", name: "Tasks", x: 50, y: 26, tone: "cyan" },
    { id: "school", name: "School", x: 24, y: 17, tone: "violet" },
    { id: "calendar", name: "Calendar", x: 16, y: 46, tone: "cyan" },
    { id: "projects", name: "Projects", x: 76, y: 17, tone: "violet" },
    { id: "vault", name: "Vault", x: 84, y: 46, tone: "violet" },
    { id: "homelab", name: "Homelab", x: 27, y: 75, tone: "cyan" },
    { id: "hermes", name: "Hermes", x: 73, y: 75, tone: "cyan" },
  ];
  const CENTER = { x: 50, y: 51 };
  const hubName = (id) => HUBS.find((hub) => hub.id === id)?.name;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");

  const radar = (() => {
    const canvas = $("radar");
    const ctx = canvas.getContext("2d");
    const styles = getComputedStyle(document.documentElement);
    const colors = Object.fromEntries(["surface", "line", "fine", "cyan", "soft", "violet", "warn", "bad"]
      .map((key) => [key, styles.getPropertyValue(`--${key}`).trim()]));
    const buttons = new Map();
    let width = 0;
    let height = 0;
    let hubs = {};
    let focus = { tone: "soft" };
    let progress = null;
    let settled = false;
    let activity = new Map();
    let selected = null;
    let hovered = null;
    let keyboard = null;
    let defaultHub = null;
    let frame = 0;
    let lastFrame = 0;

    function place(node, { x, y }) {
      node.style.setProperty("--x", `${x}%`);
      node.style.setProperty("--y", `${y}%`);
      $("hubs").append(node);
    }

    const center = el("span", "hub center");
    center.dataset.tone = "soft";
    center.append(el("span", "hub-name", "Now"));
    place(center, CENTER);

    for (const hub of HUBS) {
      const button = el("button", "hub");
      button.type = "button";
      button.dataset.hub = hub.id;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-controls", "hubdetail");
      if (hub.id === "tasks") button.classList.add("label-above");
      button.append(el("span", "hub-name", hub.name), el("span", "hub-value", DASH));
      buttons.set(hub.id, button);
      place(button, hub);
      button.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch") hovered = hub.id;
        showDetail();
      });
      button.addEventListener("pointerleave", () => {
        hovered = null;
        showDetail();
      });
      button.addEventListener("focus", () => {
        if (button.matches(":focus-visible")) keyboard = hub.id;
        showDetail();
      });
      button.addEventListener("blur", () => {
        keyboard = null;
        showDetail();
      });
      button.addEventListener("click", () => {
        selected = selected === hub.id ? null : hub.id;
        showDetail();
      });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        selected = hovered = keyboard = null;
        showDetail();
      });
    }

    function showDetail() {
      const id = hovered ?? keyboard ?? selected ?? defaultHub;
      const info = hubs[id];
      $("hubdetail").dataset.tone = info?.tone ?? "soft";
      setText($("hubdetail-label"), info ? hubName(id) : "Constellation");
      setText($("hubdetail-text"), info?.detail ?? (state.failed ? "Data unavailable" : DASH));
      for (const [key, button] of buttons) button.setAttribute("aria-pressed", String(key === selected));
    }

    function resize() {
      const box = canvas.getBoundingClientRect();
      width = box.width;
      height = box.height;
      const scale = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      ctx?.setTransform(scale, 0, 0, scale, 0, 0);
      draw(performance.now());
    }

    function ellipse(x, y, rx, ry, color, start = 0, end = Math.PI * 2) {
      if (rx <= 0 || ry <= 0 || end <= start) return;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, start, end);
      ctx.stroke();
    }

    function line(a, b, color) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    function draw(time) {
      if (!ctx || !width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const compact = width < 450;
      const canMove = !motion.matches && settled && !state.stale;
      const origin = { x: width * CENTER.x / 100, y: height * CENTER.y / 100 };
      const ring = compact ? 23 : 48;
      const centerTone = colors[focus.tone];
      ctx.lineWidth = 1;

      const radiusX = width * 0.405;
      const radiusY = height * 0.42;
      ellipse(origin.x, origin.y, radiusX, radiusY, colors.fine);
      ellipse(origin.x, origin.y, radiusX * 0.72, radiusY * 0.70, colors.fine);
      for (let i = 0; i < 24; i += 1) {
        const angle = i * Math.PI / 12;
        const length = i % 6 === 0 ? 7 : 3;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        line({ x: origin.x + x * radiusX, y: origin.y + y * radiusY },
          { x: origin.x + x * (radiusX + length), y: origin.y + y * (radiusY + length) }, colors.line);
      }

      HUBS.forEach(({ id, x, y, tone: domainTone }, index) => {
        const info = hubs[id];
        const active = focus.hub === id;
        const amplitude = canMove ? (compact ? 1.4 : 3.5) : 0;
        const angle = time / 8500 + index * Math.PI * 2 / HUBS.length;
        const anchor = { x: width * x / 100, y: height * y / 100 };
        const point = { x: anchor.x + Math.cos(angle) * amplitude, y: anchor.y + Math.sin(angle) * amplitude };
        const tone = colors[active ? focus.tone : info?.tone ?? "soft"];
        const radius = (compact ? 4 : 5.5) + (active ? (compact ? 2 : 3) : 0);
        const outer = radius + (compact ? 2 : 3);
        if (active) {
          const dx = point.x - origin.x;
          const dy = point.y - origin.y;
          const distance = Math.hypot(dx, dy);
          if (distance > ring + outer) {
            const edge = { x: origin.x + dx * ring / distance, y: origin.y + dy * ring / distance };
            const spokeTone = focus.tone === "bad" ? tone : colors[domainTone];
            ctx.globalAlpha = 0.65;
            line(edge, point, spokeTone);
            ctx.globalAlpha = 1;
          }
        }
        ctx.fillStyle = colors.surface;
        ctx.beginPath();
        ctx.arc(point.x, point.y, outer, 0, Math.PI * 2);
        ctx.fill();
        ellipse(point.x, point.y, outer, outer, active ? tone : colors.line);
        if (info?.level > 0) ellipse(point.x, point.y, outer, outer, tone,
          -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * info.level);
        ctx.fillStyle = tone;
        const dot = active ? 2.5 : 1.5;
        ctx.fillRect(point.x - dot, point.y - dot, dot * 2, dot * 2);
        const pulse = (time - (activity.get(id) ?? -6000)) / 1800;
        if (canMove && pulse >= 0 && pulse < 1) {
          const size = outer + pulse * (compact ? 7 : 12);
          ctx.globalAlpha = (1 - pulse) * 0.6;
          ellipse(point.x, point.y, size, size, tone);
          ctx.globalAlpha = 1;
        }
      });

      ctx.fillStyle = colors.surface;
      ctx.beginPath();
      ctx.arc(origin.x, origin.y, ring, 0, Math.PI * 2);
      ctx.fill();
      ellipse(origin.x, origin.y, ring, ring, colors.line);
      ellipse(origin.x, origin.y, ring - 5, ring - 5, colors.fine);
      if (progress === null) {
        for (let i = 0; i < 4; i += 1) {
          const angle = i * Math.PI / 2 - Math.PI / 4;
          ellipse(origin.x, origin.y, ring, ring, centerTone, angle - 0.10, angle + 0.10);
        }
      } else {
        ellipse(origin.x, origin.y, ring, ring, centerTone, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progress);
      }
    }

    function onFrame(time) {
      frame = 0;
      if (time - lastFrame >= 48) {
        lastFrame = time;
        draw(time);
      }
      syncMotion();
    }

    function syncMotion() {
      const running = settled && !state.stale && !motion.matches && !document.hidden;
      if (running && !frame) frame = requestAnimationFrame(onFrame);
      if (!running && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    motion.addEventListener("change", () => {
      syncMotion();
      draw(performance.now());
    });
    document.addEventListener("visibilitychange", syncMotion);
    new ResizeObserver(resize).observe(canvas);

    return {
      update(next, current, minute, defaultId) {
        const time = performance.now();
        if (settled && !state.stale) {
          for (const { id } of HUBS) {
            if (next[id]?.value !== hubs[id]?.value || next[id]?.detail !== hubs[id]?.detail || next[id]?.signal !== hubs[id]?.signal
              || (current.hub === id && focus.hub !== id)) activity.set(id, time);
          }
        }
        hubs = next;
        focus = current;
        defaultHub = defaultId;
        settled = Object.values(next).some(({ value }) => value !== DASH && value !== "Unavailable");
        progress = current.window ? clamp((minute - current.window[0]) / (current.window[1] - current.window[0])) : null;
        center.dataset.tone = current.tone;
        for (const [id, button] of buttons) {
          button.dataset.tone = next[id]?.tone ?? "soft";
          button.dataset.active = String(id === current.hub);
          setText(button.lastElementChild, next[id]?.value);
        }
        showDetail();
        draw(time);
        syncMotion();
      },
    };
  })();

  function hubData(data, values, focus, agenda, taskState) {
    const isPublic = !!data.public;
    const { open, events, upcoming, projects, notes, lab, agent, jobs, failing, services } = values;
    const { tasks, overdue, tonight } = taskState;
    const upcomingEvent = isPublic ? null : agenda.find(({ past, start, item }) => !past && start !== null && item !== focus.item)?.item;
    const task = tasks.find((entry) => entry.overdue) ?? tasks.find((entry) => entry.tonight) ?? tasks[0];
    const deadline = isPublic ? null : list(data.school?.next)[0];
    const recent = isPublic ? null : list(data.recent).find((note) => /project/i.test(note.folder)) ?? list(data.projects).find((item) => item.status === "active");
    const weekend = isWeekend(clockDate());
    const top = isPublic ? null : data.brain?.top_hub;
    const issue = isPublic ? null : list(data.homelab?.open_issues).find((item) => item.severity === "bad") ?? list(data.homelab?.open_issues)[0];
    const record = (value, tone, level, detail = value, signal) => ({ value, tone, level, detail, signal });
    const hubs = {
      calendar: record(metric(events, "events"), events > 0 ? "cyan" : "soft", events > 0 ? 0.5 : 0,
        upcomingEvent ? `${upcomingEvent.time} · ${shorten(upcomingEvent.summary, 72)}` : metric(events, "events today")),
      school: weekend
        ? record("Off", "soft", 0, "No school deadlines · projects")
        : record(metric(upcoming, "due"), upcoming > 0 ? "violet" : "soft", upcoming > 0 ? 0.6 : 0,
          deadline ? `${formatDate(deadline.due)} · ${schoolCopy(deadline)}` : metric(upcoming, "upcoming deadlines")),
      tasks: record(overdue > 0 ? metric(overdue, "overdue") : tonight > 0 ? metric(tonight, "due tonight") : metric(open, "open"),
        overdue > 0 ? "bad" : tonight > 0 ? "warn" : open > 0 ? "cyan" : "soft",
        overdue > 0 ? 1 : tonight > 0 ? 0.7 : open > 0 ? 0.4 : 0,
        task ? taskCopy(task.item) : metric(open, "open tasks"), open),
      projects: record(metric(projects, "active"), projects > 0 ? "violet" : "soft", projects > 0 ? 0.5 : 0,
        recent ? shorten(recent.label ?? recent.name, 72) : metric(projects, "active projects")),
      vault: record(metric(notes, "notes"), notes > 0 ? "violet" : "soft", notes > 0 ? 0.4 : 0,
        top?.label ? shorten(top.label, 72) : metric(notes, "vault notes")),
      homelab: record(lab[0], lab[1], lab[1] === "cyan" ? 0.5 : lab[1] === "soft" ? 0 : 1,
        issue?.text ? shorten(sentence(issue.text.split(" — ").at(-1)), 72) : services !== DASH ? `${services} services up` : lab[0], services),
      hermes: record(failing === 0 && jobs !== undefined ? metric(jobs, "jobs") : agent[0], agent[1],
        agent[1] === "cyan" ? 0.5 : agent[1] === "bad" ? 1 : 0,
        jobs !== undefined && failing !== undefined ? `${Math.max(0, jobs - failing)}/${jobs} jobs without failures` : agent[0]),
    };
    for (const [id, hub] of Object.entries(hubs)) {
      const key = id === "vault" ? "brain" : id;
      if (panelState(key, hub.value === DASH ? undefined : 1) === "error") {
        hubs[id] = record("Unavailable", "bad", 0);
      }
    }
    return {
      hubs,
      defaultId: lab[1] === "warn" || lab[1] === "bad" ? "homelab" : agent[1] === "bad" ? "hermes"
        : recent && focus.hub !== "projects" ? "projects" : upcomingEvent ? "calendar" : jobs !== undefined ? "hermes" : null,
    };
  }

  const samples = [];

  function recordServices(stamp, { up, total }) {
    if (!Number.isFinite(stamp) || state.stale || up === undefined || !(total > 0) || state.data?.errors?.homelab) return;
    if (samples.length && samples.at(-1).stamp >= stamp) return;
    samples.push({ stamp, value: clamp(up / total) });
    if (samples.length > 12) samples.shift();
  }

  function renderHealth(values) {
    const pct = (value) => value === undefined ? DASH : `${Math.round(value)}%`;
    const load = (value) => value === undefined ? DASH : value.toFixed(1);
    $("health").dataset.state = panelState("health",
      values.macCpu !== undefined || values.p520Mem !== undefined ? 1 : undefined);
    setText($("mac-cpu"), pct(values.macCpu));
    setText($("mac-mem"), pct(values.macMem));
    setText($("p520-load"), load(values.p520Load));
    setText($("p520-mem"), pct(values.p520Mem));
    setText($("p520-gpu"), values.gpu);
    setText($("hermes-runs"), values.activeRuns === undefined ? DASH : String(values.activeRuns));
  }

  function render() {
    const data = state.data ?? {};
    const time = timeInfo();
    const today = clockDate();
    const values = model(data);
    const taskState = taskSchedule(data, today, time.minute);
    const agenda = data.errors?.calendar ? [] : scheduleEvents(data, today, time.minute);
    const hasFocusData = !!(data.public || data.calendar || data.tasks || data.school || data.recent);
    const focus = hasFocusData ? focusFor(data, today, time.minute, taskState.tasks) : {
      title: DASH, kicker: state.failed ? "Unavailable" : DASH, tone: state.failed ? "bad" : "soft",
    };
    $("focus").dataset.state = panelState("focus", hasFocusData ? 1 : undefined);
    $("focus").dataset.tone = focus.tone;
    document.documentElement.style.setProperty("--focus-tone", `var(--${focus.tone})`);
    setText($("focuskicker"), focus.kicker);
    setText($("focustitle"), focus.title);
    setText($("focusdetail"), focus.detail);
    $("signin").hidden = !data.public;

    renderSchedule(data, values, focus, today, agenda);
    renderActions(data, values, focus, today, taskState);
    renderProjectPulse(data, values, focus, today);
    renderSpotify(data);
    renderHealth(values);
    const { hubs, defaultId } = hubData(data, values, focus, agenda, taskState);
    const available = Object.values(hubs).some(({ value }) => value !== DASH && value !== "Unavailable");
    const status = panelState("constellation", available ? 1 : undefined);
    $("constellation").dataset.state = status;
    const mapLabel = status === "error" ? "Unavailable" : status === "stale" ? "Stale" : available ? "—" : "No data";
    $("mapmeta").hidden = available && status === "ready";
    setText($("mapmeta"), mapLabel);
    radar.update(hubs, focus, time.minute, defaultId);
  }

  function refreshSource(now) {
    const stamp = Date.parse(state.data?.generated_at);
    const minutes = Number.isFinite(stamp) ? Math.max(0, Math.floor((now - stamp) / 60000)) : null;
    const stale = !!state.data && (state.failed || (minutes !== null && minutes >= (state.source === "Live" ? 15 : 480)));
    const status = state.failed && !state.data ? "Offline" : stale ? "Stale" : state.data?.public ? "Public" : state.source || DASH;
    if (state.stale !== stale) {
      state.stale = stale;
      render();
    }
    setText($("source"), status);
    $("source").dataset.tone = status === "Offline" ? "bad" : stale ? "warn" : status === "Live" ? "cyan" : "soft";
    setText($("updated"), minutes === null ? DASH : minutes < 1 ? "Updated now" : minutes < 60 ? `Updated ${minutes}m ago` : `Updated ${Math.floor(minutes / 60)}h ago`);
  }

  function clock() {
    const now = new Date();
    const time = timeInfo(now);
    setText($("clock"), time.face);
    setText($("secs"), `:${String(time.second).padStart(2, "0")}`);
    setText($("ampm"), time.period);
    setText($("dayline"), dayFormat.format(now));
    $("dayline").dateTime = clockDate(now);
    $("secfill").style.width = `${time.second / 60 * 100}%`;
    const dayProgress = `${(time.minute + time.second / 60) / 1440 * 100}%`;
    $("dayfill").style.width = dayProgress;
    $("daynow").style.left = dayProgress;
    refreshSource(+now);
    if (state.weather && !state.weatherFailed && +now - state.weather.receivedAt >= 1800000 && $("weather").dataset.state !== "stale") {
      renderWeather();
    }
  }
  const WMO = {
    0: "CLEAR", 1: "MOSTLY CLEAR", 2: "PARTLY CLOUDY", 3: "OVERCAST",
    45: "FOG", 48: "FREEZING FOG",
    51: "LIGHT DRIZZLE", 53: "DRIZZLE", 55: "HEAVY DRIZZLE",
    56: "FREEZING DRIZZLE", 57: "FREEZING DRIZZLE",
    61: "LIGHT RAIN", 63: "RAIN", 65: "HEAVY RAIN",
    66: "FREEZING RAIN", 67: "FREEZING RAIN",
    71: "LIGHT SNOW", 73: "SNOW", 75: "HEAVY SNOW", 77: "SNOW GRAINS",
    80: "LIGHT SHOWERS", 81: "SHOWERS", 82: "HEAVY SHOWERS",
    85: "SNOW SHOWERS", 86: "SNOW SHOWERS",
    95: "THUNDERSTORM", 96: "THUNDERSTORM", 99: "THUNDERSTORM",
  };

  const SVG = (body, view = "0 0 48 48") =>
    `<svg viewBox="${view}" aria-hidden="true">${body}</svg>`;

  const ICONS = {
    sun: SVG('<circle cx="24" cy="24" r="7.5"/><path d="M24 6v5M24 37v5M6 24h5M37 24h5M11.3 11.3l3.5 3.5M33.2 33.2l3.5 3.5M36.7 11.3l-3.5 3.5M14.8 33.2l-3.5 3.5"/>'),
    moon: SVG('<path d="M29 8a16 16 0 1 0 11 27A17 17 0 0 1 29 8Z"/>'),
    partly: SVG('<circle cx="18" cy="17" r="5.5"/><path d="M18 6v4M18 24v3M7 17h4M25 17h3M10.2 9.2l2.8 2.8M23 22.2l2.8 2.8"/><path d="M17 30h15a6 6 0 0 0 0-12 8 8 0 0 0-15 4 4 4 0 0 0 0 8Z"/>'),
    cloud: SVG('<path d="M13 33h22a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-3 16Z"/>'),
    rain: SVG('<path d="M13 29h22a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-3 16Z"/><path d="M16 35l-2 5M24 35l-2 5M32 35l-2 5"/>'),
    drizzle: SVG('<path d="M13 29h22a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-3 16Z"/><path d="M19 35v3M27 35v3M35 35v3"/>'),
    snow: SVG('<path d="M13 27h22a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-3 16Z"/><path d="M17 35h.1M24 38h.1M31 35h.1"/>'),
    storm: SVG('<path d="M13 27h22a7 7 0 0 0 0-14 10 10 0 0 0-19-2 8 8 0 0 0-3 16Z"/><path d="M26 27l-4 8h5l-2 7 7-10h-5l3-5"/>'),
    fog: SVG('<path d="M10 18h28M7 25h30M12 32h24M15 39h18"/>'),
  };

  function iconFor(code, isDay = 1) {
    const c = Number(code);
    if (c === 0 || c === 1) return isDay ? ICONS.sun : ICONS.moon;
    if (c === 2) return ICONS.partly;
    if (c === 3) return ICONS.cloud;
    if (c === 45 || c === 48) return ICONS.fog;
    if (c >= 71 && c <= 77) return ICONS.snow;
    if (c === 85 || c === 86) return ICONS.snow;
    if (c >= 95) return ICONS.storm;
    if (c === 51 || c === 53 || c === 55 || c === 56 || c === 57) return ICONS.drizzle;
    if (c >= 61) return ICONS.rain;
    return ICONS.cloud;
  }

  async function getJSON(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(String(response.status));
      const type = response.headers.get("content-type") || "";
      if (!type.includes("json")) throw new Error("not json");
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }


  function temperature(value) {
    return Number.isFinite(value) ? `${Math.round(value)}°` : DASH;
  }

  function renderWeather() {
    const weather = state.weather;
    const daily = weather?.daily;
    const current = weather?.current;
    const temp = temperature(current?.temperature_2m);
    const condition = Number.isInteger(current?.weather_code) ? WMO[current.weather_code] : undefined;
    const old = weather && (state.weatherFailed || Date.now() - weather.receivedAt >= 1800000);
    const status = old ? "stale" : state.weatherFailed ? "error" : temp === DASH && !condition ? "empty" : "ready";
    $("weather").dataset.state = status;
    setText($("wtemp"), temp);
    setText($("wcond"), status === "stale" ? "Weather stale" : status === "error" ? "Unavailable" : condition ?? DASH);
    const high = temperature(daily?.temperature_2m_max?.[0]);
    const low = temperature(daily?.temperature_2m_min?.[0]);
    setText($("wrange"), high === DASH && low === DASH ? DASH : `${high} / ${low}`);
    $("wicon").innerHTML = condition ? iconFor(current.weather_code, current.is_day) : "";

    const forecast = $("forecast");
    forecast.replaceChildren();
    const days = list(daily?.time).slice(1, 2);
    forecast.dataset.state = days.length ? status : status === "ready" ? "empty" : status;
    for (const [index, date] of days.entries()) {
      const day = el("span", "forecast-day");
      day.append(el("span", "", "TOMORROW"),
        el("b", "", `${temperature(daily?.temperature_2m_max?.[index + 1])} / ${temperature(daily?.temperature_2m_min?.[index + 1])}`));
      forecast.append(day);
    }
    if (!days.length) setText(forecast, DASH);
  }

  async function weather() {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=37.3382&longitude=-121.8863"
      + "&current=temperature_2m,is_day,weather_code"
      + "&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset"
      + "&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&forecast_days=2";
    try {
      state.weather = { ...await getJSON(url), receivedAt: Date.now() };
      state.weatherFailed = false;
    } catch {
      state.weatherFailed = true;
    }
    renderWeather();
  }

  async function load() {
    try {
      const data = await getJSON(IS_WALL ? "./dashboard.json" : "/dashboard/data");
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("invalid dashboard payload");
      state.data = data;
      state.source = IS_WALL ? "Live" : "Snapshot";
      state.failed = false;
    } catch {
      state.failed = true;
    }
    refreshSource(Date.now());
    if (state.data) recordServices(Date.parse(state.data.generated_at), model(state.data));
    render();
  }

  clock();
  render();
  load();
  weather();
  setInterval(clock, 1000);
  setInterval(render, 15000);
  setInterval(load, 300000);
  setInterval(weather, 900000);
})();
