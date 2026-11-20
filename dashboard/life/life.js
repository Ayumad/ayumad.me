/* life.js — one screen, no dependencies. Visual encoding first: a day rail,
   rings, bars, due-date meters, and weather icons. Text carries names and
   times only. Public data is counts; signed-in and wall data carry titles. */
(() => {
  "use strict";

  const LA = "America/Los_Angeles";
  const $ = (id) => document.getElementById(id);
  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c]);

  let generatedAt = null;
  let sourceLabel = "SNAPSHOT";
  let sunRiseMin = null;
  let sunSetMin = null;

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

  const todayKey = () => dayKey(0);

  function dayKey(offset = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: LA, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(date);
  }

  function calLabel(cal) {
    const value = String(cal || "").trim();
    if (!value) return "";
    if (/canvas/i.test(value)) return "CANVAS";
    if (value.includes("@")) return /sjsu|school/i.test(value) ? "SCHOOL" : "PERSONAL";
    if (/class/i.test(value)) return "CLASS";
    return value.toUpperCase();
  }

  function calClass(cal) {
    const label = calLabel(cal);
    if (label === "CLASS") return "class";
    if (label === "CANVAS") return "canvas";
    if (label === "PERSONAL") return "personal";
    return "";
  }

  function updateAge() {
    if (!generatedAt) {
      $("updated").textContent = "—";
      return;
    }
    const minutes = Math.max(0, Math.round((Date.now() - Date.parse(generatedAt)) / 60000));
    if (!Number.isFinite(minutes)) $("updated").textContent = "—";
    else if (minutes < 1) $("updated").textContent = `${sourceLabel} NOW`;
    else if (minutes < 60) $("updated").textContent = `${sourceLabel} ${minutes}M AGO`;
    else $("updated").textContent = `${sourceLabel} ${Math.round(minutes / 60)}H AGO`;
  }

  function clock() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: LA, hour: "numeric", minute: "2-digit", hour12: true,
    }).formatToParts(now);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    $("clock").textContent = `${get("hour")}:${get("minute")}`;
    $("secs").textContent = ":" + String(now.getSeconds()).padStart(2, "0");
    $("secfill").style.width = `${(now.getSeconds() / 60) * 100}%`;
    $("ampm").textContent = get("dayPeriod").toUpperCase();
    $("dayline").textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: LA, weekday: "long", month: "long", day: "numeric", year: "numeric",
    }).format(now).toUpperCase();
    $("hdate").textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: LA, weekday: "short", month: "short", day: "numeric",
    }).format(now).toUpperCase();
    updateRailNow();
    updateSun();
    updateAge();
  }

  function updateSun() {
    if (sunRiseMin === null || sunSetMin === null || sunSetMin <= sunRiseMin) return;
    const progress = Math.max(0, Math.min(1, (nowMinutesLA() - sunRiseMin) / (sunSetMin - sunRiseMin)));
    const angle = Math.PI * (1 - progress);
    const x = 150 + 132 * Math.cos(angle);
    const y = 80 - 66 * Math.sin(angle);
    $("sundot").setAttribute("cx", x.toFixed(1));
    $("sundot").setAttribute("cy", y.toFixed(1));
  }

  function updateRailNow() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: LA, hour: "numeric", minute: "numeric", hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === "hour")?.value || 0) % 24;
    const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
    $("railnow").style.left = `${((hour * 60 + minute) / 1440) * 100}%`;
  }

  function parseHours(time) {
    const match = String(time || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hour = Number(match[1]) % 12;
    if (/PM/i.test(match[3])) hour += 12;
    return hour + Number(match[2]) / 60;
  }

  function renderRail(events) {
    const timed = events.filter((event) => event.time !== "all-day");
    $("railevents").innerHTML = timed.map((event) => {
      const hours = parseHours(event.time);
      if (hours === null) return "";
      return `<i class="rev" style="left:${(hours / 24) * 100}%;background:${eventColor(event.cal)}"></i>`;
    }).join("");
  }

  function eventColor(cal) {
    const cls = calClass(cal);
    if (cls === "class") return "var(--cyan)";
    if (cls === "canvas") return "var(--violet)";
    if (cls === "personal") return "var(--warn)";
    return "var(--soft)";
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

  function fmtDate(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return String(value || "").toUpperCase();
    const date = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00Z`);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC", month: "short", day: "numeric",
    }).format(date).toUpperCase();
  }

  function fmtClock(iso) {
    const minutes = wallMinutes(iso);
    if (minutes === null) return "—";
    let hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const suffix = hour >= 12 ? "PM" : "AM";
    hour %= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
  }

  function wallMinutes(iso) {
    const match = String(iso || "").match(/T(\d{2}):(\d{2})/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  }

  function nowMinutesLA() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: LA, hour: "numeric", minute: "numeric", hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === "hour")?.value || 0) % 24;
    const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
    return hour * 60 + minute;
  }

  function daysUntil(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const target = Date.parse(`${match[1]}-${match[2]}-${match[3]}T12:00:00Z`);
    return Math.floor((target - Date.now()) / 86400000);
  }

  function dueInfo(value, horizon = 30) {
    const days = daysUntil(value);
    if (days === null) return { pct: 0, cls: "", label: "" };
    const pct = Math.max(3, Math.min(100, 100 - (days / horizon) * 90));
    const cls = days < 0 ? "bad" : days <= 3 ? "warn" : "";
    return { pct, cls, days };
  }

  function dueBar(value, horizon = 30) {
    const info = dueInfo(value, horizon);
    if (info.days === null) return "";
    const cls = info.cls ? ` ${info.cls}` : "";
    return `<span class="duebar"><i class="${cls.trim()}" style="width:${info.pct}%"></i></span>`;
  }

  function renderCalendar(data, isPublic) {
    const events = Array.isArray(data.calendar?.events) ? data.calendar.events : [];
    const count = Number.isFinite(data.calendar?.count) ? data.calendar.count : events.length;
    $("calmeta").textContent = count ? `${count} EVENT${count === 1 ? "" : "S"}` : "CLEAR";
    renderRail(events);

    if (isPublic) {
      const total = Math.max(1, events.length);
      const timed = events.filter((event) => event.time !== "all-day").length;
      const allDay = Math.max(0, events.length - timed);
      const timedPct = (timed / total) * 100;
      const gap = allDay ? 2 : 0;
      const timedArc = Math.max(0, timedPct - gap);
      const allDayArc = allDay ? Math.max(0, 100 - timedPct - gap) : 0;
      const next = events.find((event) => event.time && event.time !== "all-day")?.time;
      $("events").innerHTML = `
        <div class="pub">
          <div class="pubring">
            <svg viewBox="0 0 120 120">
              <circle class="bg" cx="60" cy="60" r="46" pathLength="100" />
              <circle class="seg timed" cx="60" cy="60" r="46" pathLength="100"
                stroke-dasharray="${timedArc} ${100 - timedArc}" stroke-dashoffset="0" />
              <circle class="seg allday" cx="60" cy="60" r="46" pathLength="100"
                stroke-dasharray="${allDayArc} ${100 - allDayArc}"
                stroke-dashoffset="${-timedPct}" />
            </svg>
            <div class="pub-center"><b>${count}</b><small>EVENTS</small></div>
          </div>
          <div>
            <div class="publegend">
              <span><i></i>${timed} TIMED</span>
              <span><i class="violet"></i>${allDay} ALL DAY</span>
            </div>
            <div class="pubnext"><span>NEXT</span> ${next ? esc(next) : "—"}</div>
            <div class="pubsign">Sign in for titles</div>
          </div>
        </div>`;
      renderWeek(data.calendar?.week_count ?? 0, true, data.calendar?.week_days);
      return;
    }

    if (!events.length) {
      $("events").innerHTML = `<div class="empty">clear day</div>`;
      renderWeek(data.calendar?.week, false);
      return;
    }

    const today = todayKey();
    const tomorrow = dayKey(1);
    const rows = events.slice(0, 4).map((event) => {
      const allDay = event.time === "all-day";
      const sortDate = String(event.sort || "").slice(0, 10);
      const dueLater = allDay && sortDate > today;
      const dueLabel = sortDate === tomorrow ? "DUE TOMORROW" : "DUE SOON";
      const label = allDay ? (dueLater ? dueLabel : "ALL DAY") : event.time || "—";
      const cls = calClass(event.cal);
      return `
        <div class="ev">
          <i class="ev-bar ${cls}"></i>
          <div class="ev-t ${allDay ? "allday" : ""}">${esc(label)}</div>
          <div>
            <div class="ev-n">${esc(event.summary || "untitled")}</div>
            <div class="ev-c ${cls}">${esc(calLabel(event.cal))}</div>
          </div>
        </div>`;
    }).join("");
    const more = events.length > 4
      ? `<div class="more">+ ${events.length - 4} MORE</div>`
      : "";
    $("events").innerHTML = rows + more;
    renderWeek(data.calendar?.week, false);
  }

  function renderWeek(week, isPublic, weekDays) {
    const block = $("week");
    const rows = $("weekrows");
    const chart = $("weekchart");
    const meta = $("weekmeta");

    if (isPublic) {
      const count = Number(week) || 0;
      const days = Array.isArray(weekDays) ? weekDays.slice(-7) : [];
      block.hidden = count === 0;
      meta.textContent = `${count} ITEMS`;
      rows.innerHTML = "";
      chart.hidden = days.length === 0;
      if (!days.length) return;
      const max = Math.max(1, ...days.map((day) => Number(day.count) || 0));
      chart.innerHTML = days.map((day) => {
        const date = String(day.date || "");
        const label = date
          ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "narrow" })
              .format(new Date(`${date}T12:00:00Z`))
          : "·";
        const height = Math.max(2, ((Number(day.count) || 0) / max) * 100);
        return `<span class="wbar ${date === todayKey() ? "today" : ""}">
          <i style="height:${height}%"></i><small>${esc(label)}</small></span>`;
      }).join("");
      return;
    }

    const items = Array.isArray(week) ? week : [];
    const groups = new Map();
    for (const event of items) {
      const date = String(event.sort || "").slice(0, 10);
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date).push(event);
    }
    const days = [...groups.entries()].slice(0, 5);
    const max = Math.max(1, ...days.map(([, events]) => events.length));
    block.hidden = days.length === 0;
    meta.textContent = items.length ? `${items.length} ITEMS` : "";
    chart.hidden = true;
    rows.innerHTML = days.map(([date, events]) => {
      const day = date
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: "UTC", weekday: "short", month: "short", day: "numeric",
          }).format(new Date(`${date}T12:00:00Z`)).toUpperCase()
        : "—";
      return `
        <div class="wrow">
          <span class="wday">${esc(day)}</span>
          <span class="wcount"><b>${events.length}</b><i><em style="width:${(events.length / max) * 100}%"></em></i></span>
          <span class="wname">${esc(events[0].summary || "untitled")}</span>
        </div>`;
    }).join("");
  }

  function renderTasks(data, isPublic) {
    const tasks = data.tasks || {};
    const open = Number(tasks.open) || 0;
    const overdue = Number(tasks.overdue) || 0;
    $("taskmeta").textContent = `${open} OPEN`;

    if (isPublic) {
      const ratio = open + overdue ? open / (open + overdue) : 0;
      $("tasks").innerHTML = `
        <div class="row-count"><span class="countbar"><i style="width:${ratio * 100}%"></i></span>${open} OPEN</div>
        <div class="row-count"><span class="countbar"><i style="width:${overdue ? Math.min(100, overdue / Math.max(1, open) * 100) : 0}%;background:var(--bad)"></i></span>${overdue} OVERDUE</div>`;
      return;
    }

    const items = Array.isArray(tasks.items) ? tasks.items.slice(0, 4) : [];
    $("tasks").innerHTML = items.length
      ? items.map((item) => {
          const dot = item.overdue ? "bad" : "";
          return `
            <div class="row">
              <i class="row-dot ${dot}"></i>
              <div class="row-body">
                <div class="row-t">${esc(item.title || "untitled")}</div>
                <div class="row-m ${item.overdue ? "bad" : ""}">
                  ${dueBar(item.due, 30)}${item.overdue ? "OVERDUE" : fmtDate(item.due) || "NO DATE"}
                </div>
              </div>
            </div>`;
        }).join("")
      : `<div class="empty">clear</div>`;
  }

  function renderSchool(data, isPublic) {
    const school = data.school || {};
    const upcoming = Number(school.upcoming) || 0;
    $("schoolmeta").textContent = `${upcoming} UPCOMING`;

    if (isPublic) {
      const ratio = Math.min(1, upcoming / 7);
      $("school").innerHTML = `
        <div class="row-count"><span class="countbar"><i style="width:${ratio * 100}%"></i></span>${upcoming} UPCOMING</div>`;
      return;
    }

    const next = Array.isArray(school.next) ? school.next.slice(0, 2) : [];
    $("school").innerHTML = next.length
      ? next.map((item) => `
          <div class="row">
            <i class="row-dot ${item.overdue ? "bad" : "warn"}"></i>
            <div class="row-body">
              <div class="row-t">${esc(item.title || item.course || "untitled")}</div>
              <div class="row-m">
                <span class="cchip">${esc(item.course || "—")}</span>
                ${dueBar(item.due, 7)}${fmtDate(item.due)}
              </div>
            </div>
          </div>`).join("")
      : `<div class="empty">clear</div>`;
  }

  function setBar(id, pct, color) {
    const bar = $(id);
    if (!bar) return;
    bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    if (color) bar.style.background = color;
  }

  function renderPulse(data) {
    const now = data.now || {};
    const failing = Number(now.jobs_failing) || 0;
    const bad = (Number(now.homelab_issues_bad) || 0) + failing;
    const warn = Number(now.homelab_issues_warn) || 0;
    const dot = $("dot");

    if (bad > 0) {
      $("pulse").textContent = `${bad} ISSUE${bad === 1 ? "" : "S"}`;
      dot.className = "dot bad";
    } else if (warn > 0) {
      $("pulse").textContent = `${warn} WARNING${warn === 1 ? "" : "S"}`;
      dot.className = "dot warn";
    } else {
      $("pulse").textContent = "ALL CLEAR";
      dot.className = "dot ok";
    }

    const jobsTotal = Number(now.jobs_total) || 0;
    const jobsActive = Math.max(0, jobsTotal - failing);
    const ctrRunning = Number(now.containers_running) || 0;
    const ctrTotal = Number(data.homelab?.containers?.total) || ctrRunning || 1;
    const devOnline = Number(now.devices_online) || 0;
    const devTotal = Number(now.devices_total) || 1;
    const issues = bad + warn;

    setBar("bar-jobs", jobsTotal ? (jobsActive / jobsTotal) * 100 : 0);
    setBar("bar-ctr", (ctrRunning / ctrTotal) * 100);
    setBar("bar-dev", (devOnline / devTotal) * 100);
    setBar("bar-iss", issues ? Math.min(100, issues * 25) : 0, bad ? "var(--bad)" : "var(--warn)");
    $("val-jobs").textContent = jobsTotal ? `${jobsActive}/${jobsTotal}` : "—";
    $("val-ctr").textContent = ctrRunning ? `${ctrRunning}/${ctrTotal}` : "—";
    $("val-dev").textContent = devTotal ? `${devOnline}/${devTotal}` : "—";
    $("val-iss").textContent = issues || "0";
  }

  const BRAIN_NODES = [
    { id: "HERMES", label: "HERMES", x: 0.14, y: 0.36, r: 5.5, amp: 4, group: "ops", key: "HERMES" },
    { id: "HOMELAB", label: "HOMELAB", x: 0.22, y: 0.58, r: 4.8, amp: 3, group: "ops", key: "HOMELAB" },
    { id: "P520", label: "", x: 0.07, y: 0.18, r: 3.5, amp: 3, group: "ops" },
    { id: "DOCKER", label: "", x: 0.28, y: 0.16, r: 3.5, amp: 2.5, group: "ops" },
    { id: "NAS", label: "", x: 0.08, y: 0.7, r: 3, amp: 2.5, group: "ops" },
    { id: "NETWORK", label: "", x: 0.2, y: 0.84, r: 2.8, amp: 2, group: "ops" },
    { id: "MEDIA", label: "", x: 0.34, y: 0.5, r: 3.2, amp: 3, group: "ops" },
    { id: "OPS", label: "", x: 0.36, y: 0.3, r: 2.8, amp: 2, group: "ops" },
    { id: "VAULT", label: "VAULT", x: 0.5, y: 0.5, r: 7, amp: 2, group: "core", key: "VAULT" },
    { id: "PROJECTS", label: "PROJECTS", x: 0.43, y: 0.2, r: 5, amp: 3, group: "knowledge", key: "PROJECTS" },
    { id: "WEBSITE", label: "", x: 0.58, y: 0.12, r: 3.5, amp: 2.5, group: "knowledge" },
    { id: "RAG", label: "", x: 0.62, y: 0.3, r: 3.5, amp: 2.5, group: "knowledge" },
    { id: "AI", label: "", x: 0.7, y: 0.48, r: 4, amp: 3, group: "knowledge" },
    { id: "VOICE", label: "", x: 0.58, y: 0.68, r: 3, amp: 2.5, group: "knowledge" },
    { id: "SKETCH", label: "", x: 0.44, y: 0.78, r: 3, amp: 2.5, group: "knowledge" },
    { id: "CALENDAR", label: "CALENDAR", x: 0.84, y: 0.26, r: 5, amp: 2.5, group: "life", key: "CALENDAR" },
    { id: "TASKS", label: "TASKS", x: 0.9, y: 0.48, r: 5, amp: 2.5, group: "life", key: "TASKS" },
    { id: "SCHOOL", label: "SCHOOL", x: 0.77, y: 0.14, r: 4, amp: 2.5, group: "life", key: "SCHOOL" },
    { id: "ACM", label: "", x: 0.93, y: 0.72, r: 3, amp: 2, group: "life" },
    { id: "JOURNAL", label: "", x: 0.78, y: 0.82, r: 3, amp: 2.5, group: "life" },
    { id: "GEAR", label: "", x: 0.64, y: 0.88, r: 3, amp: 2, group: "life" },
    { id: "AUDIO", label: "", x: 0.5, y: 0.92, r: 2.5, amp: 2, group: "life" },
    { id: "GAMING", label: "", x: 0.85, y: 0.92, r: 2.5, amp: 2, group: "life" },
  ];

  const BRAIN_LINKS = [
    ["HERMES", "P520"], ["HERMES", "DOCKER"], ["HERMES", "OPS"], ["HERMES", "HOMELAB"], ["HERMES", "PROJECTS"], ["HERMES", "VAULT"],
    ["HOMELAB", "P520"], ["HOMELAB", "DOCKER"], ["HOMELAB", "NAS"], ["HOMELAB", "MEDIA"], ["HOMELAB", "NETWORK"],
    ["P520", "DOCKER"], ["P520", "NETWORK"], ["DOCKER", "MEDIA"], ["NAS", "MEDIA"], ["MEDIA", "OPS"],
    ["VAULT", "PROJECTS"], ["VAULT", "CALENDAR"], ["VAULT", "TASKS"], ["VAULT", "SCHOOL"], ["VAULT", "JOURNAL"],
    ["PROJECTS", "WEBSITE"], ["PROJECTS", "RAG"], ["PROJECTS", "AI"], ["PROJECTS", "VOICE"], ["PROJECTS", "SKETCH"],
    ["WEBSITE", "RAG"], ["RAG", "AI"], ["AI", "VOICE"],
    ["CALENDAR", "TASKS"], ["CALENDAR", "SCHOOL"], ["CALENDAR", "ACM"], ["CALENDAR", "JOURNAL"],
    ["TASKS", "SCHOOL"], ["SCHOOL", "ACM"], ["JOURNAL", "GEAR"], ["GEAR", "AUDIO"], ["GEAR", "GAMING"], ["TASKS", "GEAR"],
  ];

  const BRAIN = (() => {
    const canvas = $("brain");
    if (!canvas) return { setActivity() {} };
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const groups = { ops: "#48efd0", knowledge: "#777fc4", life: "#e0b070", core: "#e5f4f2" };
    const nodes = BRAIN_NODES.map((node) => ({
      ...node,
      phase: Math.random() * Math.PI * 2,
      speed: 0.12 + Math.random() * 0.18,
    }));
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const links = BRAIN_LINKS.map(([a, b]) => ({ a: byId.get(a), b: byId.get(b) })).filter((link) => link.a && link.b);
    const meta = $("brainmeta");
    if (meta) meta.textContent = `${nodes.length} NODES`;
    const activity = Object.create(null);
    const pulses = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let nextPulse = 0;
    let hover = null;
    let lastDraw = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      w = rect.width;
      h = rect.height;
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    function point(node, time) {
      const drift = reduce ? 0 : 1;
      return {
        x: node.x * w + Math.sin(time * node.speed + node.phase) * node.amp * drift,
        y: node.y * h + Math.cos(time * node.speed * 1.4 + node.phase) * node.amp * 0.65 * drift,
      };
    }

    function level(node) {
      return activity[node.key] ?? 0;
    }

    function draw(time) {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      for (const link of links) {
        const a = point(link.a, time);
        const b = point(link.b, time);
        const act = Math.max(level(link.a), level(link.b));
        ctx.strokeStyle = act > 0.55 ? "rgba(72,239,208,0.28)" : "rgba(72,239,208,0.10)";
        ctx.lineWidth = act > 0.55 ? 1.1 : 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let i = pulses.length - 1; i >= 0; i -= 1) {
        const pulse = pulses[i];
        const progress = (time - pulse.start) / pulse.dur;
        if (progress >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        const a = point(pulse.link.a, time);
        const b = point(pulse.link.b, time);
        const x = a.x + (b.x - a.x) * progress;
        const y = a.y + (b.y - a.y) * progress;
        ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.9;
        ctx.fillStyle = "#48efd0";
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (const node of nodes) {
        const p = point(node, time);
        const act = level(node);
        if (act > 0.5) {
          const phase = ((time / 1000 + node.phase) % 2.4) / 2.4;
          ctx.globalAlpha = (1 - phase) * 0.28 * act;
          ctx.strokeStyle = groups[node.group] || groups.ops;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, node.r + 3 + phase * 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = groups[node.group] || groups.ops;
        ctx.beginPath();
        ctx.arc(p.x, p.y, node.r, 0, Math.PI * 2);
        ctx.fill();
        if (node.label || hover === node) {
          ctx.fillStyle = node.group === "core" ? "#e5f4f2" : "#9bb7b3";
          ctx.font = `${node.group === "core" ? 10 : 9}px "SFMono-Regular", Consolas, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(node.label || node.id, p.x, p.y + node.r + 4);
        }
      }
    }

    function loop(time) {
      if (!document.hidden && time - lastDraw > 32) {
        lastDraw = time;
        if (!reduce && time > nextPulse) {
          const link = links[Math.floor(Math.random() * links.length)];
          if (link) pulses.push({ link, start: time, dur: 900 + Math.random() * 700 });
          nextPulse = time + 700 + Math.random() * 1200;
        }
        draw(time);
      }
      requestAnimationFrame(loop);
    }

    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let nearest = null;
      let distance = 18;
      for (const node of nodes) {
        const p = point(node, performance.now());
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < distance) {
          distance = d;
          nearest = node;
        }
      }
      if (nearest !== hover) {
        hover = nearest;
        canvas.style.cursor = nearest ? "pointer" : "crosshair";
        draw(performance.now());
      }
    });
    canvas.addEventListener("pointerleave", () => {
      hover = null;
      draw(performance.now());
    });

    if (reduce) draw(0);
    else requestAnimationFrame(loop);

    return {
      setActivity(next) {
        Object.assign(activity, next);
        if (reduce) draw(0);
      },
    };
  })();

  function brainActivityFrom(data) {
    const now = data.now || {};
    const tasks = data.tasks || {};
    const school = data.school || {};
    const failing = Number(now.jobs_failing) || 0;
    const issues = (Number(now.homelab_issues_bad) || 0) + (Number(now.homelab_issues_warn) || 0);
    const overdue = Number(tasks.overdue) || 0;
    const upcoming = Number(school.upcoming) || 0;
    const nowMin = nowMinutesLA();
    let calendar = 0.35;
    for (const event of data.calendar?.events || []) {
      const hours = parseHours(event.time);
      if (hours === null) continue;
      const minutes = hours * 60;
      if (minutes >= nowMin - 10 && minutes <= nowMin + 45) calendar = 1;
    }
    return {
      HERMES: failing > 0 ? 1 : 0.3,
      HOMELAB: issues > 0 ? 1 : 0.25,
      CALENDAR: calendar,
      TASKS: overdue > 0 ? 1 : 0.35,
      SCHOOL: Math.min(0.9, 0.25 + upcoming / 10),
      VAULT: 0.55,
      PROJECTS: 0.3,
    };
  }

  function apply(data, source) {
    const isPublic = !!data.public;
    sourceLabel = source === "LIVE" ? "LIVE" : "SNAPSHOT";
    $("source").textContent = isPublic ? "PUBLIC" : source;
    $("sdot").className = "sdot" + (isPublic ? " public" : source === "SNAPSHOT" ? " snapshot" : "");
    $("signin").hidden = !isPublic;
    renderCalendar(data, isPublic);
    renderTasks(data, isPublic);
    renderSchool(data, isPublic);
    renderPulse(data);
    BRAIN.setActivity(brainActivityFrom(data));
    generatedAt = data.generated_at || null;
    updateAge();
  }

  async function load() {
    const isWall = location.pathname.endsWith(".html") || location.protocol === "file:";
    if (!isWall) {
      try {
        apply(await getJSON("/dashboard/data"), "SNAPSHOT");
        return;
      } catch {
        /* fall through to a local payload */
      }
    }
    try {
      apply(await getJSON("./dashboard.json"), "LIVE");
      return;
    } catch {
      /* fall through */
    }
    try {
      apply(await getJSON("/dashboard.json"), "LIVE");
      return;
    } catch {
      /* fall through */
    }
    $("source").textContent = "OFFLINE";
    $("sdot").className = "sdot offline";
    $("events").innerHTML = `<div class="empty">data unavailable</div>`;
    $("tasks").innerHTML = `<div class="empty">—</div>`;
    $("school").innerHTML = `<div class="empty">—</div>`;
    $("pulse").textContent = "STATUS UNAVAILABLE";
    $("dot").className = "dot";
    $("railevents").innerHTML = "";
  }

  function renderForecast(daily) {
    const times = Array.isArray(daily.time) ? daily.time : [];
    if (times.length < 2) {
      $("forecast").hidden = true;
      return;
    }
    const highs = times.map((_, i) => Number(daily.temperature_2m_max?.[i]));
    const lows = times.map((_, i) => Number(daily.temperature_2m_min?.[i]));
    const top = Math.max(...highs.filter(Number.isFinite));
    const bottom = Math.min(...lows.filter(Number.isFinite));
    const span = Math.max(1, top - bottom);
    const rows = [];
    for (let i = 1; i < Math.min(times.length, 4); i += 1) {
      const day = new Intl.DateTimeFormat("en-US", {
        timeZone: LA, weekday: "short",
      }).format(new Date(`${times[i]}T12:00:00`)).toUpperCase();
      const code = Number(daily.weather_code?.[i]);
      const high = highs[i];
      const low = lows[i];
      const offset = ((low - bottom) / span) * 100;
      const width = Math.max(6, ((high - low) / span) * 100);
      rows.push(`
        <div class="frow">
          <span class="fday">${esc(day)}</span>
          <span class="ficon">${iconFor(code, 1)}</span>
          <span class="fbar"><i style="left:${offset}%;width:${width}%"></i></span>
          <span class="fhl">${Math.round(high)}° / ${Math.round(low)}°</span>
        </div>`);
    }
    $("frows").innerHTML = rows.join("");
    $("forecast").hidden = rows.length === 0;
  }

  async function weather() {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=37.3382&longitude=-121.8863"
      + "&current=temperature_2m,is_day,weather_code"
      + "&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset"
      + "&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles&forecast_days=4";
    try {
      const data = await getJSON(url);
      const current = data.current || {};
      const daily = data.daily || {};
      const code = Number(current.weather_code);
      const temp = Math.round(Number(current.temperature_2m));
      const high = Math.round(Number(daily.temperature_2m_max?.[0]));
      const low = Math.round(Number(daily.temperature_2m_min?.[0]));

      $("wtemp").textContent = Number.isFinite(temp) ? `${temp}°` : "—°";
      $("wcond").textContent = WMO[code] || "WEATHER";
      $("wicon").innerHTML = iconFor(code, current.is_day);
      $("tlo").textContent = Number.isFinite(low) ? `${low}°` : "—";
      $("thi").textContent = Number.isFinite(high) ? `${high}°` : "—";
      if (Number.isFinite(temp) && Number.isFinite(high) && Number.isFinite(low) && high > low) {
        const pct = Math.max(0, Math.min(100, ((temp - low) / (high - low)) * 100));
        $("tfill").style.width = `${pct}%`;
        $("tmark").style.left = `calc(${pct}% - 1px)`;
      }

      const rise = daily.sunrise?.[0];
      const set = daily.sunset?.[0];
      sunRiseMin = wallMinutes(rise);
      sunSetMin = wallMinutes(set);
      if (sunRiseMin !== null && sunSetMin !== null) {
        $("sunrise").textContent = fmtClock(rise);
        $("sunset").textContent = fmtClock(set);
        updateSun();
        $("sunarc").hidden = false;
      } else {
        $("sunarc").hidden = true;
      }
      renderForecast(daily);
    } catch {
      $("wcond").textContent = "WEATHER UNAVAILABLE";
      $("wicon").innerHTML = ICONS.cloud;
      $("tlo").textContent = "—";
      $("thi").textContent = "—";
      $("sunarc").hidden = true;
      $("forecast").hidden = true;
    }
  }

  clock();
  setInterval(clock, 1000);
  load();
  setInterval(load, 300000);
  weather();
  setInterval(weather, 900000);
})();
