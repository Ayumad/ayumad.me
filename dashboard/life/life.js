/* life.js — one screen, no dependencies. Time is live; weather comes from
   Open-Meteo; everything personal comes from the dashboard snapshot. The
   public projection only carries counts, so signed-out visitors see a teaser. */
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

  const GLYPH = {
    0: "☀", 1: "☀", 2: "⛅", 3: "☁",
    45: "▒", 48: "▒",
    51: "☂", 53: "☂", 55: "☂", 56: "☂", 57: "☂",
    61: "☂", 63: "☂", 65: "☂", 66: "☂", 67: "☂",
    71: "❄", 73: "❄", 75: "❄", 77: "❄", 85: "❄", 86: "❄",
    80: "☂", 81: "☂", 82: "☂",
    95: "ϟ", 96: "ϟ", 99: "ϟ",
  };

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

  function updateAge() {
    if (!generatedAt) {
      $("updated").textContent = "—";
      return;
    }
    const minutes = Math.max(0, Math.round((Date.now() - Date.parse(generatedAt)) / 60000));
    if (!Number.isFinite(minutes)) {
      $("updated").textContent = "—";
    } else if (minutes < 1) {
      $("updated").textContent = "DATA NOW";
    } else if (minutes < 60) {
      $("updated").textContent = `DATA ${minutes}M AGO`;
    } else {
      $("updated").textContent = `DATA ${Math.round(minutes / 60)}H AGO`;
    }
  }

  function clock() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: LA, hour: "numeric", minute: "2-digit", hour12: true,
    }).formatToParts(now);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    $("clock").textContent = `${get("hour")}:${get("minute")}`;
    $("ampm").textContent = get("dayPeriod").toUpperCase();
    $("dayline").textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: LA, weekday: "long", month: "long", day: "numeric", year: "numeric",
    }).format(now).toUpperCase();
    $("hdate").textContent = new Intl.DateTimeFormat("en-US", {
      timeZone: LA, weekday: "short", month: "short", day: "numeric",
    }).format(now).toUpperCase();
    updateAge();
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

  function renderCalendar(data, isPublic) {
    const events = Array.isArray(data.calendar?.events) ? data.calendar.events : [];
    const count = Number.isFinite(data.calendar?.count) ? data.calendar.count : events.length;
    $("calmeta").textContent = count ? `${count} EVENT${count === 1 ? "" : "S"}` : "CLEAR";

    if (isPublic) {
      const next = events.find((e) => e.time && e.time !== "all-day")?.time;
      $("events").innerHTML = `
        <div class="pub">
          <div class="pub-n">${count}</div>
          <div class="pub-l">EVENTS TODAY</div>
          ${next ? `<div class="pub-x">NEXT ${esc(next)}</div>` : `<div class="pub-x">NO TIMED EVENTS</div>`}
          <div class="pub-s">SIGN IN FOR DETAILS</div>
        </div>`;
      renderWeek(data.calendar?.week_count ?? 0, true);
      return;
    }

    if (!events.length) {
      $("events").innerHTML = `<div class="empty">clear day</div>`;
      renderWeek(data.calendar?.week, false);
      return;
    }

    const today = todayKey();
    const tomorrow = dayKey(1);
    const rows = events.slice(0, 6).map((event) => {
      const allDay = event.time === "all-day";
      const sortDate = String(event.sort || "").slice(0, 10);
      const dueLater = allDay && sortDate > today;
      const dueLabel = sortDate === tomorrow ? "DUE TOMORROW" : "DUE SOON";
      const label = allDay ? (dueLater ? dueLabel : "ALL DAY") : event.time || "—";
      return `
        <div class="ev">
          <div class="ev-t ${allDay ? "allday" : ""}">${esc(label)}</div>
          <div>
            <div class="ev-n">${esc(event.summary || "untitled")}</div>
            <div class="ev-c">${esc(calLabel(event.cal))}</div>
          </div>
        </div>`;
    }).join("");
    const more = events.length > 6
      ? `<div class="more">+ ${events.length - 6} MORE</div>`
      : "";
    $("events").innerHTML = rows + more;
    renderWeek(data.calendar?.week, false);
  }

  function renderWeek(week, isPublic) {
    const block = $("week");
    const rows = $("weekrows");
    const meta = $("weekmeta");

    if (isPublic) {
      const count = Number(week) || 0;
      block.hidden = count === 0;
      meta.textContent = `${count} ITEMS`;
      rows.innerHTML = count
        ? `<div class="wpub">NEXT 7 DAYS · ${count} ITEMS · SIGN IN FOR DETAILS</div>`
        : "";
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
    block.hidden = days.length === 0;
    meta.textContent = items.length ? `${items.length} ITEMS` : "";
    rows.innerHTML = days.map(([date, events]) => {
      const day = date
        ? new Intl.DateTimeFormat("en-US", {
            timeZone: "UTC", weekday: "short", month: "short", day: "numeric",
          }).format(new Date(`${date}T12:00:00Z`)).toUpperCase()
        : "—";
      const lead = events.length > 1 ? `${events.length} ITEMS · ` : "";
      return `
        <div class="wrow">
          <span class="wday">${esc(day)}</span>
          <span class="wname">${lead}${esc(events[0].summary || "untitled")}</span>
        </div>`;
    }).join("");
  }

  function renderTasks(data, isPublic) {
    const tasks = data.tasks || {};
    const open = Number(tasks.open) || 0;
    const overdue = Number(tasks.overdue) || 0;
    $("taskmeta").textContent = `${open} OPEN`;

    if (isPublic) {
      $("tasks").innerHTML = `<div class="row-count">${open} OPEN · ${overdue} OVERDUE</div>`;
      return;
    }

    const items = Array.isArray(tasks.items) ? tasks.items.slice(0, 4) : [];
    $("tasks").innerHTML = items.length
      ? items.map((item) => `
          <div class="row">
            <div class="row-t">${esc(item.title || "untitled")}</div>
            <div class="row-m ${item.overdue ? "bad" : ""}">${item.overdue ? "OVERDUE" : esc(fmtDate(item.due) || "NO DATE")}</div>
          </div>`).join("")
      : `<div class="empty">clear</div>`;
  }

  function renderSchool(data, isPublic) {
    const school = data.school || {};
    const upcoming = Number(school.upcoming) || 0;
    $("schoolmeta").textContent = `${upcoming} UPCOMING`;

    if (isPublic) {
      $("school").innerHTML = `<div class="row-count">${upcoming} UPCOMING</div>`;
      return;
    }

    const next = Array.isArray(school.next) ? school.next.slice(0, 2) : [];
    $("school").innerHTML = next.length
      ? next.map((item) => `
          <div class="row">
            <div class="row-t">${esc(item.title || item.course || "untitled")}</div>
            <div class="row-m ${item.overdue ? "bad" : ""}">${esc(item.course || "")}${item.due ? ` · ${esc(fmtDate(item.due))}` : ""}</div>
          </div>`).join("")
      : `<div class="empty">clear</div>`;
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

    $("pmeta").textContent = [
      `${Number(now.jobs_total) || 0} JOBS`,
      `${Number(now.containers_running) || 0} CONTAINERS`,
      `${Number(now.devices_online) || 0}/${Number(now.devices_total) || 0} DEVICES`,
    ].join(" · ");
  }

  function apply(data, source) {
    const isPublic = !!data.public;
    $("source").textContent = isPublic ? "PUBLIC" : source;
    $("signin").hidden = !isPublic;
    renderCalendar(data, isPublic);
    renderTasks(data, isPublic);
    renderSchool(data, isPublic);
    renderPulse(data);
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
    $("events").innerHTML = `<div class="empty">data unavailable</div>`;
    $("tasks").innerHTML = `<div class="empty">—</div>`;
    $("school").innerHTML = `<div class="empty">—</div>`;
    $("pulse").textContent = "STATUS UNAVAILABLE";
    $("dot").className = "dot";
  }

  function renderForecast(daily) {
    const times = Array.isArray(daily.time) ? daily.time : [];
    const rows = [];
    for (let i = 1; i < Math.min(times.length, 4); i += 1) {
      const day = new Intl.DateTimeFormat("en-US", {
        timeZone: LA, weekday: "short",
      }).format(new Date(`${times[i]}T12:00:00`)).toUpperCase();
      const code = Number(daily.weather_code?.[i]);
      const high = Math.round(Number(daily.temperature_2m_max?.[i]));
      const low = Math.round(Number(daily.temperature_2m_min?.[i]));
      rows.push(`
        <div class="frow">
          <span class="fday">${esc(day)}</span>
          <span class="fcond">${esc(WMO[code] || "—")}</span>
          <span class="fhl">${high}° / ${low}°</span>
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
      $("whl").textContent = `H ${Number.isFinite(high) ? high : "—"}° · L ${Number.isFinite(low) ? low : "—"}°`;
      $("wglyph").textContent = (!current.is_day && code === 0) ? "☾" : (GLYPH[code] || "·");
      renderForecast(daily);
    } catch {
      $("wcond").textContent = "WEATHER UNAVAILABLE";
      $("whl").textContent = "—";
    }
  }

  clock();
  setInterval(clock, 1000);
  load();
  setInterval(load, 300000);
  weather();
  setInterval(weather, 900000);
})();
